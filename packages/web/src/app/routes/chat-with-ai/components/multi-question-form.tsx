import { t } from 'i18next';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Pencil,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Fragment, useEffect, useId, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

import { MultiQuestion } from '../lib/message-parsers';

export function MultiQuestionForm({
  questions,
  onSubmit,
  onDismiss,
}: {
  questions: MultiQuestion[];
  onSubmit: (text: string) => void;
  onDismiss?: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [focusedRow, setFocusedRow] = useState<number | 'custom' | null>(null);
  const [hoveredRow, setHoveredRow] = useState<number | 'custom' | null>(null);
  const fieldId = useId();
  const firstOptionRef = useRef<HTMLButtonElement | null>(null);
  const lastOptionRef = useRef<HTMLButtonElement | null>(null);
  const customAnswerInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const lastFocusedElRef = useRef<HTMLElement | null>(null);

  const isLastStep = currentStep === questions.length - 1;
  const currentAnswer = answers[currentStep]?.trim() ?? '';

  useEffect(() => {
    const target = firstOptionRef.current ?? textInputRef.current;
    if (target && lastFocusedElRef.current !== target) {
      target.focus({ preventScroll: true });
      lastFocusedElRef.current = target;
    }
  }, [currentStep]);

  function setAnswer(value: string) {
    setAnswers((prev) => ({ ...prev, [currentStep]: value }));
  }

  function setFirstOptionEl(el: HTMLButtonElement | null) {
    firstOptionRef.current = el;
    if (el && lastFocusedElRef.current !== el) {
      el.focus({ preventScroll: true });
      lastFocusedElRef.current = el;
    }
  }

  function setTextInputEl(el: HTMLInputElement | null) {
    textInputRef.current = el;
    if (el && lastFocusedElRef.current !== el) {
      el.focus({ preventScroll: true });
      lastFocusedElRef.current = el;
    }
  }

  function handleNext(overrideValue?: string) {
    const value = (overrideValue ?? currentAnswer).trim();
    if (!value) return;
    if (overrideValue !== undefined) {
      setAnswers((prev) => ({ ...prev, [currentStep]: overrideValue }));
    }
    if (isLastStep) {
      if (submitted) return;
      const finalAnswers =
        overrideValue !== undefined
          ? { ...answers, [currentStep]: overrideValue }
          : answers;
      setSubmitted(true);
      const lines = questions
        .map((qq, i) => {
          const a = finalAnswers[i]?.trim();
          return a ? `- **${qq.question}** ${a}` : null;
        })
        .filter((l): l is string => l !== null);
      if (lines.length === 0) {
        onDismiss?.();
        return;
      }
      onSubmit(lines.join('\n'));
    } else {
      setCurrentStep((s) => s + 1);
    }
  }

  function handleSkip() {
    if (isLastStep) {
      if (submitted) return;
      const lines = questions
        .map((qq, i) => {
          const a = answers[i]?.trim();
          return a ? `- **${qq.question}** ${a}` : null;
        })
        .filter((l): l is string => l !== null);
      if (lines.length === 0) {
        onDismiss?.();
        return;
      }
      setSubmitted(true);
      onSubmit(lines.join('\n'));
    } else {
      setCurrentStep((s) => s + 1);
    }
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
  if (!q) return null;
  const isCustomTextActive =
    q.type === 'choice' &&
    !!q.options &&
    !!answers[currentStep] &&
    !q.options.includes(answers[currentStep]);

  const choiceOptions = q.type === 'choice' ? q.options ?? [] : [];
  const selectedIndex = choiceOptions.findIndex(
    (o) => answers[currentStep] === o,
  );
  const lastOptionIndex = choiceOptions.length - 1;
  const isOptionActive = (i: number) =>
    focusedRow === i || hoveredRow === i || selectedIndex === i;
  const isCustomActive =
    focusedRow === 'custom' || hoveredRow === 'custom' || isCustomTextActive;
  const isMidSepHidden = (i: number) =>
    isOptionActive(i) || isOptionActive(i - 1);
  const isBottomSepHidden = isOptionActive(lastOptionIndex) || isCustomActive;

  return (
    <motion.div
      className="rounded-2xl border border-border/60 bg-background p-5 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)] dark:bg-neutral-900 dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)] backdrop-blur-sm transition-colors"
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={`q-${currentStep}`}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              <Label
                htmlFor={fieldId}
                className="block text-base font-semibold leading-snug text-foreground"
              >
                {q.question}
              </Label>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-1 text-muted-foreground shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setCurrentStep((s) => s - 1)}
            disabled={currentStep === 0}
            aria-label={t('Back')}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-xs tabular-nums px-1">
            {t('{current} of {total}', {
              current: currentStep + 1,
              total: questions.length,
            })}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => handleNext()}
            disabled={!currentAnswer}
            aria-label={t('Next')}
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="ms-1 h-7 w-7"
            onClick={onDismiss}
            aria-label={t('Close')}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`opts-${currentStep}`}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.2 }}
          className="mt-4"
        >
          <div>
            {q.type === 'choice' && q.options && (
              <div>
                <RadioGroup
                  value={
                    q.options.includes(answers[currentStep] ?? '')
                      ? answers[currentStep]
                      : ''
                  }
                  onValueChange={setAnswer}
                  className="gap-0"
                >
                  {q.options.map((option, i) => {
                    const id = `${fieldId}-opt-${i}`;
                    const selected = answers[currentStep] === option;
                    const isFirst = i === 0;
                    const isLast = i === q.options!.length - 1;
                    return (
                      <Fragment key={option}>
                        {i > 0 && (
                          <div className="px-3">
                            <Separator
                              className={cn(
                                'bg-border/60 transition-opacity duration-150',
                                isMidSepHidden(i) && 'opacity-0',
                              )}
                            />
                          </div>
                        )}
                        <div
                          onClick={() => {
                            handleNext(option);
                          }}
                          onMouseEnter={() => setHoveredRow(i)}
                          onMouseLeave={() =>
                            setHoveredRow((prev) => (prev === i ? null : prev))
                          }
                          onFocus={() => setFocusedRow(i)}
                          onBlur={() =>
                            setFocusedRow((prev) => (prev === i ? null : prev))
                          }
                          className={cn(
                            'group flex items-center gap-3 rounded-xl px-2 py-2 text-sm font-normal cursor-pointer transition-colors hover:bg-muted',
                            focusedRow === i && !selected && 'bg-muted',
                            selected && 'bg-muted-foreground/15',
                          )}
                        >
                          <RadioGroupItem
                            ref={(el) => {
                              if (isFirst) setFirstOptionEl(el);
                              if (isLast) lastOptionRef.current = el;
                            }}
                            id={id}
                            value={option}
                            className="peer sr-only"
                            onKeyDownCapture={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                e.stopPropagation();
                                handleNext(option);
                                return;
                              }
                              if (
                                e.key === 'ArrowLeft' ||
                                e.key === 'ArrowRight'
                              ) {
                                e.preventDefault();
                                e.stopPropagation();
                                return;
                              }
                              const wrapDown = e.key === 'ArrowDown' && isLast;
                              const wrapUp = e.key === 'ArrowUp' && isFirst;
                              if (wrapDown || wrapUp) {
                                e.preventDefault();
                                e.stopPropagation();
                                setAnswer('');
                                customAnswerInputRef.current?.focus();
                              }
                            }}
                          />
                          <span
                            aria-hidden
                            className={cn(
                              'flex size-8 shrink-0 items-center justify-center rounded-md bg-muted-foreground/10 text-xs font-medium text-muted-foreground transition-colors peer-focus:bg-foreground peer-focus:text-background',
                              selected && 'bg-foreground text-background',
                            )}
                          >
                            {i + 1}
                          </span>
                          <span className="flex-1 leading-snug">{option}</span>
                        </div>
                      </Fragment>
                    );
                  })}
                </RadioGroup>

                <div className="px-3">
                  <Separator
                    className={cn(
                      'bg-border/60 transition-opacity duration-150',
                      isBottomSepHidden && 'opacity-0',
                    )}
                  />
                </div>

                <label
                  htmlFor={fieldId}
                  onMouseEnter={() => setHoveredRow('custom')}
                  onMouseLeave={() =>
                    setHoveredRow((prev) => (prev === 'custom' ? null : prev))
                  }
                  onFocus={() => setFocusedRow('custom')}
                  onBlur={() =>
                    setFocusedRow((prev) => (prev === 'custom' ? null : prev))
                  }
                  className={cn(
                    'group flex items-center gap-3 rounded-xl px-2 py-2 text-sm font-normal cursor-text transition-colors hover:bg-muted focus-within:bg-muted',
                    isCustomTextActive && 'bg-muted',
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-md bg-muted-foreground/10 text-muted-foreground transition-colors group-focus-within:bg-foreground group-focus-within:text-background',
                      isCustomTextActive && 'bg-foreground text-background',
                    )}
                  >
                    <Pencil className="size-3.5" />
                  </span>
                  <Input
                    ref={customAnswerInputRef}
                    id={fieldId}
                    className="h-auto flex-1 min-w-0 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:border-0 dark:bg-transparent"
                    placeholder={t('Type your answer...')}
                    value={isCustomTextActive ? answers[currentStep] : ''}
                    onFocus={() => {
                      if (q.options!.includes(answers[currentStep] ?? '')) {
                        setAnswer('');
                      }
                    }}
                    onChange={(e) => setAnswer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        const last = q.options![q.options!.length - 1];
                        setAnswer(last);
                        lastOptionRef.current?.focus();
                        return;
                      }
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        const first = q.options![0];
                        setAnswer(first);
                        firstOptionRef.current?.focus();
                        return;
                      }
                      if (e.key === 'Enter' && currentAnswer) {
                        e.preventDefault();
                        handleNext();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant={isCustomTextActive ? 'default' : 'outline'}
                    size={isCustomTextActive ? 'icon' : 'sm'}
                    className={cn(
                      'h-7 shrink-0',
                      isCustomTextActive ? 'w-7' : 'px-2.5 text-sm',
                    )}
                    onClick={() =>
                      isCustomTextActive ? handleNext() : handleSkip()
                    }
                    aria-label={isCustomTextActive ? t('Send') : t('Skip')}
                  >
                    {isCustomTextActive ? (
                      <ArrowRight className="size-4" />
                    ) : (
                      t('Skip')
                    )}
                  </Button>
                </label>
              </div>
            )}

            {q.type === 'text' && (
              <label
                htmlFor={fieldId}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-2 py-2 text-sm font-normal cursor-text transition-colors hover:bg-muted focus-within:bg-muted',
                  currentAnswer && 'bg-muted',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-md bg-muted-foreground/10 text-muted-foreground transition-colors group-focus-within:bg-foreground group-focus-within:text-background',
                    currentAnswer && 'bg-foreground text-background',
                  )}
                >
                  <Pencil className="size-3.5" />
                </span>
                <Input
                  ref={setTextInputEl}
                  id={fieldId}
                  className="h-auto flex-1 min-w-0 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:border-0 dark:bg-transparent"
                  placeholder={q.placeholder}
                  value={answers[currentStep] ?? ''}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && currentAnswer) {
                      e.preventDefault();
                      handleNext();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant={currentAnswer ? 'default' : 'outline'}
                  size={currentAnswer ? 'icon' : 'sm'}
                  className={cn(
                    'h-7 shrink-0',
                    currentAnswer ? 'w-7' : 'px-2.5 text-sm',
                  )}
                  onClick={() => (currentAnswer ? handleNext() : handleSkip())}
                  aria-label={currentAnswer ? t('Send') : t('Skip')}
                >
                  {currentAnswer ? (
                    <ArrowRight className="size-4" />
                  ) : (
                    t('Skip')
                  )}
                </Button>
              </label>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
