import { t } from 'i18next';
import { Check } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { MultiQuestion } from '../lib/message-parsers';

import {
  ChatCard,
  ChatCardActions,
  ChatCardBody,
  ChatCardHeader,
  ChatCardTile,
} from './chat-ui/chat-card';
import {
  ChatOptionGrid,
  ChatOptionItem,
  ChatOptionList,
} from './chat-ui/chat-option';
import { ChatStatusText } from './chat-ui/chat-status';
import {
  OptionIcon,
  QUESTION_TYPE_ICON,
} from './question-inputs/question-icon';
import { questionMetaUtils } from './question-inputs/question-meta';
import { RichQuestionInput } from './question-inputs/rich-question-input';

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

  const isLastStep = currentStep === questions.length - 1;
  const currentAnswer = answers[currentStep]?.trim() ?? '';

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
    const answersWithoutSkipped = withoutStep({
      record: answers,
      step: currentStep,
    });
    setAnswers(answersWithoutSkipped);
    setAnswerValues((prev) => withoutStep({ record: prev, step: currentStep }));
    if (isLastStep) {
      if (submitted) return;
      const lines = buildRecap(answersWithoutSkipped);
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
      <div className="my-3 flex items-center gap-2 text-sm text-gray-11 motion-safe:animate-chat-enter">
        <Check className="size-4 text-success-11" />
        <span>{t('Answers submitted')}</span>
      </div>
    );
  }

  const q = questions[currentStep];
  if (!q) return null;

  const value = answerValues[currentStep];
  const meta = [
    questions.length > 1
      ? t('Question {current} of {total}', {
          current: currentStep + 1,
          total: questions.length,
        })
      : null,
    questionMetaUtils.hint({ question: q, value }),
  ]
    .filter((part): part is string => !!part)
    .join(' · ');
  const summary = questionMetaUtils.footerSummary({ question: q, value });
  const pickedCount =
    q.type === 'multi_choice' && Array.isArray(value) ? value.length : 0;

  return (
    <ChatCard turn>
      <ChatCardHeader
        tile={<ChatCardTile kind="bits" icon={QUESTION_TYPE_ICON[q.type]} />}
        title={q.question}
        meta={meta}
        trailing={<ChatStatusText status="needs-you" />}
      />
      <ChatCardBody key={currentStep}>
        {q.type === 'choice' ? (
          <ChoiceBody
            question={q}
            answer={answers[currentStep]}
            setAnswer={setAnswer}
            onPick={handleNext}
          />
        ) : (
          <RichQuestionInput
            question={q}
            value={value}
            onChange={setRichAnswer}
            onSubmit={() => handleNext()}
          />
        )}
      </ChatCardBody>
      <ChatCardActions>
        <Button
          type="button"
          size="sm"
          disabled={!currentAnswer}
          onClick={() => handleNext()}
        >
          {nextLabel({ isLastStep, pickedCount })}
        </Button>
        {currentStep > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCurrentStep((s) => s - 1)}
          >
            {t('Back')}
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-gray-11"
          onClick={handleSkip}
        >
          {t('Skip')}
        </Button>
        {summary && (
          <span className="ml-auto text-xs tabular-nums text-gray-11">
            {summary}
          </span>
        )}
      </ChatCardActions>
    </ChatCard>
  );
}

function ChoiceBody({
  question,
  answer,
  setAnswer,
  onPick,
}: {
  question: Extract<MultiQuestion, { type: 'choice' }>;
  answer: string | undefined;
  setAnswer: (value: string) => void;
  onPick: (value: string) => void;
}) {
  const options = question.options;
  const allowCustom = question.allowCustom !== false;
  const isOption = options.some((o) => o.label === answer);
  const customValue = allowCustom && answer && !isOption ? answer : '';

  if (options.length === 0) {
    return allowCustom ? (
      <FreeTextInput
        question={question.question}
        value={customValue}
        onChange={setAnswer}
        onSubmit={() => onPick(customValue.trim())}
      />
    ) : null;
  }

  const useGrid =
    options.length >= 2 &&
    options.length <= MAX_GRID_OPTIONS &&
    options.some((o) => !!o.icon || !!o.piece) &&
    options.every(
      (o) => !o.description && o.label.length <= MAX_ICON_GRID_LABEL,
    );
  const items: ChatOptionItem[] = options.map((option) => ({
    id: option.label,
    label: option.label,
    description: option.description,
    leading:
      useGrid || option.piece || option.icon ? (
        <OptionIcon
          piece={option.piece}
          icon={option.icon}
          label={option.label}
          variant="plain"
        />
      ) : undefined,
  }));
  const selected = answer && isOption ? [answer] : [];
  const writeYourOwn = allowCustom
    ? {
        value: customValue,
        onChange: setAnswer,
        onSubmit: () => onPick(customValue.trim()),
        placeholder: t('Type your answer...'),
        restingLabel: t('Something else…'),
      }
    : undefined;

  return useGrid ? (
    <ChatOptionGrid
      mode="radio"
      items={items}
      selected={selected}
      onPick={onPick}
      ariaLabel={question.question}
      writeYourOwn={writeYourOwn}
      autoFocus
    />
  ) : (
    <ChatOptionList
      mode="radio"
      items={items}
      selected={selected}
      onPick={onPick}
      ariaLabel={question.question}
      writeYourOwn={writeYourOwn}
      autoFocus
      numbered
      searchPlaceholder={t('Search options')}
    />
  );
}

function FreeTextInput({
  question,
  value,
  onChange,
  onSubmit,
}: {
  question: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);
  return (
    <Input
      ref={inputRef}
      aria-label={question}
      placeholder={t('Type your answer...')}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
        if (!value.trim()) return;
        event.preventDefault();
        onSubmit();
      }}
    />
  );
}

function nextLabel({
  isLastStep,
  pickedCount,
}: {
  isLastStep: boolean;
  pickedCount: number;
}): string {
  if (isLastStep) return t('Send');
  if (pickedCount > 0) {
    return t('Next · {count} picked', { count: pickedCount });
  }
  return t('Next');
}

function withoutStep<T>({
  record,
  step,
}: {
  record: Record<number, T>;
  step: number;
}): Record<number, T> {
  return Object.fromEntries(
    Object.entries(record).filter(([key]) => Number(key) !== step),
  );
}

const MAX_ICON_GRID_LABEL = 24;
const MAX_GRID_OPTIONS = 9;
