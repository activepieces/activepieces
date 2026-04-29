import { t } from 'i18next';
import { ArrowLeft, Check, ChevronRight, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import { MultiQuestion } from '../lib/message-parsers';

export function MultiQuestionForm({
  questions,
  onSubmit,
}: {
  questions: MultiQuestion[];
  onSubmit: (text: string) => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const isLastStep = currentStep === questions.length - 1;
  const currentAnswer = answers[currentStep]?.trim() ?? '';
  const allAnswered = questions.every((_q, i) => answers[i]?.trim());

  function handleChoiceSelect(option: string) {
    if (submitted) return;
    setAnswers((prev) =>
      prev[currentStep] === option
        ? { ...prev, [currentStep]: '' }
        : { ...prev, [currentStep]: option },
    );
  }

  function handleTextChange(value: string) {
    setAnswers((prev) => ({ ...prev, [currentStep]: value }));
  }

  function handleNext() {
    if (!currentAnswer) return;
    if (isLastStep) {
      handleSubmit();
    } else {
      setCurrentStep((s) => s + 1);
    }
  }

  function handleSubmit() {
    if (!allAnswered || submitted) return;
    setSubmitted(true);
    const lines = questions.map((q, i) => `- **${q.question}** ${answers[i]}`);
    onSubmit(lines.join('\n'));
  }

  if (submitted) {
    return (
      <motion.div
        className="my-2 flex items-center gap-2 text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Check className="size-4 text-green-600 dark:text-green-400" />
        <span>{t('Answers submitted')}</span>
      </motion.div>
    );
  }

  const q = questions[currentStep];

  return (
    <motion.div
      className="my-2 space-y-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-2">
        {questions.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => i < currentStep && setCurrentStep(i)}
            className={cn(
              'h-1.5 rounded-full transition-all',
              i === currentStep
                ? 'w-6 bg-primary'
                : answers[i]?.trim()
                  ? 'w-1.5 bg-primary/40 cursor-pointer'
                  : 'w-1.5 bg-muted-foreground/20',
            )}
          />
        ))}
        <span className="text-xs text-muted-foreground ml-1">
          {currentStep + 1}/{questions.length}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          className="space-y-2"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.2 }}
        >
          <p className="text-sm font-medium">{q.question}</p>

          {q.type === 'choice' && q.options && (
            <div className="flex flex-wrap gap-1.5">
              {q.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleChoiceSelect(option)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-full border transition-colors cursor-pointer',
                    answers[currentStep] === option
                      ? 'border-primary text-primary bg-primary/5'
                      : 'bg-background hover:bg-muted',
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {q.type === 'text' && (
            <Input
              className="h-9 text-sm"
              placeholder={q.placeholder}
              value={answers[currentStep] ?? ''}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNext();
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center gap-2">
        {currentStep > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 rounded-full text-xs"
            onClick={() => setCurrentStep((s) => s - 1)}
          >
            <ArrowLeft className="size-3" />
            {t('Back')}
          </Button>
        )}
        <Button
          size="sm"
          className="gap-1 rounded-full text-xs"
          disabled={!currentAnswer}
          onClick={handleNext}
        >
          {isLastStep ? (
            <>
              <Send className="size-3" />
              {t('Submit')}
            </>
          ) : (
            <>
              {t('Next')}
              <ChevronRight className="size-3" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
