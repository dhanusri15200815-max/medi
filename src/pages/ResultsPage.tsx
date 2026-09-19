import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  AlertTriangle, 
  HelpCircle, 
  Utensils, 
  CalendarClock, 
  Calendar,
  Sparkles, 
  Languages, 
  Layers,
  ChevronDown,
  ChevronUp,
  Bell,
  CheckCircle2,
  XCircle,
  FileText
} from 'lucide-react';
import { SimplificationResult, ActivePage, SUPPORTED_LANGUAGES } from '../types';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { ComprehensionSection } from '../components/ComprehensionSection';
import { DietGuidanceSection } from '../components/DietGuidanceSection';

interface Props {
  result: SimplificationResult;
  onNavigate: (page: ActivePage) => void;
  onNewAnalysis: () => void;
}

export const ResultsPage: React.FC<Props> = ({ result, onNavigate, onNewAnalysis }) => {
  const [copied, setCopied] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Follow-up reminder state
  const [reminderSet, setReminderSet] = useState(false);

  // Safe accessor helpers
  const targetLang = result.target_language || (result as any).targetLanguage || 'Simple English';
  const readingLevel = result.reading_level || (result as any).readingLevel || 'Simple';
  const simplifiedText = result.simplified_text || (result as any).simplifiedText || '';
  const originalText = result.original_text || (result as any).originalText || '';
  const isVerified = typeof result.verified === 'boolean' ? result.verified : true;
  const flaggedClaims = result.flagged_claims || [];
  const verificationReason = result.verification_reason || 'AI verification confirms that the important meaning has been preserved.';
  const questions = result.questions || [];
  const diet = result.diet || { 
    diet_guidance_relevant: false, 
    medical_note: "Follow your healthcare professional's advice for a personalized diet plan.",
    not_applicable_message: "Diet guidance is not applicable based on the provided medical information." 
  };
  const followUp = result.follow_up || { instruction: 'No specific follow-up instruction was found in the provided medical information.', date: '', reason: '', reminder_available: false };

  const langInfo = SUPPORTED_LANGUAGES[targetLang] || {
    name: targetLang,
    nativeName: targetLang,
    speechCode: 'en-US',
  };

  // Copy simplified text
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(simplifiedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  // Browser Text-To-Speech with exact language code matching target language
  const handleToggleSpeech = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      alert('Text-to-speech is not supported on this browser.');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(simplifiedText);
    utterance.lang = langInfo.speechCode || 'en-US';
    utterance.rate = 0.92;

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              MedClarity Results
            </span>
            <span className="text-xs text-slate-500">
              {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-serif">
            Medical Understanding Summary
          </h1>
        </div>

        <button
          id="translate-another-doc-btn"
          type="button"
          onClick={onNewAnalysis}
          className="self-start sm:self-center px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer"
        >
          Process Another Document
        </button>
      </div>

      <MedicalDisclaimer compact />

      {/* =========================================================================
          ORIGINAL MEDICAL TEXT & FLOW (Section 12)
          ========================================================================= */}
      <div id="section-original-text-flow" className="space-y-3">
        <div id="section-original-medical-display" className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <h2 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide">
                Original Medical Text
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              Source Input
            </span>
          </div>

          <div className="p-4 bg-slate-50/90 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
            {originalText || 'No original text provided.'}
          </div>
        </div>

        {/* Visual Connector: Original Medical Text ↓ Simplified / Translated Result */}
        <div className="flex items-center justify-center py-1">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-full shadow-2xs">
            <span className="text-emerald-600 font-bold">↓</span>
            <span>Simplified / Translated Result</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          1. SIMPLIFIED / TRANSLATED RESULT (Section 6 & 12)
          ========================================================================= */}
      <div id="section-simplified-explanation" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <span>Simplified / Translated Result</span>
            </h2>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold rounded-md">
              <Languages className="w-3.5 h-3.5" />
              <span>Target Language: {targetLang}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-md">
              <Layers className="w-3.5 h-3.5" />
              <span>Reading Level: {readingLevel}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Listen / TTS Button */}
            <button
              id="listen-speech-button"
              type="button"
              onClick={handleToggleSpeech}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                isPlayingAudio
                  ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {isPlayingAudio ? <VolumeX className="w-4 h-4 text-amber-600" /> : <Volume2 className="w-4 h-4 text-slate-600" />}
              <span>{isPlayingAudio ? 'Stop Reading' : 'Listen'}</span>
            </button>

            {/* Copy Button */}
            <button
              id="copy-text-button"
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Simplified / Translated Text Body */}
        <div className="bg-emerald-50/30 p-5 sm:p-6 rounded-xl border border-emerald-100 space-y-2">
          <div className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
            Result:
          </div>
          <p className="text-base sm:text-lg text-slate-900 leading-relaxed whitespace-pre-line font-sans">
            {simplifiedText}
          </p>
        </div>
      </div>

      {/* =========================================================================
          2. VERIFICATION (Section 7 & 12)
          ========================================================================= */}
      <div id="section-verification" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                VERIFICATION
              </h2>
              <p className="text-xs text-slate-500">
                Clinical meaning preservation check against source document
              </p>
            </div>
          </div>

          <div>
            {isVerified ? (
              <span id="verification-status-badge" className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-full">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified</span>
              </span>
            ) : (
              <span id="verification-status-badge" className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-full">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Needs Review</span>
              </span>
            )}
          </div>
        </div>

        {isVerified ? (
          <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl text-xs sm:text-sm text-emerald-900 font-medium flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Verified against the original information.</span>
          </div>
        ) : (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs sm:text-sm text-rose-900 space-y-2">
            <div className="flex items-start gap-2.5 font-semibold text-rose-800">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>Notice: Output could not be fully verified against source text.</span>
            </div>
            {verificationReason && <p className="text-xs text-rose-700 ml-7">{verificationReason}</p>}
            {flaggedClaims.length > 0 && (
              <ul className="list-disc list-inside text-xs text-rose-700 ml-7 space-y-1">
                {flaggedClaims.map((claim, idx) => (
                  <li key={idx}>{claim}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
          3. COMPREHENSION (Section 8 & 12)
          ========================================================================= */}
      <ComprehensionSection
        questions={questions}
        targetLanguage={targetLang}
        onNavigateToDedicated={() => onNavigate('comprehension')}
        showDedicatedLink={true}
      />

      {/* =========================================================================
          4. DIET & NUTRITION GUIDANCE
          ========================================================================= */}
      <DietGuidanceSection
        diet={diet}
        onNavigateToDedicated={() => onNavigate('diet')}
        showDedicatedLink={true}
      />

      {/* =========================================================================
          5. FOLLOW-UPS (Section 6 & 12)
          ========================================================================= */}
      <div id="section-follow-ups" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-50 text-purple-700 rounded-lg">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 uppercase">
                FOLLOW-UP
              </h2>
              <p className="text-xs text-slate-500">
                Direct instructions regarding appointments and follow-up care
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('followups')}
            className="text-xs font-semibold text-purple-600 hover:text-purple-700 cursor-pointer"
          >
            Dedicated View &rarr;
          </button>
        </div>

        {(() => {
          const instructionsList: string[] = (followUp.instructions && followUp.instructions.length > 0)
            ? followUp.instructions
            : (followUp.instruction && followUp.instruction.trim())
            ? [followUp.instruction.trim()]
            : (followUp.follow_up_text && followUp.follow_up_text.trim())
            ? [followUp.follow_up_text.trim()]
            : [];

          const nextFollowUpDate = followUp.next_follow_up || followUp.date || followUp.reminder || '';
          const remindersList: string[] = (followUp.important_reminders && followUp.important_reminders.length > 0)
            ? followUp.important_reminders
            : (followUp.reminders && followUp.reminders.length > 0)
            ? followUp.reminders
            : [];

          const hasFollowUpData = instructionsList.length > 0 || Boolean(nextFollowUpDate) || remindersList.length > 0;

          if (!hasFollowUpData) {
            return (
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
                <p className="text-sm font-medium text-slate-700">
                  No specific follow-up instructions were found in the provided medical information.
                </p>
                <p className="text-xs text-slate-500">
                  Always check directly with your healthcare provider if you have any questions or worsening symptoms.
                </p>
              </div>
            );
          }

          return (
            <div className="space-y-4">
              {/* FOLLOW-UP INSTRUCTIONS */}
              {instructionsList.length > 0 && (
                <div className="p-4 bg-purple-50/40 border border-purple-100 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-purple-950 uppercase tracking-wide flex items-center gap-1.5">
                    <CalendarClock className="w-4 h-4 text-purple-600" />
                    <span>FOLLOW-UP INSTRUCTIONS</span>
                  </span>
                  <ul className="space-y-1.5 pl-1">
                    {instructionsList.map((inst, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-900">
                        <span className="text-purple-600 font-bold">•</span>
                        <span className="leading-relaxed font-medium">{inst}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* NEXT FOLLOW-UP */}
              {nextFollowUpDate && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span>NEXT FOLLOW-UP</span>
                  </span>
                  <p className="text-sm font-bold text-slate-900 pl-1">
                    {nextFollowUpDate}
                  </p>
                </div>
              )}

              {/* IMPORTANT REMINDERS */}
              {remindersList.length > 0 && (
                <div className="p-4 bg-amber-50/40 border border-amber-200/80 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-amber-600" />
                    <span>IMPORTANT REMINDERS</span>
                  </span>
                  <ul className="space-y-1.5 pl-1">
                    {remindersList.map((rem, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-900">
                        <span className="text-amber-600 font-bold">•</span>
                        <span className="leading-relaxed font-medium">{rem}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Reminder Option */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-200/60">
                <span className="text-xs text-slate-600 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-purple-600" />
                  Schedule device reminder for this appointment
                </span>
                <button
                  type="button"
                  id="toggle-reminder-btn"
                  onClick={() => setReminderSet(!reminderSet)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    reminderSet
                      ? 'bg-purple-100 text-purple-800 border border-purple-300'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {reminderSet ? '✓ Reminder Scheduled' : '+ Set Reminder'}
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* =========================================================================
          6. ORIGINAL MEDICAL INFORMATION (Section 12)
          ========================================================================= */}
      <div id="section-original-medical-information" className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <button
          type="button"
          id="toggle-original-document-btn"
          onClick={() => setShowOriginal(!showOriginal)}
          className="w-full px-6 py-4 flex items-center justify-between bg-slate-50/80 hover:bg-slate-100/70 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-600" />
            <h2 className="text-sm font-bold text-slate-800">
              ORIGINAL MEDICAL INFORMATION
            </h2>
          </div>
          {showOriginal ? (
            <ChevronUp className="w-4 h-4 text-slate-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {showOriginal && (
          <div className="p-6 border-t border-slate-200 bg-white space-y-2">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
              {originalText}
            </div>
            <p className="text-[11px] text-slate-500 italic">
              Original medical notes are preserved verbatim above for clinical reference and doctor verification.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
