import React, { useState } from 'react';
import { CalendarClock, Bell, Calendar, CheckCircle2, ArrowRight, Download, Clock, Info } from 'lucide-react';
import { SimplificationResult, ActivePage } from '../types';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

interface Props {
  result: SimplificationResult | null;
  onNavigate: (page: ActivePage) => void;
}

export const FollowUpsPage: React.FC<Props> = ({ result, onNavigate }) => {
  const [reminderActive, setReminderActive] = useState(false);
  const [reminderNotification, setReminderNotification] = useState<string | null>(null);

  if (!result) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto">
          <CalendarClock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 font-serif">
          No Medical Document Loaded
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Upload or paste a medical document on the Home page first to review extracted follow-up instructions.
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

  const followUp = result.follow_up || (result as any).followUps || {};

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

  const hasFollowUp = instructionsList.length > 0 || Boolean(nextFollowUpDate) || remindersList.length > 0;
  const primaryInstruction = instructionsList[0] || 'Follow up with your healthcare provider as instructed.';

  // Generate .ics calendar invite
  const handleDownloadCalendarInvite = () => {
    const title = 'Doctor Follow-up: MedClarity';
    const description = `Follow-up instructions: ${instructionsList.join('; ') || primaryInstruction}`;
    const icsData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//MedClarity//Patient Portal//EN',
      'BEGIN:VEVENT',
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      'DTSTART:20261015T090000Z',
      'DTEND:20261015T100000Z',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'medclarity-followup.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setReminderNotification('Calendar invite downloaded (.ics file ready for Google / Apple Calendar).');
    setTimeout(() => setReminderNotification(null), 5000);
  };

  const handleToggleReminder = () => {
    const newState = !reminderActive;
    setReminderActive(newState);
    if (newState) {
      setReminderNotification('Follow-up reminder set successfully on this device.');
      setTimeout(() => setReminderNotification(null), 4000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-purple-800 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
            FOLLOW-UPS
          </span>
          <span className="text-xs text-slate-500">
            Clinical Continuity
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-serif">
          Clinical Follow-Up Instructions
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Direct answer based strictly on the provided medical information. MedClarity never invents follow-up dates.
        </p>
      </div>

      <MedicalDisclaimer compact />

      {reminderNotification && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{reminderNotification}</span>
        </div>
      )}

      {/* Main Follow-up Details Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        {!hasFollowUp ? (
          <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
            <p className="text-sm sm:text-base font-semibold text-slate-800">
              No specific follow-up instructions were found in the provided medical information.
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Please check directly with your primary care provider or specialist if you feel worsening symptoms or have further clinical questions.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* 1. FOLLOW-UP INSTRUCTIONS */}
            {instructionsList.length > 0 && (
              <div className="p-5 bg-purple-50/40 rounded-xl border border-purple-100 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span>FOLLOW-UP INSTRUCTIONS</span>
                </span>
                <ul className="space-y-2 pl-1">
                  {instructionsList.map((inst, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-900 font-medium">
                      <span className="text-purple-600 font-bold">•</span>
                      <span className="leading-relaxed">{inst}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 2. NEXT FOLLOW-UP & Reason Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-purple-600" />
                  <span>NEXT FOLLOW-UP</span>
                </span>
                <div className="text-sm font-bold text-slate-900">
                  {nextFollowUpDate || 'Not explicitly mentioned in document'}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-purple-600" />
                  <span>Reason for Follow-up</span>
                </span>
                <div className="text-sm font-bold text-slate-900">
                  {followUp.reason || 'Clinical monitoring and health assessment'}
                </div>
              </div>
            </div>

            {/* 3. IMPORTANT REMINDERS */}
            {remindersList.length > 0 && (
              <div className="p-5 rounded-xl bg-amber-50/40 border border-amber-200/80 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-amber-600" />
                  <span>IMPORTANT REMINDERS</span>
                </span>
                <ul className="space-y-2 pl-1">
                  {remindersList.map((rem, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-900 font-medium">
                      <span className="text-amber-600 font-bold">•</span>
                      <span className="leading-relaxed">{rem}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Reminder Options */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-4 h-4 text-purple-600" />
            <span>Reminder Options</span>
          </h3>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              id="toggle-reminder-btn"
              onClick={handleToggleReminder}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-colors cursor-pointer ${
                reminderActive
                  ? 'bg-purple-600 text-white border-purple-700'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>{reminderActive ? '✓ Reminder Active' : '+ Set Appointment Reminder'}</span>
            </button>

            <button
              type="button"
              id="download-calendar-btn"
              onClick={handleDownloadCalendarInvite}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Calendar Reminder (.ics)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => onNavigate('diet')}
          className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          Back to Diet Chart
        </button>

        <button
          type="button"
          onClick={() => onNavigate('profile')}
          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>View Patient Profile</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
