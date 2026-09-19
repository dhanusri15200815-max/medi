import { 
  SimplificationResult, 
  SourceLanguage, 
  TargetLanguage, 
  ReadingLevel, 
  QuestionItem, 
  DietSection, 
  FollowUpSection,
  VerificationSection,
  DietItemWithReason,
  MealGuidance
} from '../types';

/**
 * Section 2: Configurable Webhook URL for MedClarity workflow.
 * Can be overridden via VITE_MEDCLARITY_WEBHOOK_URL or VITE_MEDCLARITY_API_URL in environment.
 * Default: Production webhook URL.
 */
export const WEBHOOK_URL: string =
  (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_MEDCLARITY_WEBHOOK_URL || import.meta.env?.VITE_MEDCLARITY_API_URL)) ||
  (typeof process !== 'undefined' && (process.env?.VITE_MEDCLARITY_WEBHOOK_URL || process.env?.VITE_MEDCLARITY_API_URL || process.env?.MEDCLARITY_API_URL)) ||
  'https://api.agents.snsihub.ai/webhook/c7d41cd3-160a-4539-a6e2-1007abfd56ac';

// Aliases for backwards compatibility across the app
export const API_URL = WEBHOOK_URL;
export const PRODUCTION_WEBHOOK_URL = WEBHOOK_URL;

export interface SimplifyRequest {
  raw_text?: string;
  medicalText?: string;
  text?: string;
  language?: string;
  selectedLanguage?: string;
  target_language?: TargetLanguage;
  targetLanguage?: TargetLanguage;
  source_language?: SourceLanguage;
  sourceLanguage?: SourceLanguage;
  reading_level?: string;
  selectedReadingLevel?: string;
  readingLevel?: ReadingLevel;
}

export function normalizeReadingLevel(level?: string): string {
  if (!level) return 'simple';
  const clean = level.trim().toLowerCase();
  if (clean.includes('very')) return 'very_simple';
  if (clean.includes('stand')) return 'standard';
  return 'simple';
}

export function normalizeLanguage(lang?: string): string {
  if (!lang) return 'tamil';
  const clean = lang.trim().toLowerCase();
  if (clean === 'simple english' || clean === 'simple_english') return 'simple english';
  return clean;
}

/**
 * Recursively unpacks and parses JSON strings, nested JSON objects, markdown wrappers,
 * and Gemini/workflow response containers.
 */
export function parseJsonSafe(val: any, maxDepth = 6): any {
  if (maxDepth <= 0 || val === null || val === undefined) return val;

  if (typeof val === 'string') {
    let trimmed = val.trim();

    // Strip markdown code fences
    if (trimmed.startsWith('```')) {
      trimmed = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    }

    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      try {
        const parsed = JSON.parse(trimmed);
        return parseJsonSafe(parsed, maxDepth - 1);
      } catch {
        const firstBrace = trimmed.indexOf('{');
        const lastBrace = trimmed.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          try {
            const parsed = JSON.parse(trimmed.substring(firstBrace, lastBrace + 1));
            return parseJsonSafe(parsed, maxDepth - 1);
          } catch {
            // Keep as string
          }
        }
      }
    }
    return trimmed;
  }

  if (Array.isArray(val)) {
    return val.map(item => parseJsonSafe(item, maxDepth - 1));
  }

  if (typeof val === 'object' && val !== null) {
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      res[k] = parseJsonSafe(v, maxDepth - 1);
    }
    return res;
  }

  return val;
}

/**
 * Safely extracts clean human-readable text from any string or object.
 * Strictly avoids outputting raw JSON brackets, quotation marks, or technical keys.
 */
