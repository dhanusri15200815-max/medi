import React, { useState } from 'react';
import { Settings, Languages, BookOpen, Volume2, ShieldCheck, CheckCircle2, RotateCcw } from 'lucide-react';
import { TargetLanguage, ReadingLevel, SUPPORTED_LANGUAGES } from '../types';

interface Props {
  currentLanguage: TargetLanguage;
  currentLevel: ReadingLevel;
  onPreferencesChange: (lang: TargetLanguage, level: ReadingLevel) => void;
}

export const SettingsPage: React.FC<Props> = ({
  currentLanguage,
  currentLevel,
  onPreferencesChange,
}) => {
  const [lang, setLang] = useState<TargetLanguage>(currentLanguage);
  const [level, setLevel] = useState<ReadingLevel>(currentLevel);
  const [speechRate, setSpeechRate] = useState('0.95');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onPreferencesChange(lang, level);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-full">
            Preferences & Accessibility
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-serif">
          Settings & Language Defaults
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Configure default translation preferences, text-to-speech audio speed, and system guidelines.
        </p>
      </div>

      {saved && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        {/* Language Default */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Languages className="w-4 h-4 text-teal-600" />
            <span>Default Target Language</span>
          </label>
          <p className="text-xs text-slate-500">
            Selected language automatically fills the translator dropdown on the Home page.
          </p>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as TargetLanguage)}
            className="w-full sm:w-80 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {(Object.keys(SUPPORTED_LANGUAGES) as TargetLanguage[]).map((key) => {
              const item = SUPPORTED_LANGUAGES[key];
              return (
                <option key={key} value={key}>
                  {item.name} — {item.nativeName}
                </option>
              );
            })}
          </select>
        </div>

        {/* Reading Level Default */}
        <div className="space-y-2 pt-4 border-t border-slate-100">
          <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>Default Reading Level</span>
          </label>
          <p className="text-xs text-slate-500">
            Choose your default explanation complexity level.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {[
              { id: 'standard', title: 'Standard', desc: 'Medically informative' },
              { id: 'simple', title: 'Simple', desc: 'Easy general patient language' },
              { id: 'very_simple', title: 'Very Simple', desc: 'Short sentences & basic words' },
            ].map((lvl) => (
              <button
                key={lvl.id}
                type="button"
                onClick={() => setLevel(lvl.id as ReadingLevel)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  level === lvl.id
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-1 ring-emerald-500'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs font-bold">{lvl.title}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{lvl.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Speech Audio Speed */}
        <div className="space-y-2 pt-4 border-t border-slate-100">
          <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-indigo-600" />
            <span>Text-to-Speech Speed Rate</span>
          </label>
          <p className="text-xs text-slate-500">
            Pace for listening to audio readouts of simplified instructions.
          </p>
          <select
            value={speechRate}
            onChange={(e) => setSpeechRate(e.target.value)}
            className="w-full sm:w-80 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="0.8">Gentle Slow (0.8x) — Recommended for elderly or second-language learners</option>
            <option value="0.95">Standard Pace (0.95x)</option>
            <option value="1.1">Brisk (1.1x)</option>
          </select>
        </div>

        <div className="pt-4 flex items-center justify-end">
          <button
            type="submit"
            id="save-settings-btn"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Save Preferences
          </button>
        </div>
      </form>

      {/* Safety & Compliance Policy */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2 text-xs text-slate-600">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Patient Safety Core Directives</span>
        </h3>
        <ul className="space-y-1 list-disc pl-4 text-[11px] leading-relaxed">
          <li>MedClarity is built to explain clinical text in simple words, not prescribe or diagnose.</li>
          <li>All medication names, milligram dosages, and schedules are strictly preserved unmodified.</li>
          <li>Dietary charts are only generated when supported by source documents.</li>
          <li>Always consult your personal physician before altering any medical treatment.</li>
        </ul>
      </div>
    </div>
  );
};
