export interface SampleMedicalCase {
  id: string;
  title: string;
  category: string;
  description: string;
  text: string;
  suggestedLanguage: 'English' | 'Tamil' | 'Hindi' | 'Telugu';
  suggestedLevel: 'simple' | 'standard' | 'very_simple';
}

export const SAMPLE_CASES: SampleMedicalCase[] = [
  {
    id: 'case-1',
    title: 'Hypertension Prescription (Amlodipine)',
    category: 'Cardiology / General Medicine',
    description: 'Classic outpatient prescription with blood pressure management.',
    suggestedLanguage: 'Tamil',
    suggestedLevel: 'simple',
    text: `CLINICAL SUMMARY & PRESCRIPTION:
Diagnosis: Essential Hypertension (Stage 1).
Vitals: BP 142/92 mmHg, Pulse 76 bpm, BMI 26.4.

Medication Order:
1. Tab. Amlodipine 5 mg - Take 1 tablet orally once daily in the morning after breakfast.
2. Tab. Telmisartan 40 mg - Take 1 tablet orally once daily with water.

Dietary Guidance:
Reduce dietary sodium intake (under 2 grams/day). Avoid salted pickles, canned soups, and processed snacks. Maintain adequate hydration with 2 to 2.5 liters of water daily.

Follow-up Instructions:
Re-check blood pressure at the local clinic in 2 weeks (Target date: October 15, 2026). Report immediately to the nearest emergency facility if experiencing severe headaches, chest tightness, or blurry vision.`
  },
  {
    id: 'case-2',
    title: 'Type 2 Diabetes & Lipid Panel',
    category: 'Endocrinology',
    description: 'Metformin and Atorvastatin regimen with fasting blood glucose tracking.',
    suggestedLanguage: 'Hindi',
    suggestedLevel: 'very_simple',
    text: `OUTPATIENT CLINICAL NOTE:
Condition: Type 2 Diabetes Mellitus with Dyslipidemia.
HbA1c: 7.8%, Fasting Blood Sugar: 148 mg/dL.

Rx:
- Tab. Metformin Hydrochloride 500 mg - 1 tablet twice daily with meals (breakfast and dinner).
- Tab. Atorvastatin 10 mg - 1 tablet once daily at bedtime.

Dietary Instructions:
Limit refined sugars, sweets, and carbonated beverages. Consume whole wheat chapati, lentils, and fresh green leafy vegetables.

Follow-up Plan:
Repeat Fasting Blood Sugar and HbA1c test in 3 months. Follow up in the endocrine outpatient clinic on November 20, 2026.`
  },
  {
    id: 'case-3',
    title: 'Post-Operative Orthopedic Discharge',
    category: 'Orthopedics / Surgery',
    description: 'Post-arthroscopy wound care and analgesia instructions.',
    suggestedLanguage: 'English',
    suggestedLevel: 'standard',
    text: `POST-OPERATIVE DISCHARGE INSTRUCTIONS:
Procedure: Right knee diagnostic arthroscopy and partial meniscectomy.
Surgical Site: Clean and dry, sterile adhesive dressing applied.

Prescriptions:
- Tab. Paracetamol 650 mg - 1 tablet every 6 to 8 hours as needed for moderate knee pain. Maximum 3000 mg in 24 hours.
- Cap. Amoxicillin-Clavulanate 625 mg - 1 capsule twice daily for 5 continuous days after food.

Wound Care & Activity:
Keep surgical dressing dry for 48 hours. Elevate right lower limb with two pillows while resting. Perform gentle ankle pump exercises 10 times every hour while awake.

Follow-up:
Visit the orthopedic dressing room on post-op day 7 (September 25, 2026) for wound inspection and suture assessment.`
  }
];