export function extractCleanHumanText(raw: any): string {
  if (raw === null || raw === undefined) return '';

  if (typeof raw !== 'string') {
    if (Array.isArray(raw)) {
      return raw.map(extractCleanHumanText).filter(Boolean).join('\n');
    }
    if (typeof raw === 'object') {
      if (raw.simplified_text) return extractCleanHumanText(raw.simplified_text);
      if (raw.translated_text) return extractCleanHumanText(raw.translated_text);
      if (raw.instruction) return extractCleanHumanText(raw.instruction);
      if (raw.instructions) return extractCleanHumanText(raw.instructions);
      if (raw.next_follow_up) return extractCleanHumanText(raw.next_follow_up);
      if (raw.follow_up_text) return extractCleanHumanText(raw.follow_up_text);
      if (raw.text) return extractCleanHumanText(raw.text);
      return Object.values(raw).map(extractCleanHumanText).filter(Boolean).join(' ');
    }
    return String(raw);
  }

  let text = raw.trim();

  // Strip code fences
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  // Attempt parse if it looks like JSON
  if ((text.startsWith('{') && text.endsWith('}')) || (text.startsWith('[') && text.endsWith(']'))) {
    try {
      const parsed = JSON.parse(text);
      return extractCleanHumanText(parsed);
    } catch {
      text = text
        .replace(/^[{\[]\s*/, '')
        .replace(/\s*[}\]]$/, '')
        .replace(/"[a-zA-Z0-9_-]+":\s*/g, '')
        .replace(/[{}\[\]"]/g, '')
        .trim();
    }
  }

  // Filter out any technical execution IDs or metadata lines
  text = text.replace(/"executionId"\s*:\s*"[^"]*",?/g, '');
  text = text.replace(/"status"\s*:\s*"[^"]*",?/g, '');
  text = text.replace(/"success"\s*:\s*(true|false),?/g, '');

  return text.trim();
}

/**
 * Cleanly transforms any string or object structure into an array of clean readable strings.
 */
export function cleanStringList(val: any): string[] {
  if (!val) return [];

  if (Array.isArray(val)) {
    const list: string[] = [];
    for (const item of val) {
      if (!item) continue;
      if (typeof item === 'string') {
        const cleaned = extractCleanHumanText(item);
        if (cleaned) list.push(cleaned);
      } else if (typeof item === 'object') {
        const itemText = item.item || item.name || item.food || item.text || item.instruction || '';
        const reasonText = item.reason || item.description || item.explanation || '';
        if (itemText && reasonText) {
          list.push(`${extractCleanHumanText(itemText)}: ${extractCleanHumanText(reasonText)}`);
        } else if (itemText) {
          list.push(extractCleanHumanText(itemText));
        } else {
          const joined = Object.values(item).map(extractCleanHumanText).filter(Boolean).join(' ');
          if (joined) list.push(joined);
        }
      }
    }
    return list;
  }

  if (typeof val === 'string') {
    const cleaned = extractCleanHumanText(val);
    if (!cleaned) return [];
    return cleaned
      .split(/\r?\n|•|\u2022|\- /)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  return [];
}

/**
 * Robust MedClarity response parser.
 * Unpacks nested JSON strings, Gemini parts, workflow envelopes, arrays,
 * and maps simplified_text, verification, comprehension, diet, and follow_up cleanly.
 */
function parseFullMedClarityResponse(data: any, originalInput: string = ''): {
  simplified_text: string;
  verification: VerificationSection;
  comprehension: QuestionItem[];
  diet: DietSection;
  follow_up: FollowUpSection;
  language?: string;
  reading_level?: string;
} | null {
  if (!data) return null;

  // Step 1: Deep JSON parse
  let target: any = parseJsonSafe(data);

  // Step 2: Unwrap standard workflow / n8n / webhook containers
  if (Array.isArray(target) && target.length > 0) {
    // If it's an array of nodes, merge them into one master object
    const merged: Record<string, any> = {};
    for (const el of target) {
      const node = el?.json || el;
      if (typeof node === 'object' && node !== null) {
        Object.assign(merged, node);
      }
    }
    target = Object.keys(merged).length > 0 ? merged : (target[0]?.json || target[0]);
  } else if (target && typeof target === 'object' && Array.isArray(target.items) && target.items.length > 0) {
    target = target.items[0]?.json || target.items[0];
  }

  if (target && typeof target === 'object') {
    if (target._responseData) target = target._responseData;
    if (target.result && typeof target.result === 'object' && !target.simplified_text) {
      target = { ...target, ...target.result };
    }
    if (target.data && typeof target.data === 'object' && !target.simplified_text) {
      target = { ...target, ...target.data };
    }
    if (target.response && typeof target.response === 'object') {
      target = { ...target, ...target.response };
    }
    if (target.body && typeof target.body === 'object') {
      target = { ...target, ...target.body };
    }
    if (target.output && typeof target.output === 'object') {
      target = { ...target, ...target.output };
    }
    if (target.content?.parts?.[0]?.text) {
      const parsedPart = parseJsonSafe(target.content.parts[0].text);
      if (typeof parsedPart === 'object' && parsedPart !== null) {
        target = { ...target, ...parsedPart };
      }
    }
  }

  // Handle case where target.output was a JSON string
  if (typeof target?.output === 'string') {
    const parsedOut = parseJsonSafe(target.output);
    if (typeof parsedOut === 'object' && parsedOut !== null) {
      target = { ...target, ...parsedOut };
    }
  }

  // Handle case where simplified_text itself is a stringified JSON object
  if (typeof target?.simplified_text === 'string') {
    const parsedSimp = parseJsonSafe(target.simplified_text);
    if (typeof parsedSimp === 'object' && parsedSimp !== null) {
      target = { ...target, ...parsedSimp };
      // If it has inner simplified_text, use it, else clear so we don't display raw JSON
      target.simplified_text = parsedSimp.simplified_text || parsedSimp.translated_text || '';
    }
  }

  // 1. SIMPLIFIED TEXT EXTRACTION & SANITIZATION
  let rawSimplifiedText = target?.simplified_text ||
    target?.translated_text ||
    target?.translation ||
    target?.patient_friendly_text ||
    target?.summary ||
    target?.text ||
    '';

  let simplifiedText = extractCleanHumanText(rawSimplifiedText);

  // 2. VERIFICATION MAPPING
  const rawVerification = target?.verification || target?.verifier || {};
  const isVerified = typeof rawVerification.verified === 'boolean'
    ? rawVerification.verified
    : typeof target?.verified === 'boolean'
    ? target.verified
    : true;

  const rawFlagged = rawVerification.flagged_claims || target?.flagged_claims || [];
  const flaggedClaims = cleanStringList(rawFlagged);

  const verificationReason = extractCleanHumanText(
    rawVerification.reason ||
    rawVerification.verification_reason ||
    target?.verification_reason ||
    target?.reason ||
    'Verified against the provided medical information.'
  );

  const verification: VerificationSection = {
    verified: isVerified,
    flagged_claims: flaggedClaims,
    reason: verificationReason,
  };

  // 3. COMPREHENSION MCQS MAPPING
  const rawComp = target?.comprehension || target?.questions || target?.mcqs || [];
  let compItems: any[] = [];

  if (Array.isArray(rawComp)) {
    compItems = rawComp;
  } else if (typeof rawComp === 'object' && rawComp !== null) {
    if (Array.isArray(rawComp.questions)) compItems = rawComp.questions;
    else if (Array.isArray(rawComp.mcqs)) compItems = rawComp.mcqs;
  }

  const comprehensionList: QuestionItem[] = [];
  for (const q of compItems) {
    if (!q || typeof q !== 'object') continue;
    const questionText = extractCleanHumanText(q.question || q.q);
    if (!questionText) continue;

    const rawOpts = Array.isArray(q.options) ? q.options : [];
    const cleanOpts = rawOpts.map((opt: any) => {
      const s = extractCleanHumanText(opt);
      return s.replace(/^[A-D]\s*[\.\:\-\)]\s*/i, '').trim();
    }).filter(Boolean);

    let cleanAnswer = extractCleanHumanText(q.correct_answer || q.correctAnswer || q.answer);
    const letterMatch = cleanAnswer.match(/^[A-D](\.|\:|\)|\s*$)/i);
    if (letterMatch) {
      const char = cleanAnswer.charAt(0).toUpperCase();
      const idx = char.charCodeAt(0) - 65;
      if (idx >= 0 && idx < cleanOpts.length) {
        cleanAnswer = cleanOpts[idx];
      } else {
        cleanAnswer = cleanAnswer.replace(/^[A-D]\s*[\.\:\-\)]\s*/i, '').trim();
      }
    } else {
      cleanAnswer = cleanAnswer.replace(/^[A-D]\s*[\.\:\-\)]\s*/i, '').trim();
    }

    const explanation = extractCleanHumanText(q.explanation || q.reason || q.feedback);

    comprehensionList.push({
      question: questionText,
      options: cleanOpts.length > 0 ? cleanOpts : ['Yes', 'No'],
      correct_answer: cleanAnswer || (cleanOpts.length > 0 ? cleanOpts[0] : 'Yes'),
      explanation,
    });
  }

  // 4. DIET & NUTRITION MAPPING
  const rawDiet = target?.diet_nutrition || target?.diet || target?.diet_guidance || target?.nutrition || target || {};
  const rawEatMore = rawDiet.foods_to_include || rawDiet.eat_more || rawDiet.foods_to_take_more || rawDiet.what_to_take_more || [];
  const rawAvoid = rawDiet.foods_to_limit_or_avoid || rawDiet.avoid || rawDiet.what_to_avoid_or_limit || [];
  const rawHealthyChoices = rawDiet.healthy_choices || [];
  const rawHelps = rawDiet.helps_improve_health || rawDiet.health_improvement || rawDiet.how_it_can_help || rawDiet.general_health_tips || [];

  const cleanEatMoreList = cleanStringList(rawEatMore);
  const cleanAvoidList = cleanStringList(rawAvoid);
  const cleanHealthyChoicesList = cleanStringList(rawHealthyChoices);
  const cleanHelpsList = cleanStringList(rawHelps);

  const cleanDietItems = (arr: any[]): DietItemWithReason[] => {
    if (!Array.isArray(arr)) return [];
    return arr.map((entry) => {
      if (typeof entry === 'object' && entry !== null) {
        return {
          item: extractCleanHumanText(entry.food || entry.item || entry.name || ''),
          food: extractCleanHumanText(entry.food || entry.item || entry.name || ''),
          reason: extractCleanHumanText(entry.reason || entry.description || entry.explanation || ''),
        };
      }
      const str = extractCleanHumanText(entry);
      return { item: str, food: str, reason: '' };
    }).filter(i => (i.item || i.food));
  };

  const isDietRelevant = typeof rawDiet.diet_guidance_relevant === 'boolean'
    ? rawDiet.diet_guidance_relevant
    : typeof rawDiet.diet_relevant === 'boolean'
    ? rawDiet.diet_relevant
    : typeof rawDiet.relevant === 'boolean'
    ? rawDiet.relevant
    : Boolean(cleanEatMoreList.length > 0 || cleanAvoidList.length > 0 || cleanHealthyChoicesList.length > 0);

  const rawDoctorDietitianNote = extractCleanHumanText(
    rawDiet.doctor_dietitian_note || rawDiet.medical_note || rawDiet.general_note
  );
  const rawDietSummary = extractCleanHumanText(rawDiet.diet_summary || '');
  const rawHydration = extractCleanHumanText(rawDiet.hydration_guidance || '');
  const rawImportantNotes = cleanStringList(rawDiet.important_notes || []);
  const rawConditions = cleanStringList(rawDiet.medical_conditions || []);

  const mealGuidance: MealGuidance = {
    breakfast: cleanStringList(rawDiet.meal_guidance?.breakfast),
    lunch: cleanStringList(rawDiet.meal_guidance?.lunch),
    dinner: cleanStringList(rawDiet.meal_guidance?.dinner),
    snacks: cleanStringList(rawDiet.meal_guidance?.snacks),
  };

  const diet: DietSection = {
    relevant: isDietRelevant,
    diet_relevant: isDietRelevant,
    diet_guidance_relevant: isDietRelevant,
    medical_conditions: rawConditions,
    diet_summary: rawDietSummary,
    foods_to_include: cleanEatMoreList,
    eat_more: cleanEatMoreList,
    avoid: cleanAvoidList,
    foods_to_limit_or_avoid: cleanAvoidList,
    healthy_choices: cleanHealthyChoicesList,
    helps_improve_health: cleanHelpsList,
    foods_to_take_more: cleanEatMoreList,
    what_to_take_more: cleanDietItems(rawEatMore),
    what_to_avoid_or_limit: cleanDietItems(rawAvoid),
    meal_guidance: mealGuidance,
    hydration_guidance: rawHydration,
    important_notes: rawImportantNotes,
    doctor_dietitian_note: rawDoctorDietitianNote || "For personalized dietary advice, consult a qualified healthcare professional or registered dietitian.",
    health_improvement: cleanHelpsList,
    how_it_can_help: cleanHelpsList.join('. '),
    general_note: rawDoctorDietitianNote,
    medical_note: rawDoctorDietitianNote || "Follow your healthcare professional's advice for a personalized diet plan.",
    not_applicable_message: rawDietSummary || extractCleanHumanText(rawDiet.not_applicable_message) || "Specific dietary guidance cannot be determined from the provided medical information.",
  };

  // 5. FOLLOW-UP MAPPING
  const rawFollow = target?.follow_up || target?.followUp || target?.followup || {};
  const rawFollowInstructions = rawFollow.instructions || rawFollow.instruction || rawFollow.follow_up_text || '';
  const cleanInstructionsList = cleanStringList(rawFollowInstructions);

  const nextFollowUpStr = extractCleanHumanText(
    rawFollow.next_follow_up || rawFollow.date || rawFollow.reminder || rawFollow.timeline
  );

  const rawReminders = rawFollow.important_reminders || rawFollow.reminders || rawFollow.reminder || [];
  const cleanRemindersList = cleanStringList(rawReminders);

  const followUpRequired = typeof rawFollow.follow_up_required === 'boolean'
    ? rawFollow.follow_up_required
    : Boolean(cleanInstructionsList.length > 0 || nextFollowUpStr || cleanRemindersList.length > 0);

  const primaryInstruction = cleanInstructionsList.length > 0
    ? cleanInstructionsList[0]
    : extractCleanHumanText(rawFollow.instruction || rawFollow.follow_up_text) ||
      'Follow all prescribed instructions provided by your healthcare provider.';

  const followUp: FollowUpSection = {
    follow_up_required: followUpRequired,
    follow_up_text: cleanInstructionsList.join('\n') || primaryInstruction,
    instruction: primaryInstruction,
    instructions: cleanInstructionsList,
    next_follow_up: nextFollowUpStr,
    important_reminders: cleanRemindersList,
    reminders: cleanRemindersList,
    date: nextFollowUpStr,
    reminder: nextFollowUpStr,
    reason: extractCleanHumanText(rawFollow.reason),
    reminder_available: Boolean(followUpRequired || nextFollowUpStr),
  };

  // If simplified_text was empty because the workflow returned follow_up directly:
  if (!simplifiedText) {
    if (cleanInstructionsList.length > 0) {
      simplifiedText = cleanInstructionsList.join('\n\n');
    } else if (diet.eat_more && diet.eat_more.length > 0) {
      simplifiedText = `Diet Guidance: ${diet.eat_more.join(', ')}`;
    }
  }

  return {
    simplified_text: simplifiedText,
    verification,
    comprehension: comprehensionList,
    diet,
    follow_up: followUp,
    language: target?.language,
    reading_level: target?.reading_level,
  };
}

