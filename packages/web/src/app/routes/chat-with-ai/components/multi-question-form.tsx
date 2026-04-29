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
        className="my-3 flex items-center gap-2 text-sm text-muted-foreground"
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
      className="my-4 space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-1 overflow-x-auto">
        {questions.map((question, i) => (
          <button
            key={i}
            type="button"
            onClick={() => i < currentStep && setCurrentStep(i)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs whitespace-nowrap transition-colors',
              i === currentStep
                ? 'bg-primary/10 text-primary font-medium'
                : answers[i]?.trim()
                  ? 'text-muted-foreground cursor-pointer hover:bg-muted'
                  : 'text-muted-foreground/50',
            )}
          >
            <span className={cn(
              'flex items-center justify-center size-4 rounded-full text-[10px] font-medium shrink-0',
              i === currentStep
                ? 'bg-primary text-primary-foreground'
                : answers[i]?.trim()
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted-foreground/20 text-muted-foreground',
            )}>
              {answers[i]?.trim() ? <Check className="size-2.5" /> : i + 1}
            </span>
            {question.title ?? (question.question.length > 25
              ? question.question.slice(0, 25) + '...'
              : question.question)}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          className="space-y-3"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.2 }}
        >
          <p className="text-sm font-medium">{q.question}</p>

          {q.type === 'choice' && q.options && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {q.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setAnswers((prev) => ({
                      ...prev,
                      [currentStep]: prev[currentStep] === option ? '' : option,
                    }))}
                    className={cn(
                      'px-4 py-2 text-sm rounded-full border transition-colors cursor-pointer',
                      answers[currentStep] === option
                        ? 'border-primary text-primary bg-primary/5'
                        : 'bg-background hover:bg-muted',
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <Input
                className="h-9 text-sm"
                placeholder={t('Or type your own answer...')}
                value={answers[currentStep] && !q.options.includes(answers[currentStep]) ? answers[currentStep] : ''}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [currentStep]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && currentAnswer) handleNext();
                }}
              />
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

      <div className="flex items-center justify-end gap-2">
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
