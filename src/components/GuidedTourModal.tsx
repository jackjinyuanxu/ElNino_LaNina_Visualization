import React from 'react';
import { TourStep, ENSOPhase } from '../types/enso';
import { TOUR_STEPS } from '../data/ensoHistoricalData';
import { BookOpen, ChevronRight, ChevronLeft, CheckCircle2, ArrowRight, Compass, Sparkles } from 'lucide-react';

interface GuidedTourModalProps {
  currentStepIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onSetStep: (index: number) => void;
}

export const GuidedTourModal: React.FC<GuidedTourModalProps> = ({
  currentStepIndex,
  isOpen,
  onClose,
  onSetStep,
}) => {
  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

  const getPhaseBadgeColor = (phase: ENSOPhase) => {
    if (phase === 'el-nino') return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    if (phase === 'la-nina') return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/90 rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col justify-between">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-400">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                  Interactive Masterclass • Step {currentStep.stepNumber} of {TOUR_STEPS.length}
                </span>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {currentStep.title}
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Subtitle & Phase Indicator */}
          <div className="flex items-center gap-2.5 mb-4">
            <span className="text-xs font-semibold text-slate-300">
              {currentStep.subtitle}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border capitalize ${getPhaseBadgeColor(currentStep.phase)}`}>
              {currentStep.phase.replace('-', ' ')}
            </span>
          </div>

          {/* Narrative Paragraphs */}
          <div className="space-y-3 text-xs text-slate-300 leading-relaxed mb-5">
            {currentStep.narrative.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>

          {/* Key Takeaway Callout */}
          <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-900/50 mb-5">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Key Oceanographic Concept
              </span>
            </div>
            <p className="text-xs font-medium text-indigo-200">
              {currentStep.keyTakeaway}
            </p>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => onSetStep(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === currentStepIndex
                    ? 'w-6 bg-indigo-500'
                    : idx < currentStepIndex
                    ? 'bg-indigo-700'
                    : 'bg-slate-700'
                }`}
                title={`Step ${idx + 1}: ${step.title}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                onClick={() => onSetStep(currentStepIndex - 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </button>
            )}

            {isLast ? (
              <button
                onClick={onClose}
                className="flex items-center gap-1 px-4 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
              >
                Complete Tour
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => onSetStep(currentStepIndex + 1)}
                className="flex items-center gap-1 px-4 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm"
              >
                Next Step
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
