import { t } from 'i18next';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Pencil,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

import { MultiQuestion } from '../lib/message-parsers';

import { InteractiveCardShell } from './interactive-card-shell';
import { OptionIcon } from './question-inputs/question-icon';
import { RichQuestionInput } from './question-inputs/rich-question-input';

const MAX_ICON_GRID_LABEL = 24;

function isChoiceQuestion(
  q: MultiQuestion,
): q is Extract<MultiQuestion, { type: 'choice' }> {
  return q.type === 'choice';
}

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
  const [answerValues, setAnswerValues] = useState<Record<number, unknown>>({});
  const [submitted, setSubmitted] = useState(false);
  const [focusedRow, setFocusedRow] = useState<number | 'custom' | null>(null);
  const [hoveredRow, setHoveredRow] = useState<number | 'custom' | null>(null);
  const fieldId = useId();
  const firstOptionRef = useRef<HTMLDivElement | null>(null);
  const lastOptionRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const customAnswerInputRef = useRef<HTMLInputElement>(null);
  const lastFocusedElRef = useRef<HTMLElement | null>(null);

  const isLastStep = currentStep === questions.length - 1;
  const currentAnswer = answers[currentStep]?.trim() ?? '';

  useEffect(() => {
    const target = firstOptionRef.current;
    if (target && lastFocusedElRef.current !== target) {
      target.focus({ preventScroll: true });
      lastFocusedElRef.current = target;
    }
  }, [currentStep]);

  function setAnswer(value: string) {
    setAnswers((prev) => ({ ...prev, [currentStep]: value }));
  }

  const setRichAnswer = useCallback(
    (next: { display: string; value: unknown }) => {
      setAnswers((prev) => ({ ...prev, [currentStep]: next.display }));
      setAnswerValues((prev) => ({ ...prev, [currentStep]: next.value }));
    },
    [currentStep],
  );

  function setFirstOptionEl(el: HTMLDivElement | null) {
    firstOptionRef.current = el;
    if (el && lastFocusedElRef.current !== el) {
      el.focus({ preventScroll: true });
      lastFocusedElRef.current = el;
    }
  }

  function buildRecap(finalAnswers: Record<number, string>): string[] {
    return questions
      .map((qq, i) => {
        const a = finalAnswers[i]?.trim();
        return a ? `- **${qq.question}** ${a}` : null;
      })
      .filter((l): l is string => l !== null);
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
      const lines = buildRecap(finalAnswers);
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
      const lines = buildRecap(answers);
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

  return (
    <InteractiveCardShell
      onDismiss={() => onDismiss?.()}
      title={
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
      }
      headerExtra={
        <>
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
        </>
      }
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={`opts-${currentStep}`}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.2 }}
        >
          {isChoiceQuestion(q) ? (
            <ChoiceBody
              question={q}
              fieldId={fieldId}
              answer={answers[currentStep]}
              focusedRow={focusedRow}
              hoveredRow={hoveredRow}
              setFocusedRow={setFocusedRow}
              setHoveredRow={setHoveredRow}
              setAnswer={setAnswer}
              onPick={handleNext}
              onSkip={handleSkip}
              firstOptionRef={firstOptionRef}
              lastOptionRef={lastOptionRef}
              optionRefs={optionRefs}
              customAnswerInputRef={customAnswerInputRef}
              setFirstOptionEl={setFirstOptionEl}
            />
          ) : (
            <RichQuestionInput
              question={q}
              fieldId={fieldId}
              displayValue={answers[currentStep] ?? ''}
              value={answerValues[currentStep]}
              onChange={setRichAnswer}
              onSubmit={() => handleNext()}
              onSkip={handleSkip}
              isLastStep={isLastStep}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </InteractiveCardShell>
  );
}

