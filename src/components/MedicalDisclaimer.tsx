import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface Props {
  compact?: boolean;
}

export const MedicalDisclaimer: React.FC<Props> = ({ compact = false }) => {
  if (compact) {
    return (
      <div id="medical-disclaimer-compact" className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>
          <strong>Educational Only:</strong> MedClarity simplifies medical documents to assist patient understanding. It does not provide medical diagnoses or replace doctor consultations.
        </span>
      </div>
    );
  }

  return (
    <div id="medical-disclaimer-banner" className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 text-emerald-900 text-sm flex items-start gap-3 shadow-xs">
      <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-700 shrink-0 mt-0.5">
        <ShieldAlert className="w-5 h-5" />
      </div>
      <div>
        <h4 className="font-semibold text-emerald-950 text-sm mb-0.5">
          Patient Education & Safety Notice
        </h4>
        <p className="text-xs text-emerald-800 leading-relaxed">
          MedClarity helps you understand medical notes, prescriptions, and instructions in clear, patient-friendly terms. 
          This tool <strong>never diagnoses conditions</strong> and <strong>never replaces professional medical advice</strong>. 
          Always follow the direct counsel of your licensed healthcare provider and report emergency symptoms to emergency services.
        </p>
      </div>
    </div>
  );
};
