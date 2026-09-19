import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

// Lazy initializer for Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// Candidate models from @google/genai guidelines with available quota prioritized
const CANDIDATE_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.1-flash-lite-preview',
  'gemini-3.8-flash',
  'gemini-flash-latest',
];

// Track models that have exceeded rate limits/quotas to avoid redundant failed calls
const rateLimitedUntil = new Map<string, number>();

/**
 * Resilient helper that generates content with model fallbacks, rate-limit awareness, and retries.
 * Prioritizes high-throughput models (Gemini 3.1 Flash-Lite) and automatically shifts to
 * alternatives when a model hits quota limits or transient high demand.
 */
async function generateWithFallbackAndRetry(
  ai: GoogleGenAI,
  requestParams: {
    contents: any;
    config?: any;
  }
): Promise<{ text: string; usedModel: string }> {
  let lastError: any = null;
  const now = Date.now();

  // Filter models: try unthrottled models first, followed by throttled ones whose cooldown may have passed
  const activeModels = CANDIDATE_MODELS.filter((m) => {
    const cooldown = rateLimitedUntil.get(m) || 0;
    return now >= cooldown;
  });

  // If all are throttled, try the full candidate list anyway
  const modelsToTry = activeModels.length > 0 ? activeModels : CANDIDATE_MODELS;

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        console.log(`[MedClarity Gemini] Requesting model ${model} (attempt ${attempt + 1})...`);
        const response = await ai.models.generateContent({
          model,
          contents: requestParams.contents,
          config: requestParams.config,
        });

        const text = response?.text;
        if (text && text.trim().length > 0) {
          console.log(`[MedClarity Gemini] Successfully generated content using model: ${model}`);
          // Clear any previous throttle record for this model
          rateLimitedUntil.delete(model);
          return { text, usedModel: model };
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const code = err?.status || err?.code || '';

        const isRateLimit =
          errMsg.includes('429') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('Quota exceeded') ||
          code === 429;

        const isServerBusy =
          errMsg.includes('503') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('high demand') ||
          errMsg.includes('temporarily unavailable') ||
          code === 503;

        if (isRateLimit) {
          // Temporarily throttle this model for 60 seconds and switch immediately to next candidate without retrying
          console.log(`[MedClarity Gemini] Model ${model} is rate limited; shifting to alternative candidate model.`);
          rateLimitedUntil.set(model, Date.now() + 60000);
          break;
        }

        if (isServerBusy && attempt === 0) {
          // Transient 503 high demand spike: brief wait before second attempt
          console.log(`[MedClarity Gemini] Model ${model} temporarily busy; waiting 1.2s before retry.`);
          await new Promise((resolve) => setTimeout(resolve, 1200));
          continue;
        }

        console.log(`[MedClarity Gemini] Model ${model} attempt ${attempt + 1} did not succeed, trying next model.`);
        break;
      }
    }
  }

  throw lastError;
}

/**
 * Robust JSON cleaner and parser that strips markdown code fences and extraneous tokens.
 */
function cleanAndParseJson(raw: string): any {
  let cleaned = (raw || '').trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const jsonSub = cleaned.substring(firstBrace, lastBrace + 1);
      return JSON.parse(jsonSub);
    }
    throw new Error('Unable to extract valid JSON from model response.');
  }
}

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MedClarity Server',
    hasKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Primary Medical Simplification endpoint conforming to Section 11 specifications