function ChoiceBody({
  question,
  fieldId,
  answer,
  focusedRow,
  hoveredRow,
  setFocusedRow,
  setHoveredRow,
  setAnswer,
  onPick,
  onSkip,
  firstOptionRef,
  lastOptionRef,
  optionRefs,
  customAnswerInputRef,
  setFirstOptionEl,
}: {
  question: Extract<MultiQuestion, { type: 'choice' }>;
  fieldId: string;
  answer: string | undefined;
  focusedRow: number | 'custom' | null;
  hoveredRow: number | 'custom' | null;
  setFocusedRow: React.Dispatch<React.SetStateAction<number | 'custom' | null>>;
  setHoveredRow: React.Dispatch<React.SetStateAction<number | 'custom' | null>>;
  setAnswer: (value: string) => void;
  onPick: (value: string) => void;
  onSkip: () => void;
  firstOptionRef: React.MutableRefObject<HTMLDivElement | null>;
  lastOptionRef: React.MutableRefObject<HTMLDivElement | null>;
  optionRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  customAnswerInputRef: React.RefObject<HTMLInputElement | null>;
  setFirstOptionEl: (el: HTMLDivElement | null) => void;
}) {
  const options = question.options;
  const allowCustom = question.allowCustom !== false;
  const isCustomTextActive =
    allowCustom && !!answer && !options.some((o) => o.label === answer);

  const selectedIndex = options.findIndex((o) => answer === o.label);
  const lastOptionIndex = options.length - 1;
  const isOptionActive = (i: number) =>
    focusedRow === i || hoveredRow === i || selectedIndex === i;
  const isCustomActive =
    focusedRow === 'custom' || hoveredRow === 'custom' || isCustomTextActive;
  const isMidSepHidden = (i: number) =>
    isOptionActive(i) || isOptionActive(i - 1);
  const isBottomSepHidden = isOptionActive(lastOptionIndex) || isCustomActive;

  const useIconGrid =
    options.length >= 2 &&
    options.every(
      (o) => (!!o.icon || !!o.piece) && o.label.length <= MAX_ICON_GRID_LABEL,
    );

  if (useIconGrid) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {options.map((option) => {
          const selected = answer === option.label;
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => onPick(option.label)}
              aria-pressed={selected}
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl border border-border/60 px-3 py-4 text-center text-sm transition-colors hover:bg-muted',
                selected && 'border-primary/50 bg-primary/5',
              )}
            >
              <OptionIcon
                piece={option.piece}
                icon={option.icon}
                selected={selected}
                variant="grid"
              />
              <span className="leading-snug">{option.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <div role="menu" aria-label={question.question} className="gap-0">
        {options.map((option, i) => {
          const selected = answer === option.label;
          const isFirst = i === 0;
          const isLast = i === options.length - 1;
          return (
            <Fragment key={option.label}>
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
                role="menuitemradio"
                tabIndex={
                  focusedRow === i || (focusedRow === null && isFirst) ? 0 : -1
                }
                aria-checked={selected}
                ref={(el) => {
                  optionRefs.current[i] = el;
                  if (isFirst) setFirstOptionEl(el);
                  if (isLast) lastOptionRef.current = el;
                }}
                onClick={() => onPick(option.label)}
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
                    onPick(option.label);
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
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-2 py-2 text-sm font-normal cursor-pointer transition-colors hover:bg-muted outline-none',
                  focusedRow === i && !selected && 'bg-muted',
                  selected && 'bg-muted-foreground/15',
                )}
              >
                {option.piece || option.icon ? (
                  <OptionIcon
                    piece={option.piece}
                    icon={option.icon}
                    selected={selected || focusedRow === i}
                    variant="list"
                  />
                ) : (
                  <span
                    aria-hidden
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-md bg-muted-foreground/10 text-xs font-medium text-muted-foreground transition-colors',
                      focusedRow === i && 'bg-foreground text-background',
                      selected && 'bg-foreground text-background',
                    )}
                  >
                    {i + 1}
                  </span>
                )}
                <span className="flex-1 min-w-0 leading-snug">
                  <span className="block">{option.label}</span>
                  {option.description && (
                    <span className="block text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  )}
                </span>
              </div>
            </Fragment>
          );
        })}
      </div>

      {allowCustom && (
        <>
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
              value={isCustomTextActive ? answer : ''}
              onFocus={() => {
                if (options.some((o) => o.label === (answer ?? ''))) {
                  setAnswer('');
                }
              }}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  lastOptionRef.current?.focus();
                  return;
                }
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  firstOptionRef.current?.focus();
                  return;
                }
                if (e.key === 'Enter' && (answer ?? '').trim()) {
                  e.preventDefault();
                  onPick((answer ?? '').trim());
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
                isCustomTextActive ? onPick((answer ?? '').trim()) : onSkip()
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
        </>
      )}
    </div>
  );
}
