import React from 'react';
import { Utensils, ArrowRight } from 'lucide-react';
import { SimplificationResult, ActivePage } from '../types';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { DietGuidanceSection } from '../components/DietGuidanceSection';

interface Props {
  result: SimplificationResult | null;
  onNavigate: (page: ActivePage) => void;
}

export const DietChartPage: React.FC<Props> = ({ result, onNavigate }) => {
  if (!result) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto">
          <Utensils className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 font-serif">
          No Medical Document Loaded
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Please upload or paste a medical report on the Home page first so MedClarity can identify supported diet-related guidance.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors cursor-pointer"
        >
          <span>Go to Home Page</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const diet = result.diet || {
    diet_guidance_relevant: false,
    medical_note: "Follow your healthcare professional's advice for a personalized diet plan.",
    not_applicable_message: "Diet guidance is not applicable based on the provided medical information."
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            DIET & NUTRITION AGENT
          </span>
          <span className="text-xs text-slate-500">
            Evidence-Based Patient Guidance
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-serif">
          Diet-Related Guidance
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Nutritional guidance identified strictly from verified medical information.
        </p>
      </div>

      <MedicalDisclaimer compact />

      {/* Structured Diet Guidance Section */}
      <DietGuidanceSection diet={diet} showDedicatedLink={false} />

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => onNavigate('comprehension')}
          className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          Back to Comprehension
        </button>

        <button
          type="button"
          onClick={() => onNavigate('followups')}
          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>Go to Follow-ups</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
