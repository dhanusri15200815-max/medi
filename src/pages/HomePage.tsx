import React, { useState, useRef } from 'react';
import { 
  FileText, 
  UploadCloud, 
  Languages, 
  BookOpen, 
  Sparkles, 
  AlertCircle, 
  FileCheck2, 
  Globe2,
  CheckCircle2
} from 'lucide-react';
import { 
  SourceLanguage, 
  TargetLanguage, 
  ReadingLevel, 
  SOURCE_LANGUAGE_OPTIONS, 
  TARGET_LANGUAGE_OPTIONS, 
  SUPPORTED_LANGUAGES, 
  SimplificationResult 
} from '../types';
import { extractTextFromFile } from '../utils/documentParser';
import { simplifyMedicalText } from '../services/api';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

interface Props {
  onProcessComplete: (result: SimplificationResult) => void;
  initialLanguage?: TargetLanguage;
  initialLevel?: ReadingLevel;
}

export const HomePage: React.FC<Props> = ({
  onProcessComplete,
  initialLanguage = 'Simple English',
  initialLevel = 'Simple',
}) => {
  const [activeInputMode, setActiveInputMode] = useState<'paste' | 'upload'>('paste');
  const [medicalText, setMedicalText] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isExtractingDoc, setIsExtractingDoc] = useState(false);
  const [extractionSuccess, setExtractionSuccess] = useState(false);

  const [sourceLanguage, setSourceLanguage] = useState<SourceLanguage>('Auto Detect');
  const [targetLanguage, setTargetLanguage] = useState<TargetLanguage>(initialLanguage);
  const [readingLevel, setReadingLevel] = useState<ReadingLevel>(initialLevel);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Document Upload (PDF, DOCX, TXT)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setIsExtractingDoc(true);
    setUploadedFileName(file.name);
    setExtractionSuccess(false);

    try {
      const extracted = await extractTextFromFile(file);
      setMedicalText(extracted);
      setExtractionSuccess(true);
    } catch {
      setErrorMessage('Unsupported document or document extraction failed. Please try another file or paste the text manually.');
      setMedicalText('');
      setUploadedFileName(null);
    } finally {
      setIsExtractingDoc(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setIsExtractingDoc(true);
    setUploadedFileName(file.name);
    setExtractionSuccess(false);

    try {
      const extracted = await extractTextFromFile(file);
      setMedicalText(extracted);
      setExtractionSuccess(true);
    } catch {
      setErrorMessage('Unsupported document or document extraction failed. Please try another file or paste the text manually.');
      setMedicalText('');
      setUploadedFileName(null);
    } finally {
      setIsExtractingDoc(false);
    }
  };

  // Form Submission
  const handleSimplifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmed = medicalText.trim();
    if (!trimmed) {
      setErrorMessage('Please enter medical information or upload a document.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await simplifyMedicalText({
        raw_text: trimmed,
        source_language: sourceLanguage,
        target_language: targetLanguage,
        reading_level: readingLevel,
      });
      onProcessComplete(result);
    } catch (err: any) {
      const rawMsg = err.message || '';
      let cleanMsg = rawMsg;
      if (cleanMsg.includes('executionId') || cleanMsg.includes('{') || cleanMsg.includes('HTTP 5') || cleanMsg.includes('Workflow returned')) {
        cleanMsg = 'The medical processing service encountered a temporary issue. Please try submitting again.';
      }
      setErrorMessage(cleanMsg || 'Unable to process the medical information right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Loading Overlay */}
      {isLoading && (
        <div 
          id="loading-screen"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center space-y-4 border border-slate-100">
            <div className="w-14 h-14 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900 font-serif">Analyzing your medical information...</h3>
              <p className="text-sm text-slate-600">
                Translating to {targetLanguage} at {readingLevel} reading level while preserving all critical dosages, medicines, and instructions.
              </p>
            </div>
            <div className="pt-2 text-xs text-slate-400">MedClarity Clinical Verification in progress</div>
          </div>
        </div>
      )}

      {/* Header & Subheading */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 font-serif">
          Understand Your Medical Information
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
          Convert medical information into a simple explanation that is easy to understand.
        </p>
      </div>

      <MedicalDisclaimer />

      {/* Main Medical Simplification Form */}
      <form id="medical-simplify-form" onSubmit={handleSimplifySubmit} className="space-y-6">
        {/* Error Alert Display */}
        {errorMessage && (
          <div 
            id="error-message-box" 
            className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs sm:text-sm text-rose-800 font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold">Notice:</span>
                <p>{errorMessage}</p>
              </div>
            </div>
            <button
              type="submit"
              id="retry-simplify-btn"
              disabled={isLoading}
              className="self-end sm:self-center px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-2xs shrink-0"
            >
              Retry Now
            </button>
          </div>
        )}

        {/* Two Input Options: Option A (Paste) and Option B (Upload) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Input Options</h2>
              <p className="text-xs text-slate-500">Choose between pasting text or uploading a medical document</p>
            </div>
            {/* Toggle Tabs */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl self-start sm:self-center">
              <button
                type="button"
                id="tab-paste-option"
                onClick={() => setActiveInputMode('paste')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeInputMode === 'paste'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                OPTION A: Paste Text
              </button>
              <button
                type="button"
                id="tab-upload-option"
                onClick={() => setActiveInputMode('upload')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeInputMode === 'upload'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                OPTION B: Upload Document
              </button>
            </div>
          </div>

          {/* Option B Content: Upload Document (PDF, DOCX, TXT) */}
          {activeInputMode === 'upload' && (
            <div className="space-y-3">
              <div
                id="document-dropzone"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-6 text-center cursor-pointer bg-slate-50/50 hover:bg-emerald-50/20 transition-all"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  id="document-file-input"
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="p-3 bg-emerald-100/60 text-emerald-700 rounded-full">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Click to upload or drag and drop your medical file
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Supported formats: <strong>PDF, DOCX, TXT</strong>
                    </p>
                  </div>
                </div>
              </div>

              {isExtractingDoc && (
                <div className="flex items-center justify-center gap-2 p-3 bg-slate-100 rounded-lg text-xs font-medium text-slate-700">
                  <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <span>Extracting text from medical document...</span>
                </div>
              )}

              {uploadedFileName && !isExtractingDoc && (
                <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-emerald-600" />
                    <span>
                      <strong>Uploaded:</strong> {uploadedFileName} {extractionSuccess && '— Text extracted successfully!'}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-semibold">
                    {medicalText.length} characters
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Large Textarea for Option A (Paste) or Extracted Content */}
          <div>
            <label htmlFor="medical-text-input" className="block text-xs font-semibold text-slate-700 mb-1">
              {activeInputMode === 'paste' ? 'OPTION A: Paste Medical Text' : 'Extracted Document Text'}
            </label>
            <textarea
              id="medical-text-input"
              rows={8}
              value={medicalText}
              onChange={(e) => setMedicalText(e.target.value)}
              placeholder="Paste your medical information here..."
              className="w-full p-3.5 bg-slate-50/60 border border-slate-300 rounded-xl text-sm text-slate-900 leading-relaxed font-sans placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Language Selection and Reading Level */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Source Language */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
                <Globe2 className="w-4 h-4" />
              </div>
              <label htmlFor="source-language-select" className="text-sm font-bold text-slate-900">
                Source Language
              </label>
            </div>
            <p className="text-xs text-slate-500">
              Language of your medical report or prescription.
            </p>
            <select
              id="source-language-select"
              value={sourceLanguage}
              onChange={(e) => setSourceLanguage(e.target.value as SourceLanguage)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
            >
              {SOURCE_LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* Target Language */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-teal-50 text-teal-700 rounded-lg">
                <Languages className="w-4 h-4" />
              </div>
              <label htmlFor="target-language-select" className="text-sm font-bold text-slate-900">
                Target Language
              </label>
            </div>
            <p className="text-xs text-slate-500">
              Output will be strictly written in this language.
            </p>
            <select
              id="target-language-select"
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value as TargetLanguage)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
            >
              {TARGET_LANGUAGE_OPTIONS.map((langKey) => {
                const meta = SUPPORTED_LANGUAGES[langKey];
                return (
                  <option key={langKey} value={langKey}>
                    {meta.name} {meta.nativeName !== meta.name ? `(${meta.nativeName})` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Reading Level */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                <BookOpen className="w-4 h-4" />
              </div>
              <label htmlFor="reading-level-select" className="text-sm font-bold text-slate-900">
                Reading Level
              </label>
            </div>
            <p className="text-xs text-slate-500">
              Explanation complexity for patient comprehension.
            </p>
            <select
              id="reading-level-select"
              value={readingLevel}
              onChange={(e) => setReadingLevel(e.target.value as ReadingLevel)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 cursor-pointer"
            >
              <option value="Standard">Standard</option>
              <option value="Simple">Simple</option>
              <option value="Very Simple">Very Simple</option>
            </select>
          </div>
        </div>

        {/* Process Button */}
        <div className="pt-2">
          <button
            id="simplify-submit-button"
            type="submit"
            disabled={isLoading || isExtractingDoc}
            className="w-full py-4 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-5 h-5" />
            <span>Understand My Medical Information</span>
          </button>
        </div>
      </form>
    </div>
  );
};
