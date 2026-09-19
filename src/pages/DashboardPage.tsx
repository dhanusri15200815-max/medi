import React from 'react';
import { 
  FileText, 
  Languages, 
  BookOpen, 
  CalendarClock, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Plus
} from 'lucide-react';
import { SimplificationResult, ActivePage } from '../types';
import { getSavedReports, setCurrentReport } from '../services/storage';

interface Props {
  onNavigate: (page: ActivePage) => void;
  onSelectReport: (report: SimplificationResult) => void;
}

export const DashboardPage: React.FC<Props> = ({ onNavigate, onSelectReport }) => {
  const reports = getSavedReports();
  const totalProcessed = reports.length;
  const latestReport = reports[0] || null;

  // Pending follow-ups
  const pendingFollowUps = reports.filter((r) => {
    const fu = r.follow_up || (r as any).followUps;
    return fu && (fu.reminder_available || (fu as any).hasFollowUp) && fu.instruction;
  });

  const handleOpenReport = (report: SimplificationResult) => {
    setCurrentReport(report);
    onSelectReport(report);
    onNavigate('results');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Patient Activity
          </span>
          <span className="text-xs text-slate-500">
            Clinical Overview
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-serif">
          MedClarity Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Review your processed medical records, recent language outputs, and pending follow-ups.
        </p>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total documents processed */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Processed
            </span>
            <div id="stat-total-processed" className="text-2xl font-bold text-slate-900">
              {totalProcessed}
            </div>
          </div>
        </div>

        {/* Last selected language */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <Languages className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Last Language
            </span>
            <div id="stat-last-language" className="text-lg font-bold text-slate-900 truncate max-w-[140px]">
              {latestReport ? (latestReport.target_language || (latestReport as any).targetLanguage) : 'None'}
            </div>
          </div>
        </div>

        {/* Last reading level */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Last Reading Level
            </span>
            <div id="stat-last-level" className="text-lg font-bold text-slate-900 capitalize truncate max-w-[140px]">
              {latestReport ? (latestReport.reading_level || (latestReport as any).readingLevel || '').replace('_', ' ') : 'None'}
            </div>
          </div>
        </div>

        {/* Pending follow-ups */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <CalendarClock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Follow-Ups
            </span>
            <div id="stat-pending-tasks" className="text-2xl font-bold text-slate-900">
              {pendingFollowUps.length}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Records + Follow-up schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Recent Documents */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Recent Processed Documents
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Process New</span>
              </button>
            </div>

            {reports.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="text-sm font-semibold text-slate-700">No medical documents processed yet</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Paste a prescription or discharge summary on the Home page to get simplified explanations.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('home')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Start First Simplification
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.slice(0, 5).map((report, idx) => {
                  const targetLang = report.target_language || (report as any).targetLanguage || 'Simple English';
                  const readingLvl = report.reading_level || (report as any).readingLevel || 'Simple';
                  const dateStr = report.timestamp ? new Date(report.timestamp).toLocaleDateString() : 'Recent';
                  const textSnippet = report.simplified_text || (report as any).simplifiedText || '';

                  return (
                    <div
                      key={report.id || idx}
                      className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all space-y-2.5 cursor-pointer group"
                      onClick={() => handleOpenReport(report)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">
                            Medical Summary #{reports.length - idx}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                            {targetLang}
                          </span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 capitalize">
                            {readingLvl.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{dateStr}</span>
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed font-sans">
                        {textSnippet}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-500">
                        <span>{report.questions?.length || 0} comprehension checkpoints</span>
                        <span className="text-emerald-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                          <span>View Details</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Pending Follow-ups & Care Actions */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Pending Follow-Ups
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">
                {pendingFollowUps.length} Pending
              </span>
            </div>

            {pendingFollowUps.length === 0 ? (
              <div className="py-8 text-center bg-slate-50/70 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                No pending physician follow-up instructions recorded.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingFollowUps.slice(0, 4).map((item, i) => {
                  const fu = item.follow_up || (item as any).followUps;
                  const itemDate = item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Recent';
                  return (
                    <div 
                      key={i} 
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 cursor-pointer hover:bg-indigo-50/30 transition-colors"
                      onClick={() => handleOpenReport(item)}
                    >
                      <div className="flex items-center justify-between font-semibold text-slate-800">
                        <span className="text-indigo-900">
                          {fu.date || 'Physician Review'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {itemDate}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] line-clamp-2 leading-relaxed">
                        {fu.instruction}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={() => onNavigate('followups')}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
            >
              Open Full Follow-up Calendar
            </button>
          </div>

          {/* Quick Doctor Connect Card */}
          <div className="bg-teal-50/60 border border-teal-200/80 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-700" />
              <span>Questions About Your Records?</span>
            </h4>
            <p className="text-xs text-teal-800 leading-relaxed">
              Use the Doctor Connect feature to draft clear, structured inquiries for your next clinical consultation.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('doctor')}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Ask Doctor Question
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
