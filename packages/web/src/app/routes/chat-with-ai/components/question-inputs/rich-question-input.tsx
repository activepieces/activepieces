import { addDays, format, isSameDay, nextMonday, startOfDay } from 'date-fns';
import { t } from 'i18next';
import { useEffect, useRef, useState } from 'react';
import { HexColorPicker } from 'react-colorful';

import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import {
  MultiQuestion,
  RichOption,
} from '@/features/chat/lib/chat-store-types';
import { cn } from '@/lib/utils';

import { ChatOptionList } from '../chat-ui/chat-option';

import { OptionIcon } from './question-icon';
import { questionMetaUtils } from './question-meta';

export function RichQuestionInput({
  question,
  value,
  onChange,
  onSubmit,
}: RichQuestionInputProps) {
  useEffect(() => {
    if (value !== undefined) return;
    if (question.type === 'slider') {
      const initial = questionMetaUtils.sliderStart(question);
      onChange({
        display: questionMetaUtils.sliderDisplay({
          value: initial,
          unit: question.unit,
        }),
        value: initial,
      });
    }
    if (question.type === 'color') {
      const initial = question.presets?.[0] ?? accentHex();
      if (initial) onChange({ display: initial, value: initial });
    }
  }, [question, value, onChange]);

  switch (question.type) {
    case 'multi_choice': {
      const selected = Array.isArray(value)
        ? value.filter((v): v is string => typeof v === 'string')
        : [];
      return (
        <MultiChoiceInput
          question={question.question}
          options={question.options}
          value={selected}
          onChange={(next) =>
            onChange({ display: next.join(', '), value: next })
          }
        />
      );
    }
    case 'date':
      return (
        <DateInput
          value={value instanceof Date ? value : undefined}
          onChange={(date) =>
            onChange({
              display: date ? format(date, 'MMM d, yyyy') : '',
              value: date,
            })
          }
        />
      );
    case 'date_range': {
      const range = questionMetaUtils.isDateRange(value) ? value : undefined;
      return (
        <Calendar
          mode="range"
          selected={range}
          onSelect={(next) =>
            onChange({
              display: questionMetaUtils.rangeDisplay(next),
              value: next,
            })
          }
          className="w-fit p-0"
        />
      );
    }
    case 'time':
      return (
        <TimeInput
          question={question.question}
          value={typeof value === 'string' ? value : ''}
          onChange={(next) => onChange({ display: next, value: next })}
          onSubmit={onSubmit}
        />
      );
    case 'slider': {
      const current =
        typeof value === 'number'
          ? value
          : questionMetaUtils.sliderStart(question);
      return (
        <Slider
          aria-label={question.question}
          min={question.min}
          max={question.max}
          step={question.step ?? 1}
          value={[current]}
          onValueChange={(next) =>
            onChange({
              display: questionMetaUtils.sliderDisplay({
                value: next[0],
                unit: question.unit,
              }),
              value: next[0],
            })
          }
          className="py-2"
        />
      );
    }
    case 'color':
      return (
        <ColorInput
          value={typeof value === 'string' ? value : ''}
          presets={question.presets}
          onChange={(next) => onChange({ display: next, value: next })}
        />
      );
    case 'choice':
      return null;
  }
}

function MultiChoiceInput({
  question,
  options,
  value,
  onChange,
}: {
  question: string;
  options: RichOption[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  function toggle(label: string) {
    onChange(
      value.includes(label)
        ? value.filter((l) => l !== label)
        : [...value, label],
    );
  }
  return (
    <ChatOptionList
      mode="check"
      ariaLabel={question}
      numbered
      searchPlaceholder={t('Search options')}
      items={options.map((option) => ({
        id: option.label,
        label: option.label,
        description: option.description,
        leading:
          option.piece || option.icon ? (
            <OptionIcon
              piece={option.piece}
              icon={option.icon}
              variant="plain"
            />
          ) : undefined,
      }))}
      selected={value}
      onPick={toggle}
    />
  );
}

function DateInput({
  value,
  onChange,
}: {
  value: Date | undefined;
  onChange: (next: Date | undefined) => void;
}) {
  const [month, setMonth] = useState<Date>(value ?? new Date());
  const today = startOfDay(new Date());
  const quickPicks = [
    { label: t('Today'), date: today },
    { label: t('Tomorrow'), date: addDays(today, 1) },
    { label: t('Next Monday'), date: nextMonday(today) },
  ];

  function pick(date: Date) {
    setMonth(date);
    onChange(date);
  }

  return (
    <div className="flex flex-col gap-3">
      <Calendar
        mode="single"
        selected={value}
        onSelect={onChange}
        month={month}
        onMonthChange={setMonth}
        className="w-fit p-0"
      />
      <div className="flex flex-wrap gap-2">
        {quickPicks.map((quickPick) => {
          const active =
            value !== undefined && isSameDay(value, quickPick.date);
          return (
            <button
              key={quickPick.label}
              type="button"
              aria-pressed={active}
              onClick={() => pick(quickPick.date)}
              className={cn(
                'h-8 rounded-full border px-3 text-sm transition-colors',
                active
                  ? 'border-accent-7 bg-accent-3 text-accent-11'
                  : 'border-gray-6 text-gray-12 hover:bg-gray-4',
              )}
            >
              {quickPick.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TimeInput({
  question,
  value,
  onChange,
  onSubmit,
}: {
  question: string;
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);
  return (
    <Input
      ref={inputRef}
      type="time"
      aria-label={question}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
        event.preventDefault();
        onSubmit();
      }}
      className="w-40"
    />
  );
}

function ColorInput({
  value,
  presets,
  onChange,
}: {
  value: string;
  presets?: string[];
  onChange: (next: string) => void;
}) {
  const hasPresets = presets !== undefined && presets.length > 0;
  return (
    <div className="flex flex-wrap items-center gap-3">
      {hasPresets && (
        <div className="flex flex-wrap items-center gap-2.5">
          {presets.map((hex) => (
            <button
              key={hex}
              type="button"
              aria-label={hex}
              aria-pressed={value.toLowerCase() === hex.toLowerCase()}
              onClick={() => onChange(hex)}
              className={cn(
                'size-7 rounded-full border border-gray-6 transition-shadow',
                value.toLowerCase() === hex.toLowerCase() &&
                  'ring-2 ring-accent-9 ring-offset-2 ring-offset-panel',
              )}
              style={{ backgroundColor: hex }}
            />
          ))}
          <span aria-hidden className="h-6 w-px bg-gray-6" />
        </div>
      )}
      <div className="flex h-8 items-center gap-2 rounded-lg border border-gray-6 px-2">
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={t('Open the colour picker')}
              className="size-4 shrink-0 rounded border border-gray-6"
              style={{ backgroundColor: value || undefined }}
            />
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-3">
            <HexColorPicker color={value} onChange={onChange} />
          </PopoverContent>
        </Popover>
        <Input
          aria-label={t('Hex colour')}
          value={value}
          maxLength={7}
          onChange={(event) => onChange(event.target.value)}
          className="h-auto w-20 border-0 bg-transparent p-0 font-mono text-sm uppercase shadow-none focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent"
        />
      </div>
    </div>
  );
}

function accentHex(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue('--accent-9')
    .trim();
  return HEX_PATTERN.test(raw) ? raw : null;
}

const HEX_PATTERN = /^#[0-9a-f]{6}$/i;

type RichQuestionInputProps = {
  question: MultiQuestion;
  value: unknown;
  onChange: (next: { display: string; value: unknown }) => void;
  onSubmit: () => void;
};
