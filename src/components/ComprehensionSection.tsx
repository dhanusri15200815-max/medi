import React, { useState } from 'react';
import { 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  Award, 
  Check, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { QuestionItem } from '../types';

interface Props {
  questions: QuestionItem[];
  targetLanguage?: string;
  onNavigateToDedicated?: () => void;
  showDedicatedLink?: boolean;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export const ComprehensionSection: React.FC<Props> = ({
  questions,
  targetLanguage,
  onNavigateToDedicated,
  showDedicatedLink = false,
}) => {
  // Store user's selected option index per question
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // If no questions are available
  if (!questions || questions.length === 0) {
    return (
      <div id="section-comprehension" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-wide font-sans uppercase">
                COMPREHENSION
              </h2>
              <p className="text-xs text-slate-500">
                Teach-back questions based ONLY on the processed medical information
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
          No comprehension questions have been generated for this document yet. Please process a medical report on the Home page.
        </div>
      </div>
    );
  }

  // Helper to determine if an option matches the question's correct_answer
  const isOptionCorrect = (q: QuestionItem, optionText: string, optIndex: number): boolean => {
    if (!q.correct_answer) return optIndex === 0;
    const answerNorm = q.correct_answer.trim().toLowerCase();
    const optNorm = optionText.trim().toLowerCase();
    
    // Direct or lowercase match
    if (answerNorm === optNorm) return true;

    // Check if correct_answer matches letter like "A" or "B" or "A."
    const letter = OPTION_LETTERS[optIndex]?.toLowerCase();
    if (
      answerNorm === letter ||
      answerNorm === `${letter}.` ||
      answerNorm.startsWith(`${letter})`) ||
      answerNorm.startsWith(`${letter}:`) ||
      answerNorm.startsWith(`${letter} `)
    ) {
      return true;
    }

    // Stripped leading letters
    const cleanAnswer = answerNorm.replace(/^[a-d][\.\:\)\s]+/i, '').trim();
    const cleanOpt = optNorm.replace(/^[a-d][\.\:\)\s]+/i, '').trim();
    if (cleanAnswer && cleanOpt && cleanAnswer === cleanOpt) return true;

    // Substring match if long enough
    if (cleanOpt.length > 4 && (cleanAnswer.includes(cleanOpt) || cleanOpt.includes(cleanAnswer))) {
      return true;
    }

    return false;
  };

  // Find the correct option index for a question
  const getCorrectOptionIndex = (q: QuestionItem): number => {
    const idx = q.options.findIndex((opt, i) => isOptionCorrect(q, opt, i));
    return idx >= 0 ? idx : 0;
  };

  // Calculate score
  const totalQuestions = questions.length;
  let correctCount = 0;
  if (isSubmitted) {
    questions.forEach((q, qIdx) => {
      const selectedIdx = selectedAnswers[qIdx];
      if (selectedIdx !== undefined && isOptionCorrect(q, q.options[selectedIdx], selectedIdx)) {
        correctCount++;
      }
    });
  }

  const handleSelectOption = (qIdx: number, optIdx: number) => {
    if (isSubmitted) return; // Prevent changing after submission until retake
    setSelectedAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
  };

  const allAnswered = questions.every((_, qIdx) => selectedAnswers[qIdx] !== undefined);

  // Encouraging messages
  const getEncouragingMessage = (score: number, total: number) => {
    const ratio = total > 0 ? score / total : 0;
    if (ratio === 1) {
      return 'Excellent! You have a complete and accurate understanding of your medical document instructions.';
    }
    if (ratio >= 0.7) {
      return 'Great job! You have understood the most important instructions. Review the correct answers below to be fully confident.';
    }
    if (ratio >= 0.4) {
      return 'Good effort! Medical instructions have many important details. Taking time to review the highlighted answers below will help keep your daily routine safe.';
    }
    return 'Thank you for checking your understanding! Healthcare instructions can feel unfamiliar. Review the correct answers highlighted below to stay safe and well-informed.';
  };

  return (
    <div id="section-comprehension" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-wider uppercase font-sans">
                COMPREHENSION
              </h2>
              {targetLanguage && (
                <span className="text-[11px] font-semibold px-2 py-0.5 bg-blue-50 text-blue-800 rounded-md border border-blue-200">
                  {targetLanguage}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Multiple Choice Questions based ONLY on the verified medical information
            </p>
          </div>
        </div>

        {showDedicatedLink && onNavigateToDedicated && (
          <button
            type="button"
            onClick={onNavigateToDedicated}
            className="self-start sm:self-auto text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1 cursor-pointer bg-blue-50/70 hover:bg-blue-100/70 px-3 py-1.5 rounded-lg transition-colors"
          >
            <span>Dedicated View</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Score and Encouragement Banner after submission */}
      {isSubmitted && (
        <div 
          id="comprehension-score-card"
          className={`p-5 rounded-2xl border transition-all animate-fadeIn ${
            correctCount === totalQuestions
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
              : correctCount >= totalQuestions * 0.7
              ? 'bg-teal-50/80 border-teal-300 text-teal-950'
              : 'bg-amber-50/80 border-amber-300 text-amber-950'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className={`p-2.5 rounded-xl ${
                correctCount === totalQuestions
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                <Award className="w-7 h-7" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-sans">
                  Your Score: {correctCount}/{totalQuestions}
                </div>
                <p className="text-xs sm:text-sm text-slate-700 mt-1 max-w-xl leading-relaxed">
                  {getEncouragingMessage(correctCount, totalQuestions)}
                </p>
              </div>
            </div>

            <button
              type="button"
              id="retake-comprehension-button"
              onClick={handleRetake}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 shadow-2xs transition-colors cursor-pointer self-start sm:self-center shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
              <span>Retake Questions</span>
            </button>
          </div>
        </div>
      )}

      {/* Questions Form */}
      <form id="comprehension-mcq-form" onSubmit={handleSubmit} className="space-y-6">
        {questions.map((q, qIdx) => {
          const selectedOptIdx = selectedAnswers[qIdx];
          const hasSelected = selectedOptIdx !== undefined;
          const correctOptIdx = getCorrectOptionIndex(q);
          const isUserCorrect = hasSelected && selectedOptIdx === correctOptIdx;
          const showFeedback = hasSelected || isSubmitted;

          return (
            <div 
              key={qIdx}
              id={`mcq-question-card-${qIdx + 1}`}
              className={`p-5 sm:p-6 rounded-2xl border transition-all ${
                showFeedback
                  ? isUserCorrect
                    ? 'bg-emerald-50/30 border-emerald-300 shadow-xs'
                    : 'bg-amber-50/20 border-amber-300/80 shadow-xs'
                  : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Question Label & Text */}
              <div className="space-y-1.5 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 tracking-wide uppercase">
                    Question {qIdx + 1}
                  </span>

                  {showFeedback && (
                    <span 
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                        isUserCorrect
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {isUserCorrect ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Correct</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          <span>Incorrect</span>
                        </>
                      )}
                    </span>
                  )}
                </div>

                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                  {q.question}
                </h3>
              </div>

              {/* 4 Options: ○ A. [Option] ○ B. [Option] ○ C. [Option] ○ D. [Option] */}
              <div className="space-y-2.5">
                {q.options.map((optText, optIdx) => {
                  const letter = OPTION_LETTERS[optIdx] || `${optIdx + 1}`;
                  const isSelected = selectedOptIdx === optIdx;
                  const isThisCorrect = optIdx === correctOptIdx;

                  // Determine styling based on selection and feedback state
                  let optionClass = 'border-slate-200 bg-white text-slate-800 hover:border-blue-300 hover:bg-blue-50/20';
                  let radioClass = 'border-slate-300 text-slate-400';

                  if (!showFeedback) {
                    if (isSelected) {
                      optionClass = 'border-blue-600 bg-blue-50/60 text-blue-950 font-semibold ring-1 ring-blue-500';
                      radioClass = 'border-blue-600 bg-blue-600 text-white';
                    }
                  } else {
                    // After selection:
                    if (isThisCorrect) {
                      optionClass = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-emerald-500';
                      radioClass = 'border-emerald-600 bg-emerald-600 text-white';
                    } else if (isSelected && !isThisCorrect) {
                      optionClass = 'border-amber-400 bg-amber-50/70 text-amber-950 font-medium';
                      radioClass = 'border-amber-500 bg-amber-500 text-white';
                    } else {
                      optionClass = 'border-slate-200 bg-white/70 text-slate-500 opacity-80';
                      radioClass = 'border-slate-200 text-slate-300';
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      id={`question-${qIdx + 1}-option-${letter}`}
                      onClick={() => handleSelectOption(qIdx, optIdx)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs sm:text-sm flex items-start gap-3 cursor-pointer ${optionClass}`}
                    >
                      {/* Radio Circle Indicator ○ */}
                      <div className="pt-0.5 shrink-0">
                        <div 
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected || (showFeedback && isThisCorrect)
                              ? showFeedback && isThisCorrect
                                ? 'border-emerald-600 bg-emerald-600 text-white'
                                : showFeedback && isSelected && !isThisCorrect
                                ? 'border-amber-500 bg-amber-500 text-white'
                                : 'border-blue-600 bg-blue-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {(isSelected || (showFeedback && isThisCorrect)) ? (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-transparent" />
                          )}
                        </div>
                      </div>

                      {/* Option Text with Letter Prefix: A. [Option] */}
                      <div className="flex-1 flex items-start justify-between gap-2">
                        <span className="leading-relaxed">
                          <span className="font-bold mr-1.5">{letter}.</span>
                          <span>{optText}</span>
                        </span>

                        {/* Badges after selection */}
                        {showFeedback && (
                          <div className="shrink-0 pt-0.5">
                            {isThisCorrect && (
                              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-700" />
                                <span>Correct Answer</span>
                              </span>
                            )}
                            {isSelected && !isThisCorrect && (
                              <span className="text-[11px] font-medium text-amber-800 bg-amber-100/80 border border-amber-300 px-2 py-0.5 rounded-md">
                                Your choice
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Section 14: After selection, show whether the answer is correct and display the explanation */}
              {showFeedback && (
                <div 
                  id={`question-${qIdx + 1}-explanation-card`}
                  className={`mt-4 p-4 rounded-xl border text-xs sm:text-sm leading-relaxed transition-all ${
                    isUserCorrect
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                      : 'bg-amber-50/70 border-amber-200 text-amber-950'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold mb-1.5">
                    {isUserCorrect ? (
                      <span className="text-emerald-800 flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Correct! Well done.</span>
                      </span>
                    ) : (
                      <span className="text-amber-900 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          Incorrect. Correct answer: <span className="underline font-semibold">{OPTION_LETTERS[correctOptIdx]}. {q.options[correctOptIdx]}</span>
                        </span>
                      </span>
                    )}
                  </div>

                  {q.explanation && (
                    <div className="text-slate-800 mt-1">
                      <span className="font-semibold text-slate-900">Explanation: </span>
                      <span>{q.explanation}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Submit Button Section */}
        {!isSubmitted ? (
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              {allAnswered 
                ? 'All questions answered! Click submit to check your score.' 
                : `Please select one option for each question (${Object.keys(selectedAnswers).length}/${totalQuestions} answered).`}
            </p>

            <button
              type="submit"
              id="submit-comprehension-answers-button"
              disabled={!allAnswered}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>Submit Answers</span>
            </button>
          </div>
        ) : (
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-600">
              Completed {totalQuestions} comprehension questions
            </span>
            <button
              type="button"
              onClick={handleRetake}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake Questions</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