/**
 * Primary medical text simplification service connected to the production workflow webhook.
 */
export async function simplifyMedicalText(request: SimplifyRequest): Promise<SimplificationResult> {
  const medicalText = (request.medicalText || request.raw_text || request.text || '').trim();
  if (!medicalText) {
    throw new Error('Please enter medical information or upload a document.');
  }

  const rawLanguage = 
    request.selectedLanguage || 
    request.language || 
    request.target_language || 
    request.targetLanguage || 
    'Tamil';

  const rawReadingLevel = 
    request.selectedReadingLevel || 
    request.reading_level || 
    request.readingLevel || 
    'simple';

  const selectedLanguage = normalizeLanguage(rawLanguage);
  const selectedReadingLevel = normalizeReadingLevel(rawReadingLevel);

  // Exact request payload structure
  const payload = {
    raw_text: medicalText,
    language: selectedLanguage,
    reading_level: selectedReadingLevel,
  };

  console.log("MEDCLARITY REQUEST:", {
    raw_text: medicalText,
    language: selectedLanguage,
    reading_level: selectedReadingLevel
  });

  let response: Response | null = null;
  let rawResponse = '';
  let data: any = null;

  // Direct fetch to configured WEBHOOK_URL
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (err: any) {
    console.warn("Direct webhook fetch failed, trying workflow proxy:", err.message);
  }

  // Fallback to server workflow proxy if direct fetch fails
  if (!response || !response.ok) {
    try {
      const proxyUrl = `/api/workflow-proxy?url=${encodeURIComponent(WEBHOOK_URL)}`;
      const proxyResp = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (proxyResp.ok) {
        response = proxyResp;
      } else if (!response) {
        response = proxyResp;
      }
    } catch (proxyErr: any) {
      console.warn("Workflow proxy call failed:", proxyErr.message);
    }
  }

  if (!response) {
    throw new Error('Unable to connect to the medical processing service. Please check your internet connection.');
  }

  console.log("WEBHOOK STATUS:", response.status);
  console.log("WEBHOOK CONTENT TYPE:", response.headers.get("content-type"));

  rawResponse = await response.text();
  console.log("RAW WEBHOOK RESPONSE:", rawResponse);

  if (!response.ok) {
    console.error(`Workflow returned HTTP ${response.status}:`, rawResponse);
    throw new Error('Unable to process your medical document right now. Please try again in a few moments.');
  }

  if (!rawResponse || !rawResponse.trim()) {
    throw new Error('The medical service returned an empty response. Please try processing the document again.');
  }

  try {
    data = JSON.parse(rawResponse);
  } catch {
    data = rawResponse;
  }

  // Parse mapped sections safely
  let parsed = parseFullMedClarityResponse(data, medicalText);

  // If simplified text was missing or partial, synthesize via server workflow fallback
  if (!parsed || !parsed.simplified_text || parsed.comprehension.length === 0) {
    try {
      const enrichResp = await fetch('/api/simplify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw_text: medicalText,
          target_language: rawLanguage,
          reading_level: rawReadingLevel,
          source_language: request.source_language || request.sourceLanguage || 'Auto Detect',
        }),
      });

      if (enrichResp.ok) {
        const enrichedData = await enrichResp.json();
        const enrichedParsed = parseFullMedClarityResponse(enrichedData, medicalText);
        if (enrichedParsed && enrichedParsed.simplified_text) {
          if (parsed && parsed.simplified_text) {
            enrichedParsed.simplified_text = parsed.simplified_text;
          }
          parsed = enrichedParsed;
          data = enrichedData;
        }
      }
    } catch (enrichErr) {
      console.warn("Enrichment fallback encountered error:", enrichErr);
    }
  }

  if (!parsed || !parsed.simplified_text) {
    console.error("Workflow result missing simplified_text. Raw data:", data);
    throw new Error('Some information could not be displayed. Please try processing the document again.');
  }

  const missingFields: string[] = [];
  if (!parsed.comprehension || parsed.comprehension.length === 0) missingFields.push('comprehension');
  if (!parsed.diet) missingFields.push('diet');
  if (!parsed.follow_up) missingFields.push('follow_up');

  if (missingFields.length > 0) {
    console.warn(`Diagnostic notice: Expected fields missing: ${missingFields.join(', ')}`);
  }

  const finalResult: SimplificationResult = {
    id: `report-${Date.now()}`,
    timestamp: new Date().toISOString(),
    success: true,
    language: selectedLanguage,
    reading_level: selectedReadingLevel,
    simplified_text: parsed.simplified_text,
    source_language: request.source_language || request.sourceLanguage || 'Auto Detect',
    target_language: rawLanguage as TargetLanguage,
    reading_level_display: rawReadingLevel as ReadingLevel,
    verification: parsed.verification,
    verified: parsed.verification.verified,
    flagged_claims: parsed.verification.flagged_claims,
    verification_reason: parsed.verification.reason,
    comprehension: parsed.comprehension,
    questions: parsed.comprehension,
    diet: parsed.diet,
    follow_up: parsed.follow_up,
    original_text: medicalText,
  } as any;

  // Section 17: Required Debug Validation Logs
  console.log("FINAL MEDCLARITY RESULT:", {
    success: true,
    language: selectedLanguage,
    reading_level: selectedReadingLevel,
    original_text: medicalText,
    simplified_text: finalResult.simplified_text,
    verification: finalResult.verification,
    comprehension: finalResult.comprehension,
    diet: finalResult.diet,
    follow_up: finalResult.follow_up
  });
  console.log("Simplified:", finalResult.simplified_text);
  console.log("Verification:", finalResult.verification);
  console.log("Comprehension:", finalResult.comprehension);
  console.log("Diet:", finalResult.diet);
  console.log("Follow-up:", finalResult.follow_up);

  // Section 17: Verify types
  if (!Array.isArray(finalResult.comprehension)) {
    console.error("Validation error: data.comprehension is not an array");
  }
  if (typeof finalResult.diet !== 'object' || finalResult.diet === null) {
    console.error("Validation error: data.diet is not an object");
  }
  if (typeof finalResult.follow_up !== 'object' || finalResult.follow_up === null) {
    console.error("Validation error: data.follow_up is not an object");
  }

  return finalResult;
}

