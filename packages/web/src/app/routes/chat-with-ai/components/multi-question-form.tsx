import { t } from 'i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Fragment, useEffect, useId, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

import { MultiQuestion } from '../lib/message-parsers';

import {
  ChatAnswerInputRow,
  ChatCard,
  ChatCardHeader,
  ChatConfirmationBubble,
  ChatOptionBadge,
  ChatOptionRow,
} from './chat-card-primitives';

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
  const firstOptionRef = useRef<HTMLDivElement | null>(null);
  const lastOptionRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);
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

  function setFirstOptionEl(el: HTMLDivElement | null) {
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
    return <ChatConfirmationBubble message={t('Answers submitted')} />;
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

  const titleNode = (
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
  );

  const pager = (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="size-6"
        onClick={() => setCurrentStep((s) => s - 1)}
        disabled={currentStep === 0}
        aria-label={t('Back')}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="text-xs font-medium tabular-nums px-0.5">
        {t('{current} of {total}', {
          current: currentStep + 1,
          total: questions.length,
        })}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="size-6"
        onClick={() => handleNext()}
        disabled={!currentAnswer}
        aria-label={t('Next')}
      >
        <ChevronRight className="size-4" />
      </Button>
    </>
  );

  return (
    <ChatCard>
      <ChatCardHeader title={titleNode} actions={pager} onClose={onDismiss} />

      <AnimatePresence mode="wait">
        <motion.div
          key={`opts-${currentStep}`}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.2 }}
          className="mt-2.5"
        >
          {q.type === 'choice' && q.options && (
            <div>
              <div role="menu" aria-label={q.question} className="gap-0">
                {q.options.map((option, i) => {
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
                      <ChatOptionRow
                        tabIndex={
                          focusedRow === i || (focusedRow === null && isFirst)
                            ? 0
                            : -1
                        }
                        selected={selected}
                        focused={focusedRow === i}
                        ref={(el) => {
                          optionRefs.current[i] = el;
                          if (isFirst) setFirstOptionEl(el);
                          if (isLast) lastOptionRef.current = el;
                        }}
                        onClick={() => handleNext(option)}
                        onMouseEnter={() => setHoveredRow(i)}
                        onMouseLeave={() =>
                          setHoveredRow((prev) => (prev === i ? null : prev))
                        }
                        onFocus={() => setFocusedRow(i)}
                        onBlur={() =>
                          setFocusedRow((prev) => (prev === i ? null : prev))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleNext(option);
                            return;
                          }
                          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                            e.preventDefault();
                            return;
                          }
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            if (isLast) {
                              customAnswerInputRef.current?.focus();
                            } else {
                              setFocusedRow(i + 1);
                              optionRefs.current[i + 1]?.focus();
                            }
                            return;
                          }
                          if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            if (isFirst) {
                              customAnswerInputRef.current?.focus();
                            } else {
                              setFocusedRow(i - 1);
                              optionRefs.current[i - 1]?.focus();
                            }
                            return;
                          }
                        }}
                      >
                        <ChatOptionBadge active={focusedRow === i || selected}>
                          {i + 1}
                        </ChatOptionBadge>
                        <span className="flex-1 leading-snug">{option}</span>
                      </ChatOptionRow>
                    </Fragment>
                  );
                })}
              </div>

              <div className="px-3">
                <Separator
                  className={cn(
                    'bg-border/60 transition-opacity duration-150',
                    isBottomSepHidden && 'opacity-0',
                  )}
                />
              </div>

              <ChatAnswerInputRow
                fieldId={fieldId}
                inputRef={customAnswerInputRef}
                value={isCustomTextActive ? answers[currentStep] : ''}
                placeholder={t('Type your answer...')}
                onChange={setAnswer}
                onSubmit={() => handleNext()}
                onSkip={handleSkip}
                onFocus={() => {
                  if (q.options!.includes(answers[currentStep] ?? '')) {
                    setAnswer('');
                  }
                }}
                onMouseEnter={() => setHoveredRow('custom')}
                onMouseLeave={() =>
                  setHoveredRow((prev) => (prev === 'custom' ? null : prev))
                }
                onRowFocus={() => setFocusedRow('custom')}
                onRowBlur={() =>
                  setFocusedRow((prev) => (prev === 'custom' ? null : prev))
                }
                onArrowUp={() => lastOptionRef.current?.focus()}
                onArrowDown={() => firstOptionRef.current?.focus()}
              />
            </div>
          )}

          {q.type === 'text' && (
            <ChatAnswerInputRow
              fieldId={fieldId}
              inputRef={setTextInputEl}
              value={answers[currentStep] ?? ''}
              placeholder={q.placeholder}
              onChange={setAnswer}
              onSubmit={() => handleNext()}
              onSkip={handleSkip}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </ChatCard>
  );
}
