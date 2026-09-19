export type ReadingLevel = 'Standard' | 'Simple' | 'Very Simple' | 'standard' | 'simple' | 'very_simple';

export type SourceLanguage =
  | 'Auto Detect'
  | 'English'
  | 'Tamil'
  | 'Hindi'
  | 'Marathi'
  | 'Kannada'
  | 'Telugu'
  | 'Malayalam';

export type TargetLanguage = 
  | 'Simple English'
  | 'Tamil'
  | 'Hindi'
  | 'Marathi'
  | 'Kannada'
  | 'Telugu'
  | 'Malayalam'
  | 'Bengali'
  | 'English';

export interface LanguageMeta {
  code: string;
  name: string;
  nativeName: string;
  speechCode: string;
}

export const SUPPORTED_LANGUAGES: Record<string, LanguageMeta> = {
  'Simple English': { code: 'en', name: 'Simple English', nativeName: 'Simple English', speechCode: 'en-US' },
  'English': { code: 'en', name: 'English', nativeName: 'English', speechCode: 'en-US' },
  'Auto Detect': { code: 'auto', name: 'Auto Detect', nativeName: 'Auto Detect', speechCode: 'en-US' },
  'Tamil': { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', speechCode: 'ta-IN' },
  'Hindi': { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', speechCode: 'hi-IN' },
  'Marathi': { code: 'mr', name: 'Marathi', nativeName: 'मराठी', speechCode: 'mr-IN' },
  'Kannada': { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', speechCode: 'kn-IN' },
  'Telugu': { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', speechCode: 'te-IN' },
  'Malayalam': { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', speechCode: 'ml-IN' },
  'Bengali': { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', speechCode: 'bn-IN' },
};

export const SOURCE_LANGUAGE_OPTIONS: SourceLanguage[] = [
  'Auto Detect',
  'English',
  'Tamil',
  'Hindi',
  'Marathi',
  'Kannada',
  'Telugu',
  'Malayalam',
];

export const TARGET_LANGUAGE_OPTIONS: TargetLanguage[] = [
  'English',
  'Simple English',
  'Tamil',
  'Hindi',
  'Marathi',
  'Kannada',
  'Telugu',
  'Malayalam',
  'Bengali',
];

export const READING_LEVEL_OPTIONS = ['Standard', 'Simple', 'Very Simple'] as const;

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  password?: string;
  age: number | string;
  gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  phone: string;
  emergencyContact?: string;
  medicalConditions?: string;
  currentMedications?: string;
  allergies?: string;
  medicalNotes?: string;
  bloodGroup?: string;
  createdAt: string;
}

export interface QuestionItem {
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
  userAnswer?: string;
  isCorrect?: boolean;
}

export interface VerificationSection {
  verified: boolean;
  flagged_claims: string[];
  reason: string;
}

export interface DietItemWithReason {
  item?: string;
  food?: string;
  reason?: string;
}

export interface MealGuidance {
  breakfast?: string[];
  lunch?: string[];
  dinner?: string[];
  snacks?: string[];
}

export interface DietSection {
  relevant?: boolean;
  diet_relevant?: boolean;
  diet_guidance_relevant?: boolean; // YES or NO
  medical_conditions?: string[];
  diet_summary?: string;
  not_applicable_message?: string;
  foods_to_include?: (string | DietItemWithReason)[];
  eat_more?: (string | DietItemWithReason)[];
  avoid?: (string | DietItemWithReason)[];
  helps_improve_health?: string[];
  foods_to_take_more?: (string | DietItemWithReason)[];
  foods_to_limit_or_avoid?: (string | DietItemWithReason)[];
  healthy_choices?: (string | DietItemWithReason)[];
  what_to_take_more?: DietItemWithReason[];
  what_to_avoid_or_limit?: DietItemWithReason[];
  meal_guidance?: MealGuidance;
  hydration_guidance?: string;
  important_notes?: string[];
  doctor_dietitian_note?: string;
  health_improvement?: string[];
  how_it_can_help?: string;
  general_note?: string;
  general_health_tips?: string[];
  medical_note?: string;

  // Optional legacy fields for backwards compatibility
  breakfast?: string;
  lunch?: string;
  dinner?: string;
  healthy_options?: string[];
  things_to_limit?: string | string[];
}

export interface FollowUpSection {
  follow_up_required?: boolean;
  follow_up_text?: string;
  reminder?: string;
  instruction: string;
  instructions?: string[];
  next_follow_up?: string;
  important_reminders?: string[];
  reminders?: string[];
  date?: string;
  reason?: string;
  reminder_available?: boolean;
  reminderEnabled?: boolean;
  reminderDate?: string;
}

/**
 * EXACT Backend and AI simplification response contract required by Section 11
 */
export interface SimplificationResult {
  id?: string;
  timestamp?: string;
  success?: boolean;
  language?: string;
  reading_level?: string;
  original_text: string;
  simplified_text: string;
  verification?: VerificationSection;
  verified: boolean;
  flagged_claims: string[];
  verification_reason: string;
  comprehension?: QuestionItem[];
  questions: QuestionItem[];
  diet: DietSection;
  follow_up: FollowUpSection;
  source_language?: string;
  target_language?: string;

  // Optional convenience aliases for backwards compatibility
  medicines?: Array<{
    name: string;
    dosage: string;
    timing: string;
    purpose?: string;
  }>;
  keyPoints?: string[];
}


export interface DoctorInquiry {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  question: string;
  optionalMessage: string;
  urgency: 'routine' | 'clarification' | 'urgent';
  createdAt: string;
  status: 'Submitted' | 'Under Review' | 'Answered';
  doctorReply?: string;
  sourceReportId?: string;
}

export type ActivePage = 
  | 'home' 
  | 'results' 
  | 'diet' 
  | 'comprehension' 
  | 'followups' 
  | 'profile' 
  | 'dashboard'
  | 'doctor' 
  | 'settings';