export async function evaluateComprehensionAnswer(params: {
  question: string;
  expectedAnswer: string;
  patientAnswer: string;
  originalText: string;
}): Promise<{ isCorrect: boolean; feedback: string }> {
  try {
    const response = await fetch('/api/check-answer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('Unable to evaluate response.');
    }

    return await response.json();
  } catch {
    const userWords = (params.patientAnswer || '').toLowerCase().split(/\s+/);
    const expected = (params.expectedAnswer || '').toLowerCase();
    const hasMatch = userWords.some(w => w.length > 3 && expected.includes(w));
    return {
      isCorrect: hasMatch,
      feedback: hasMatch
        ? 'Your answer aligns well with the instructions in your medical summary.'
        : 'Your answer may be missing some key details mentioned in the document. Please review the doctor\'s instructions.',
    };
  }
}

/**
 * Sends a patient question to MedClarity Assistant with the current processed medical context.
 */
export async function sendChatMessage(params: {
  message: string;
  medicalContext: any;
  targetLanguage?: string;
}): Promise<string> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Chat request failed with status: ${response.status}`);
    }

    const data = await response.json();
    return data.reply || "I couldn't find that information in your processed medical document. Please consult your healthcare professional.";
  } catch (err: any) {
    console.warn('MedClarity Assistant chat error:', err?.message || err);
    return "I couldn't find that information in your processed medical document. Please consult your healthcare professional.";
  }
}
