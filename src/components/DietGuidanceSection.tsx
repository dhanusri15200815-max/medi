import React from 'react';
import { 
  Utensils, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  HeartHandshake, 
  ArrowRight,
  Info
} from 'lucide-react';
import { DietSection } from '../types';

interface Props {
  diet: DietSection;
  onNavigateToDedicated?: () => void;
  showDedicatedLink?: boolean;
}

export const DietGuidanceSection: React.FC<Props> = ({ 
  diet, 
  onNavigateToDedicated,
  showDedicatedLink = false 
}) => {
  // Extract items cleanly from new and backwards-compatible fields
  const rawEatMore = diet?.foods_to_include || diet?.eat_more || diet?.foods_to_take_more || diet?.what_to_take_more || [];
  const rawAvoid = diet?.foods_to_limit_or_avoid || diet?.avoid || diet?.what_to_avoid_or_limit || [];
  const rawHelps = (diet?.healthy_choices && diet.healthy_choices.length > 0)
    ? diet.healthy_choices
    : (diet?.helps_improve_health || diet?.health_improvement || []);

  const formatItem = (entry: any): { item: string; reason?: string } => {
    if (typeof entry === 'string') {
      return { item: entry };
    }
    if (typeof entry === 'object' && entry !== null) {
      return {
        item: entry.food || entry.item || entry.name || '',
        reason: entry.reason || entry.description || '',
      };
    }
    return { item: String(entry || '') };
  };

  const eatMoreItems = rawEatMore.map(formatItem).filter(i => i.item.trim().length > 0);
  const avoidItems = rawAvoid.map(formatItem).filter(i => i.item.trim().length > 0);
  const helpsItems = (Array.isArray(rawHelps) ? rawHelps : [rawHelps])
    .map(formatItem)
    .filter(i => i.item.trim().length > 0);

  if (diet?.how_it_can_help && helpsItems.length === 0) {
    helpsItems.push({ item: diet.how_it_can_help });
  }

  const isRelevant = Boolean(
    diet?.relevant ?? 
    diet?.diet_relevant ?? 
    diet?.diet_guidance_relevant ?? 
    (eatMoreItems.length > 0 || avoidItems.length > 0 || helpsItems.length > 0)
  );

  const medicalNote = diet?.doctor_dietitian_note || diet?.medical_note || diet?.general_note || "For personalized dietary advice, consult a qualified healthcare professional or registered dietitian.";
  const notApplicableMessage = diet?.diet_summary || diet?.not_applicable_message || "Specific dietary guidance cannot be determined from the provided medical information.";

  return (
    <div id="section-diet-guidance" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${isRelevant ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight uppercase">
                DIET & NUTRITION GUIDANCE
              </h2>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                isRelevant 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                  : 'bg-slate-100 text-slate-700 border-slate-300'
              }`}>
                {isRelevant ? 'Clinically Relevant' : 'Not Applicable'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Strictly derived from your provided medical document without inventing advice
            </p>
          </div>
        </div>

        {showDedicatedLink && onNavigateToDedicated && (
          <button
            type="button"
            onClick={onNavigateToDedicated}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
          >
            <span>Dedicated View</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* When Diet is NOT Relevant */}
      {!isRelevant ? (
        <div className="p-6 rounded-xl bg-slate-50 border border-slate-200/80 text-center space-y-4">
          <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 max-w-lg mx-auto">
            <h3 className="text-sm sm:text-base font-bold text-slate-800">
              {notApplicableMessage}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              The provided medical information does not contain specific dietary recommendations. MedClarity only displays dietary advice when explicitly supported by your clinical report.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-200/60 max-w-md mx-auto">
            <div className="flex items-start justify-center gap-2 text-xs font-medium text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
              <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{medicalNote}</span>
            </div>
          </div>
        </div>
      ) : (
        /* Structured Sections */
        <div className="space-y-5">
          {/* Summary & Medical Conditions */}
          {(diet?.diet_summary || (diet?.medical_conditions && diet.medical_conditions.length > 0)) && (
            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2">
              {diet?.medical_conditions && diet.medical_conditions.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">
                    Relevant Conditions:
                  </span>
                  {diet.medical_conditions.map((cond, i) => (
                    <span key={i} className="px-2 py-0.5 bg-emerald-100/80 text-emerald-900 text-xs font-semibold rounded-md border border-emerald-200">
                      {cond}
                    </span>
                  ))}
                </div>
              )}
              {diet?.diet_summary && (
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                  {diet.diet_summary}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. THINGS TO EAT MORE */}
            <div className="p-5 rounded-xl bg-emerald-50/40 border border-emerald-200 space-y-3">
              <div className="flex items-center gap-2 border-b border-emerald-200/60 pb-2.5">
                <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-emerald-950 uppercase tracking-wide">
                    1. THINGS TO EAT MORE
                  </h3>
                  <p className="text-[11px] text-emerald-700">
                    Recommended foods supported by your medical records
                  </p>
                </div>
              </div>

              {eatMoreItems.length > 0 ? (
                <ul className="space-y-2 pl-1">
                  {eatMoreItems.map((entry, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-900">
                      <span className="text-emerald-600 font-bold text-base leading-none">•</span>
                      <span className="leading-relaxed">
                        <span className="font-semibold">{entry.item}</span>
                        {entry.reason && (
                          <span className="text-slate-600 text-xs block pl-0.5">
                            {entry.reason}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic p-2">
                  No specific additional foods are explicitly prescribed in the document.
                </p>
              )}
            </div>

            {/* 2. THINGS TO AVOID / LIMIT */}
            <div className="p-5 rounded-xl bg-rose-50/40 border border-rose-200 space-y-3">
              <div className="flex items-center gap-2 border-b border-rose-200/60 pb-2.5">
                <div className="p-1.5 bg-rose-100 text-rose-800 rounded-lg">
                  <XCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-rose-950 uppercase tracking-wide">
                    2. THINGS TO AVOID / LIMIT
                  </h3>
                  <p className="text-[11px] text-rose-700">
                    Foods, drinks, or items to reduce or avoid
                  </p>
                </div>
              </div>

              {avoidItems.length > 0 ? (
                <ul className="space-y-2 pl-1">
                  {avoidItems.map((entry, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-900">
                      <span className="text-rose-600 font-bold text-base leading-none">•</span>
                      <span className="leading-relaxed">
                        <span className="font-semibold">{entry.item}</span>
                        {entry.reason && (
                          <span className="text-slate-600 text-xs block pl-0.5">
                            {entry.reason}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic p-2">
                  No specific dietary restrictions or avoidances were mentioned in the document.
                </p>
              )}
            </div>
          </div>

          {/* 3. THINGS THAT MAY HELP IMPROVE HEALTH */}
          {helpsItems.length > 0 && (
            <div className="p-5 rounded-xl bg-blue-50/40 border border-blue-200 space-y-3">
              <div className="flex items-center gap-2 border-b border-blue-200/60 pb-2.5">
                <div className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-blue-950 uppercase tracking-wide">
                    3. THINGS THAT MAY HELP IMPROVE HEALTH
                  </h3>
                  <p className="text-[11px] text-blue-700">
                    Dietary habits and nutritional strategies that support your recovery
                  </p>
                </div>
              </div>
              <ul className="space-y-2 pl-1">
                {helpsItems.map((entry, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-900">
                    <span className="text-blue-600 font-bold text-base leading-none">•</span>
                    <span className="leading-relaxed font-medium">{entry.item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Hydration Guidance */}
          {diet?.hydration_guidance && (
            <div className="p-4 rounded-xl bg-cyan-50/50 border border-cyan-200 space-y-1">
              <span className="text-xs font-bold text-cyan-950 uppercase tracking-wide">
                Hydration Guidance
              </span>
              <p className="text-xs sm:text-sm text-slate-800 font-medium">
                {diet.hydration_guidance}
              </p>
            </div>
          )}

          {/* Important Notes */}
          {diet?.important_notes && diet.important_notes.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2">
              <span className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                Important Dietary Notes
              </span>
              <ul className="space-y-1 pl-1">
                {diet.important_notes.map((note, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-900">
                    <span className="text-amber-600 font-bold">•</span>
                    <span className="font-medium leading-relaxed">{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Medical Guidance Note */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2 text-xs text-slate-700">
            <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{medicalNote}</span>
          </div>
        </div>
      )}
    </div>
  );
};