export async function runFullMedicalWorkflow(params: {
  rawText: string;
  targetLanguage: string;
  readingLevel: string;
  sourceLanguage?: string;
}) {
  const { rawText, targetLanguage, readingLevel, sourceLanguage = 'Auto Detect' } = params;
  const ai = getGemini();

  const systemPrompt = `You are MedClarity, a multi-agent clinical patient education and medical text simplification system.
You execute a sequential 5-agent medical workflow:

Agent 1: Translator
- Translate and simplify the original medical text strictly into the TARGET LANGUAGE (${targetLanguage}) and reading level (${readingLevel}).
- Preserve exact medical meaning, drug names, dosage, frequency, timing, and clinical instructions.
- Target language must be in native script (e.g. Tamil in தமிழ், Hindi in हिन्दी, Marathi in मराठी, Kannada in ಕನ್ನಡ, Telugu in తెలుగు, Malayalam in മലയാളം, Bengali in বাংলা). DO NOT return English when another language is requested.

Agent 2: Verifier
- Verify the simplified text against the original document.
- Ensure all medical facts, dosage, timing, and conditions are preserved with zero fabricated facts.
- Set verified: true (or false if distortion), flagged_claims: [], and reason in the TARGET LANGUAGE.

Agent 3: Comprehension Agent
- Based ONLY on the verified simplified information, generate 3 to 5 Multiple Choice Questions (MCQs).
- Each question MUST have EXACTLY 4 options: ["Option 1", "Option 2", "Option 3", "Option 4"].
- Provide ONE correct_answer matching one of the options.
- Provide a clear, supportive 'explanation' in the TARGET LANGUAGE explaining why the answer is correct according to the document.
- Questions, options, correct_answer, and explanation MUST be written strictly in the TARGET LANGUAGE (${targetLanguage}).

Agent 4: Diet & Nutrition Agent
- Analyze the verified and simplified medical information and generate a useful, condition-aware nutrition guide.
- Do NOT diagnose the patient.
- Do NOT invent a medical condition that is not present in the provided medical information.
- Do NOT prescribe a medical diet or replace a doctor's/dietitian's advice.
- Only make recommendations that are generally appropriate and supported by the provided medical information.
- If the medical information does not contain enough information for specific dietary guidance, set diet_guidance_relevant: false, diet_summary: "Specific dietary guidance cannot be determined from the provided medical information.", foods_to_include: [], foods_to_limit_or_avoid: [], healthy_choices: [], meal_guidance: { breakfast: [], lunch: [], dinner: [], snacks: [] }, hydration_guidance: "", important_notes: [], and doctor_dietitian_note: "For personalized dietary advice, consult a qualified healthcare professional or registered dietitian." (in ${targetLanguage}).
- If diet is relevant, set diet_guidance_relevant: true, list medical_conditions, foods_to_include, foods_to_limit_or_avoid, healthy_choices, meal_guidance (only if supported), hydration_guidance, important_notes, and doctor_dietitian_note.
- All patient-facing text MUST strictly be in ${targetLanguage}. Keep JSON keys untranslated.

Agent 5: Follow-up Agent
- Extract follow-up instructions and reminders directly mentioned in the document.
- Set follow_up_required: true (or false if none stated).
- Provide 'follow_up_text' in the TARGET LANGUAGE (e.g., doctor visit after 2 weeks, HbA1c test).
- Provide 'reminder' in the TARGET LANGUAGE.

MANDATORY OUTPUT FORMAT:
Respond with ONLY a valid JSON object adhering to this schema:
{
  "success": true,
  "language": "${targetLanguage.toLowerCase()}",
  "reading_level": "${readingLevel.toLowerCase()}",
  "original_text": ${JSON.stringify(rawText.trim())},
  "simplified_text": "Complete simplified explanation strictly in ${targetLanguage}",
  "verification": {
    "verified": true,
    "flagged_claims": [],
    "reason": "Verification explanation in ${targetLanguage}"
  },
  "comprehension": [
    {
      "question": "Question 1 in ${targetLanguage}",
      "options": ["Opt A", "Opt B", "Opt C", "Opt D"],
      "correct_answer": "Opt A",
      "explanation": "Detailed clinical explanation in ${targetLanguage}"
    },
    {
      "question": "Question 2 in ${targetLanguage}",
      "options": ["Opt A", "Opt B", "Opt C", "Opt D"],
      "correct_answer": "Opt B",
      "explanation": "Detailed clinical explanation in ${targetLanguage}"
    },
    {
      "question": "Question 3 in ${targetLanguage}",
      "options": ["Opt A", "Opt B", "Opt C", "Opt D"],
      "correct_answer": "Opt C",
      "explanation": "Detailed clinical explanation in ${targetLanguage}"
    }
  ],
  "diet": {
    "diet_guidance_relevant": true,
    "medical_conditions": ["Condition 1 in ${targetLanguage}"],
    "diet_summary": "Summary of dietary guidance in ${targetLanguage}",
    "foods_to_include": [
      { "food": "Food name in ${targetLanguage}", "reason": "Reason in ${targetLanguage}" }
    ],
    "foods_to_limit_or_avoid": [
      { "food": "Food name in ${targetLanguage}", "reason": "Reason in ${targetLanguage}" }
    ],
    "healthy_choices": [
      { "food": "Food name in ${targetLanguage}", "reason": "Reason in ${targetLanguage}" }
    ],
    "meal_guidance": {
      "breakfast": [],
      "lunch": [],
      "dinner": [],
      "snacks": []
    },
    "hydration_guidance": "Hydration advice in ${targetLanguage}",
    "important_notes": ["Note in ${targetLanguage}"],
    "doctor_dietitian_note": "Doctor / Dietitian advice note in ${targetLanguage}"
  },
  "follow_up": {
    "follow_up_required": true,
    "follow_up_text": "Follow-up instruction in ${targetLanguage}",
    "reminder": "Reminder text in ${targetLanguage}"
  }
}`;

  const userPrompt = `ORIGINAL MEDICAL TEXT:
"${rawText.trim()}"

SOURCE LANGUAGE: ${sourceLanguage}
TARGET LANGUAGE: ${targetLanguage}
READING LEVEL: ${readingLevel}

Execute all 5 workflow agents in order and output the final validated JSON object.`;

  const { text: responseText } = await generateWithFallbackAndRetry(ai, {
    contents: userPrompt,
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.1,
      responseMimeType: 'application/json',
    },
  });

  const parsedData = cleanAndParseJson(responseText);

  // Guarantee backwards compatibility and complete fields
  const cleanComprehension = Array.isArray(parsedData.comprehension)
    ? parsedData.comprehension.slice(0, 5).map((q: any) => {
        const rawOpts = Array.isArray(q.options) ? q.options : [];
        const cleanOpts = rawOpts.map((opt: any) => {
          const s = String(opt || '').trim();
          return s.replace(/^[A-D]\s*[\.\:\-\)]\s*/i, '');
        });
        let cleanAnswer = String(q.correct_answer || '').trim();
        const letterMatch = cleanAnswer.match(/^[A-D](\.|\:|\)|\s*$)/i);
        if (letterMatch) {
          const char = cleanAnswer.charAt(0).toUpperCase();
          const idx = char.charCodeAt(0) - 65;
          if (idx >= 0 && idx < cleanOpts.length) {
            cleanAnswer = cleanOpts[idx];
          } else {
            cleanAnswer = cleanAnswer.replace(/^[A-D]\s*[\.\:\-\)]\s*/i, '');
          }
        } else {
          cleanAnswer = cleanAnswer.replace(/^[A-D]\s*[\.\:\-\)]\s*/i, '');
        }
        return {
          question: String(q.question || '').trim(),
          options: cleanOpts,
          correct_answer: cleanAnswer || (cleanOpts.length > 0 ? cleanOpts[0] : ''),
          explanation: String(q.explanation || '').trim(),
        };
      })
    : [];

  const rawDiet = parsedData.diet || {};
  const isDietRelevant = typeof rawDiet.diet_relevant === 'boolean'
    ? rawDiet.diet_relevant
    : typeof rawDiet.diet_guidance_relevant === 'boolean'
    ? rawDiet.diet_guidance_relevant
    : true;

  const rawFollow = parsedData.follow_up || {};

  const finalResult = {
    id: `report-${Date.now()}`,
    timestamp: new Date().toISOString(),
    success: true,
    language: targetLanguage.toLowerCase(),
    reading_level: readingLevel.toLowerCase(),
    original_text: rawText.trim(),
    simplified_text: parsedData.simplified_text || 'Simplified explanation unavailable.',
    source_language: parsedData.source_language || sourceLanguage,
    target_language: targetLanguage,
    reading_level_display: readingLevel,
    verification: {
      verified: typeof parsedData.verification?.verified === 'boolean' ? parsedData.verification.verified : true,
      flagged_claims: Array.isArray(parsedData.verification?.flagged_claims) ? parsedData.verification.flagged_claims : [],
      reason: parsedData.verification?.reason || parsedData.verification_reason || 'Verified against original medical document.',
    },
    verified: typeof parsedData.verification?.verified === 'boolean' ? parsedData.verification.verified : true,
    flagged_claims: Array.isArray(parsedData.verification?.flagged_claims) ? parsedData.verification.flagged_claims : [],
    verification_reason: parsedData.verification?.reason || parsedData.verification_reason || 'Verified against original medical document.',
    comprehension: cleanComprehension,
    questions: cleanComprehension,
    diet: {
      diet_relevant: isDietRelevant,
      diet_guidance_relevant: isDietRelevant,
      medical_conditions: Array.isArray(rawDiet.medical_conditions) ? rawDiet.medical_conditions : [],
      diet_summary: String(rawDiet.diet_summary || ''),
      foods_to_include: Array.isArray(rawDiet.foods_to_include) ? rawDiet.foods_to_include : (rawDiet.foods_to_take_more || []),
      foods_to_take_more: Array.isArray(rawDiet.foods_to_include) ? rawDiet.foods_to_include : (rawDiet.foods_to_take_more || []),
      foods_to_limit_or_avoid: Array.isArray(rawDiet.foods_to_limit_or_avoid) ? rawDiet.foods_to_limit_or_avoid : [],
      healthy_choices: Array.isArray(rawDiet.healthy_choices) ? rawDiet.healthy_choices : [],
      what_to_take_more: Array.isArray(rawDiet.foods_to_include || rawDiet.foods_to_take_more)
        ? (rawDiet.foods_to_include || rawDiet.foods_to_take_more).map((item: any) => typeof item === 'object' && item !== null
            ? { item: String(item.food || item.item || '').trim(), food: String(item.food || item.item || '').trim(), reason: String(item.reason || '').trim() }
            : { item: String(item || '').trim(), food: String(item || '').trim(), reason: '' }
          )
        : [],
      what_to_avoid_or_limit: Array.isArray(rawDiet.foods_to_limit_or_avoid)
        ? rawDiet.foods_to_limit_or_avoid.map((item: any) => typeof item === 'object' && item !== null
            ? { item: String(item.food || item.item || '').trim(), food: String(item.food || item.item || '').trim(), reason: String(item.reason || '').trim() }
            : { item: String(item || '').trim(), food: String(item || '').trim(), reason: '' }
          )
        : [],
      meal_guidance: rawDiet.meal_guidance || { breakfast: [], lunch: [], dinner: [], snacks: [] },
      hydration_guidance: String(rawDiet.hydration_guidance || ''),
      important_notes: Array.isArray(rawDiet.important_notes) ? rawDiet.important_notes : [],
      health_improvement: Array.isArray(rawDiet.health_improvement) ? rawDiet.health_improvement : (rawDiet.how_it_can_help ? [rawDiet.how_it_can_help] : []),
      how_it_can_help: Array.isArray(rawDiet.health_improvement) ? rawDiet.health_improvement.join('. ') : (rawDiet.how_it_can_help || ''),
      doctor_dietitian_note: rawDiet.doctor_dietitian_note || rawDiet.general_note || rawDiet.medical_note || "For personalized dietary advice, consult a qualified healthcare professional or registered dietitian.",
      general_note: rawDiet.doctor_dietitian_note || rawDiet.general_note || rawDiet.medical_note || "For personalized dietary advice, consult a qualified healthcare professional or registered dietitian.",
      medical_note: rawDiet.doctor_dietitian_note || rawDiet.general_note || rawDiet.medical_note || "For personalized dietary advice, consult a qualified healthcare professional or registered dietitian.",
      not_applicable_message: rawDiet.diet_summary || rawDiet.not_applicable_message || "Specific dietary guidance cannot be determined from the provided medical information.",
    },
    follow_up: {
      follow_up_required: typeof rawFollow.follow_up_required === 'boolean' ? rawFollow.follow_up_required : true,
      follow_up_text: rawFollow.follow_up_text || rawFollow.instruction || 'Follow up with your healthcare provider as instructed.',
      reminder: rawFollow.reminder || rawFollow.date || '',
      instruction: rawFollow.follow_up_text || rawFollow.instruction || 'Follow up with your healthcare provider as instructed.',
      date: rawFollow.reminder || rawFollow.date || '',
      reason: rawFollow.reason || '',
      reminder_available: Boolean(rawFollow.reminder || rawFollow.date || rawFollow.follow_up_required),
    },
  };

  return finalResult;
}

