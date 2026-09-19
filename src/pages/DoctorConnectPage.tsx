import React, { useState } from 'react';
import { Stethoscope, AlertTriangle, Send, CheckCircle2, Clock, MessageSquare, ShieldAlert, ArrowRight } from 'lucide-react';
import { UserProfile, DoctorInquiry, SimplificationResult, ActivePage } from '../types';
import { getDoctorInquiries, saveDoctorInquiry } from '../services/storage';

interface Props {
  currentUser: UserProfile;
  currentReport: SimplificationResult | null;
  onNavigate: (page: ActivePage) => void;
}

export const DoctorConnectPage: React.FC<Props> = ({ currentUser, currentReport, onNavigate }) => {
  const [question, setQuestion] = useState('');
  const [optionalMessage, setOptionalMessage] = useState('');
  const [urgency, setUrgency] = useState<DoctorInquiry['urgency']>('clarification');
  const [submittedInquiries, setSubmittedInquiries] = useState<DoctorInquiry[]>(() => getDoctorInquiries());
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!question.trim()) {
      setError('Please state your question or doubt clearly.');
      return;
    }

    const newInquiry: DoctorInquiry = {
      id: `inquiry-${Date.now()}`,
      patientId: currentUser.id,
      patientName: currentUser.fullName,
      patientEmail: currentUser.email,
      question: question.trim(),
      optionalMessage: optionalMessage.trim(),
      urgency,
      createdAt: new Date().toISOString(),
      status: 'Submitted',
      sourceReportId: currentReport?.id,
    };

    saveDoctorInquiry(newInquiry);
    setSubmittedInquiries(getDoctorInquiries());
    setQuestion('');
    setOptionalMessage('');
    setSubmitSuccess(true);
    setTimeout(() => setSubmitSuccess(false), 4500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
            Clinical Care Team
          </span>
          <span className="text-xs text-slate-500">
            Questions & Clarifications
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-serif">
          Doctor Connect
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          If any instruction in your medical report remains unclear, submit a direct query for your healthcare team.
        </p>
      </div>

      {/* CRITICAL EMERGENCY WARNING BANNER */}
      <div id="doctor-connect-emergency-notice" className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 text-rose-950 flex items-start gap-3 shadow-xs">
        <div className="p-2 bg-rose-200/80 rounded-xl text-rose-800 shrink-0 mt-0.5">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-sm text-rose-950">
            Emergency Care Disclaimer (Not for Emergencies)
          </h3>
          <p className="text-xs text-rose-900 leading-relaxed font-medium">
            This feature <strong>does NOT provide emergency medical care</strong>. 
            If you or someone you know is experiencing acute symptoms such as severe chest pain, shortness of breath, loss of consciousness, or allergic anaphylaxis, 
            <strong> call 911 or your local emergency hospital hotline immediately</strong>.
          </p>
        </div>
      </div>

      {submitSuccess && (
        <div id="doctor-request-success" className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs sm:text-sm text-emerald-900 flex items-start gap-2.5 shadow-2xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">Assistance Request Logged!</span>
            <p className="text-xs text-emerald-800">
              Your doctor assistance inquiry has been queued with your patient profile ({currentUser.fullName}). Your healthcare provider can review this alongside your clinical notes.
            </p>
          </div>
        </div>
      )}

      {/* Request Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">
              Ask Your Healthcare Provider
            </h3>
          </div>
          {currentReport && (
            <span className="text-[11px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
              Attached to current report ({currentReport.target_language || (currentReport as any).targetLanguage})
            </span>
          )}
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 font-medium">
            {error}
          </div>
        )}

        <form id="doctor-connect-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="doctor-question-input" className="block text-xs font-semibold text-slate-700 mb-1">
              Question or Doubt <span className="text-rose-500">*</span>
            </label>
            <input
              id="doctor-question-input"
              type="text"
              required
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Can I take Amlodipine before breakfast if I feel nauseous in the morning?"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label htmlFor="doctor-message-input" className="block text-xs font-semibold text-slate-700 mb-1">
              Optional Message / Details
            </label>
            <textarea
              id="doctor-message-input"
              rows={3}
              value={optionalMessage}
              onChange={(e) => setOptionalMessage(e.target.value)}
              placeholder="Include any symptoms, timeline, or specific questions about your medicine dosage..."
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="doctor-urgency-select" className="block text-xs font-semibold text-slate-700 mb-1">
                Inquiry Category
              </label>
              <select
                id="doctor-urgency-select"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="clarification">Prescription / Dosage Clarification</option>
                <option value="routine">Routine Follow-up Question</option>
                <option value="urgent">Non-Emergency Symptom Check</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                id="request-doctor-btn"
                type="submit"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Request Doctor Assistance</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* History of Doctor Inquiries */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          <span>Your Submitted Assistance Inquiries ({submittedInquiries.length})</span>
        </h3>

        {submittedInquiries.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No questions submitted yet. You can submit questions here whenever you have doubts regarding your care.
          </div>
        ) : (
          <div className="space-y-3">
            {submittedInquiries.map((inq) => (
              <div 
                key={inq.id} 
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{inq.question}</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold rounded-full text-[10px]">
                    {inq.status}
                  </span>
                </div>
                {inq.optionalMessage && (
                  <p className="text-slate-600 leading-relaxed">{inq.optionalMessage}</p>
                )}
                <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-1">
                  <span>Submitted: {new Date(inq.createdAt).toLocaleString()}</span>
                  <span>•</span>
                  <span className="capitalize">Urgency: {inq.urgency}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
