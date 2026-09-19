import React, { useState } from 'react';
import { User, Mail, Phone, Calendar, ShieldCheck, Edit3, Save, CheckCircle2, HeartPulse, Pill, FileText } from 'lucide-react';
import { UserProfile } from '../types';
import { updateUserProfile } from '../services/auth';

interface Props {
  currentUser: UserProfile;
  onProfileUpdated: (user: UserProfile) => void;
}

export const PatientProfilePage: React.FC<Props> = ({ currentUser, onProfileUpdated }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(currentUser.fullName || '');
  const [age, setAge] = useState<number | string>(currentUser.age || '');
  const [gender, setGender] = useState(currentUser.gender || 'Female');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [emergencyContact, setEmergencyContact] = useState(currentUser.emergencyContact || '');
  const [medicalConditions, setMedicalConditions] = useState(currentUser.medicalConditions || '');
  const [currentMedications, setCurrentMedications] = useState(currentUser.currentMedications || '');
  const [allergies, setAllergies] = useState(currentUser.allergies || '');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Full name cannot be blank.');
      return;
    }

    try {
      const updated = updateUserProfile({
        fullName: fullName.trim(),
        age: Number(age),
        gender: gender as any,
        phone: phone.trim(),
        emergencyContact: emergencyContact.trim(),
        medicalConditions: medicalConditions.trim(),
        currentMedications: currentMedications.trim(),
        allergies: allergies.trim(),
      });
      onProfileUpdated(updated);
      setIsEditing(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Patient Profile
            </span>
            <span className="text-xs text-slate-500">
              Account Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-serif">
            Patient Profile
          </h1>
        </div>

        <button
          type="button"
          id="toggle-edit-profile-btn"
          onClick={() => {
            setIsEditing(!isEditing);
            setError(null);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
            isEditing
              ? 'bg-slate-100 text-slate-700 border-slate-300'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{isEditing ? 'Cancel Editing' : 'Edit Profile Information'}</span>
        </button>
      </div>

      {savedSuccess && (
        <div id="profile-saved-msg" className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Patient profile details saved successfully!</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
          {error}
        </div>
      )}

      {/* Main Profile Info Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        {/* Patient Identity Badge */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-xl font-bold font-serif shadow-xs">
            {currentUser.fullName ? currentUser.fullName.charAt(0) : 'P'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{currentUser.fullName}</h2>
            <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span>{currentUser.email}</span>
              <span>•</span>
              <span>{currentUser.age} years old</span>
              <span>•</span>
              <span>{currentUser.gender}</span>
            </p>
          </div>
        </div>

        {/* View Mode vs Edit Mode Form */}
        {!isEditing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Full Name</span>
              <div id="profile-display-fullname" className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                <span>{currentUser.fullName}</span>
              </div>
            </div>

            {/* Email */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Email</span>
              <div id="profile-display-email" className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-600" />
                <span>{currentUser.email}</span>
              </div>
            </div>

            {/* Age */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Age</span>
              <div id="profile-display-age" className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>{currentUser.age} years</span>
              </div>
            </div>

            {/* Gender */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Gender</span>
              <div id="profile-display-gender" className="text-sm font-bold text-slate-800">
                {currentUser.gender}
              </div>
            </div>

            {/* Phone Number */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Phone Number</span>
              <div id="profile-display-phone" className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>{currentUser.phone}</span>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Emergency Contact</span>
              <div className="text-sm font-bold text-slate-800">
                {currentUser.emergencyContact || 'None provided'}
              </div>
            </div>

            {/* Medical Conditions */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1 sm:col-span-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Medical Conditions</span>
              <div className="text-sm text-slate-800 flex items-start gap-2">
                <FileText className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{currentUser.medicalConditions || 'No existing conditions entered.'}</span>
              </div>
            </div>

            {/* Current Medications */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1 sm:col-span-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Current Medications</span>
              <div className="text-sm text-slate-800 flex items-start gap-2">
                <Pill className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{currentUser.currentMedications || 'No current medications entered.'}</span>
              </div>
            </div>

            {/* Allergies */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1 sm:col-span-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Allergies</span>
              <div className="text-sm text-slate-800 flex items-start gap-2">
                <HeartPulse className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{currentUser.allergies || 'No known allergies reported.'}</span>
              </div>
            </div>
          </div>
        ) : (
          <form id="edit-profile-form" onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Age</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact</label>
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="e.g. Spouse / Sibling (+91 98765 43210)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Medical Conditions</label>
                <textarea
                  rows={2}
                  value={medicalConditions}
                  onChange={(e) => setMedicalConditions(e.target.value)}
                  placeholder="e.g. Type 2 Diabetes, Hypertension"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Current Medications</label>
                <textarea
                  rows={2}
                  value={currentMedications}
                  onChange={(e) => setCurrentMedications(e.target.value)}
                  placeholder="e.g. Metformin 500 mg, Lisinopril 10 mg"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Allergies</label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="e.g. Penicillin, Peanuts, Aspirin"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="save-profile-btn"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Profile</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Safety Notice */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-600">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold text-slate-900">Patient Privacy Standard:</span>
          <p>
            Your health records and demographic information are strictly kept private.
          </p>
        </div>
      </div>
    </div>
  );
};