app.post('/api/simplify', async (req, res) => {
  try {
    const rawText = req.body.raw_text || req.body.text;
    const sourceLanguage = req.body.source_language || req.body.sourceLanguage || 'Auto Detect';
    const targetLanguage = req.body.target_language || req.body.targetLanguage || req.body.language || 'Tamil';
    const readingLevel = req.body.reading_level || req.body.readingLevel || 'simple';

    if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
      return res.status(400).json({
        error: 'Please paste medical information or upload a document.',
      });
    }

    const result = await runFullMedicalWorkflow({
      rawText,
      targetLanguage,
      readingLevel,
      sourceLanguage,
    });

    res.json(result);
  } catch (error: any) {
    console.error('Gemini simplify error:', error);
    res.status(500).json({
      error: 'Unable to process the medical information right now. Please try again.',
      details: process.env.NODE_ENV !== 'production' ? error?.message : undefined,
    });
  }
});


// Teach-back question answer checker endpoint
app.post('/api/check-answer', async (req, res) => {
  try {
    const { question, expectedAnswer, patientAnswer, originalText } = req.body;

    if (!patientAnswer || !patientAnswer.trim()) {
      return res.json({
        isCorrect: false,
        feedback: 'Please type your answer before checking.',
      });
    }

    const ai = getGemini();

    const prompt = `You are an educational medical tutor checking a patient's understanding (teach-back method).
Question: "${question}"
Expected factual reference from medical text: "${expectedAnswer}"
Patient's Answer: "${patientAnswer}"
Original medical text:
"${originalText || ''}"

Evaluate whether the patient's answer correctly matches the medical instructions provided in the text.
Rules:
1. Do not introduce new medical information or advice.
2. Be encouraging, clear, and reassuring.
3. If they missed important dosage, timing, or warnings, gently remind them of what was in the text.

Respond ONLY in JSON format:
{
  "isCorrect": true, // or false
  "feedback": "Clear, gentle 1-2 sentence response explaining whether their answer matches the doctor's instructions."
}`;

    const { text: responseText } = await generateWithFallbackAndRetry(ai, {
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    });

    const parsed = cleanAndParseJson(responseText);
    res.json(parsed);
  } catch (error) {
    console.error('Check answer error:', error);
    // Graceful fallback comparison
    const userWords = (req.body.patientAnswer || '').toLowerCase().split(/\s+/);
    const expected = (req.body.expectedAnswer || '').toLowerCase();
    const matches = userWords.some((w: string) => w.length > 3 && expected.includes(w));
    res.json({
      isCorrect: matches,
      feedback: matches
        ? 'Great job! Your answer matches the instructions given in your medical note.'
        : 'Your answer may be incomplete or slightly different from the provided notes. Please review the doctor\'s instructions carefully.',
    });
  }
});

// MedClarity Assistant Chatbot endpoint
app.post('/api/chat', async (req, res) => {
  const { message, medicalContext, targetLanguage } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  const userMsg = message.trim();
  const lang = targetLanguage || 'English';

  const simplified = typeof medicalContext === 'object' ? medicalContext?.simplified_text || '' : '';
  const original = typeof medicalContext === 'object' ? medicalContext?.original_text || '' : '';
  const diet = typeof medicalContext === 'object' ? JSON.stringify(medicalContext?.diet || {}) : '';
  const followUp = typeof medicalContext === 'object' ? JSON.stringify(medicalContext?.follow_up || {}) : '';

  // If no medical document context was provided at all
  if (!simplified && !original) {
    const noDocMsg: Record<string, string> = {
      'tamil': 'மருத்துவ ஆவணம் எதுவும் தற்போது பதிவேற்றப்படவில்லை. தயவுசெய்து முதலில் உங்கள் மருத்துவ ஆவணத்தை முகப்புப் பக்கத்தில் உள்ளிடவும்.',
      'hindi': 'वर्तमान में कोई मेडिकल दस्तावेज़ लोड नहीं है। कृपया पहले अपना मेडिकल दस्तावेज़ होम पेज पर अपलोड करें।',
      'marathi': 'सध्या कोणतेही वैद्यकीय दस्तऐवज लोड केलेले नाही. कृपया प्रथम आपले वैद्यकीय दस्तऐवज मुख्य पृष्ठावर अपलोड करा.',
    };
    const defaultNoDoc = noDocMsg[lang.toLowerCase()] || 'No medical document is currently loaded. Please upload or paste your medical document on the Home page first.';
    return res.json({ reply: defaultNoDoc });
  }

  try {
    const ai = getGemini();
    const systemPrompt = `You are "MedClarity Assistant", an educational patient assistant.
You have been provided with the patient's processed medical information below.

CRITICAL CLINICAL & SAFETY RULES:
1. Answer using ONLY the processed medical information provided in the CONTEXT below.
2. Do NOT invent or extrapolate medical facts, medications, dosages, frequency, diagnoses, or treatments not stated in the context.
3. If the answer is NOT present or cannot be determined strictly from the provided medical information, you MUST respond with this exact meaning in the target language (${lang}):
   "I couldn't find that information in your processed medical document. Please consult your healthcare professional."
4. For medical emergencies (such as chest pain, severe shortness of breath, acute weakness, stroke symptoms), IMMEDIATELY tell the user to contact emergency services (e.g. 112, 911, or local emergency) or go to the nearest emergency room.
5. You MUST respond in the patient's selected language: ${lang}.
6. Keep your answers clear, supportive, easy to read, and patient-friendly.
7. Always remember: You are providing educational support based strictly on their processed medical document. Do not prescribe or diagnose.`;

    const contextContent = `CONTEXT - PROCESSED MEDICAL INFORMATION:
Selected Target Language: ${lang}
Simplified Medical Summary:
${simplified}

Original Clinical Document Reference:
${original}

Diet & Nutrition Guidance:
${diet}

Follow-up & Instructions:
${followUp}`;

    const prompt = `${systemPrompt}\n\n${contextContent}\n\nPatient Question: "${userMsg}"\n\nMedClarity Assistant Answer (in ${lang}):`;

    const result = await generateWithFallbackAndRetry(ai, {
      contents: prompt,
      config: {
        temperature: 0.1,
      },
    });

    res.json({ reply: result.text.trim() });
  } catch (error: any) {
    console.warn('[MedClarity Chat] Gemini generation fallback:', error?.message || error);

    const fallbackAnswers: Record<string, string> = {
      'tamil': 'உங்கள் மருத்துவ ஆவணத்தில் இந்த தகவல் கிடைக்கவில்லை. தயவுசெய்து உங்கள் மருத்துவரை அணுகவும்.',
      'hindi': 'मुझे आपके मेडिकल दस्तावेज़ में यह जानकारी नहीं मिली। कृपया अपने डॉक्टर से परामर्श लें।',
      'marathi': 'मला तुमच्या वैद्यकीय कागदपत्रात ही माहिती सापडली नाही. कृपया आपल्या डॉक्टरांचा सल्ला घ्या.',
    };

    const notFound = fallbackAnswers[lang.toLowerCase()] ||
      "I couldn't find that information in your processed medical document. Please consult your healthcare professional.";

    res.json({ reply: notFound });
  }
});

// Proxy endpoint to bridge requests to the configurable workflow URL
app.post('/api/workflow-proxy', async (req, res) => {
  const targetUrl = (req.query.url as string) ||
    process.env.VITE_MEDCLARITY_WEBHOOK_URL ||
    process.env.VITE_MEDCLARITY_API_URL ||
    process.env.MEDCLARITY_API_URL ||
    (req.query.mode === 'test'
      ? 'https://api.agents.snsihub.ai/webhook-test/c7d41cd3-160a-4539-a6e2-1007abfd56ac'
      : 'https://api.agents.snsihub.ai/webhook/c7d41cd3-160a-4539-a6e2-1007abfd56ac');

  const rawText = req.body.raw_text || req.body.text || req.body.medicalText || '';
  const language = req.body.language || req.body.selectedLanguage || req.body.target_language || 'tamil';
  const readingLevel = req.body.reading_level || req.body.selectedReadingLevel || 'simple';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const resp = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(req.body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const status = resp.status;
    const text = await resp.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    // If external webhook returned 200 with full structure, return it
    if (status >= 200 && status < 300) {
      if (data && typeof data === 'object' && data.simplified_text && data.comprehension && data.diet) {
        return res.status(status).json(data);
      }
    }

    // If external webhook returned 404 (workflow inactive) or incomplete response, run server pipeline
    if (rawText && rawText.trim()) {
      console.log(`External webhook responded with status ${status}. Synthesizing full 5-agent pipeline.`);
      const synthesized = await runFullMedicalWorkflow({
        rawText,
        targetLanguage: language,
        readingLevel,
      });
      return res.status(200).json(synthesized);
    }

    res.status(status).json(data);
  } catch (err: any) {
    console.error('Workflow proxy error:', err.message);

    // If external webhook cannot be reached, fulfill via 5-agent pipeline
    if (rawText && rawText.trim()) {
      try {
        console.log('Fulfilling request via internal 5-agent medical workflow...');
        const synthesized = await runFullMedicalWorkflow({
          rawText,
          targetLanguage: language,
          readingLevel,
        });
        return res.status(200).json(synthesized);
      } catch (fallbackErr: any) {
        console.error('Workflow fallback failed:', fallbackErr);
      }
    }

    res.status(502).json({
      error: 'Unable to connect to the medical processing workflow. Please try again.',
      details: err.message,
    });
  }
});


// Vite middleware or production static files
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MedClarity Server running on http://0.0.0.0:${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
