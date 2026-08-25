import { format } from 'date-fns';
import { t } from 'i18next';
import { ArrowRight, Check, ChevronRight } from 'lucide-react';
import { useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  MultiQuestion,
  RichOption,
} from '@/features/chat/lib/chat-store-types';
import { PieceIconWithPieceName } from '@/features/pieces/components/piece-icon-from-name';
import { cn } from '@/lib/utils';

import { normalizePieceName } from '../../lib/message-parsers';

import { DynamicLucideIcon } from './question-icon';

function MultiChoiceInput({
  options,
  value,
  onChange,
}: {
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
    <div className="flex flex-col gap-1.5">
      {options.map((option) => {
        const selected = value.includes(option.label);
        return (
          <button
            key={option.label}
            type="button"
            onClick={() => toggle(option.label)}
            aria-pressed={selected}
            className={cn(
              'group flex items-center gap-3 rounded-xl border border-border/60 px-3 py-2 text-start text-sm transition-colors hover:bg-muted',
              selected && 'border-primary/40 bg-primary/5',
            )}
          >
            <span
              className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-md border border-border transition-colors',
                selected && 'border-primary bg-primary text-primary-foreground',
              )}
            >
              {selected && <Check className="size-3.5" />}
            </span>
            {option.piece ? (
              <PieceIconWithPieceName
                pieceName={normalizePieceName(option.piece)}
                size="sm"
                border={false}
                showTooltip={false}
              />
            ) : (
              option.icon && (
                <DynamicLucideIcon
                  name={option.icon}
                  className="size-4 text-muted-foreground"
                />
              )
            )}
            <span className="flex-1 min-w-0 leading-snug">
              <span className="block truncate">{option.label}</span>
              {option.description && (
                <span className="block truncate text-xs text-muted-foreground">
                  {option.description}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SliderInput({
  min,
  max,
  step,
  unit,
  value,
  onChange,
}: {
  min: number;
  max: number;
  step?: number;
  unit?: string;
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="px-1">
      <div className="mb-4 flex items-baseline justify-between">
        <span className="text-2xl font-semibold tabular-nums text-foreground">
          {value}
          {unit ? (
            <span className="ms-1 text-base text-muted-foreground">{unit}</span>
          ) : null}
        </span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {min}
          {' – '}
          {max}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step ?? 1}
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
      />
    </div>
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
  return (
    <div className="flex flex-col gap-3">
      {presets && presets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {presets.map((hex) => (
            <button
              key={hex}
              type="button"
              aria-label={hex}
              onClick={() => onChange(hex)}
              className={cn(
                'size-8 rounded-full border border-border/60 transition-transform hover:scale-110',
                value.toLowerCase() === hex.toLowerCase() &&
                  'ring-2 ring-primary ring-offset-2 ring-offset-background',
              )}
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>
      )}
      <div className="flex items-center gap-3">
        <HexColorPicker
          color={value}
          onChange={onChange}
          style={{ width: '100%', height: 140 }}
        />
      </div>
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="size-7 shrink-0 rounded-md border border-border/60"
          style={{ backgroundColor: value }}
        />
        <Input
          value={value}
          maxLength={7}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-28 font-mono text-sm uppercase"
        />
      </div>
    </div>
  );
}

export function RichQuestionInput({
  question,
  fieldId,
  displayValue,
  value,
  onChange,
  onSubmit,
  onSkip,
  isLastStep,
}: {
  question: MultiQuestion;
  fieldId: string;
  displayValue: string;
  value: unknown;
  onChange: (next: { display: string; value: unknown }) => void;
  onSubmit: () => void;
  onSkip: () => void;
  isLastStep: boolean;
}) {
  const hasAnswer = displayValue.trim().length > 0;

  useEffect(() => {
    if (value !== undefined) return;
    if (question.type === 'slider') {
      const initial =
        question.defaultValue ?? Math.round((question.min + question.max) / 2);
      onChange({
        display: formatSliderDisplay(initial, question.unit),
        value: initial,
      });
    }
    if (question.type === 'color') {
      const initial = question.presets?.[0] ?? '#8142E3';
      onChange({ display: initial, value: initial });
    }
  }, [question, value, onChange]);

  return (
    <div className="flex flex-col gap-4">
      {renderControl({ question, fieldId, displayValue, value, onChange })}

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onSkip}>
          {t('Skip')}
        </Button>
        <Button
          type="button"
          size="sm"
          className="gap-1.5"
          disabled={!hasAnswer}
          onClick={onSubmit}
        >
          {isLastStep ? t('Send') : t('Next')}
          {isLastStep ? (
            <ArrowRight className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

function formatSliderDisplay(value: number, unit?: string): string {
  return unit ? `${value} ${unit}` : `${value}`;
}

function renderControl({
  question,
  fieldId,
  displayValue,
  value,
  onChange,
}: {
  question: MultiQuestion;
  fieldId: string;
  displayValue: string;
  value: unknown;
  onChange: (next: { display: string; value: unknown }) => void;
}) {
  switch (question.type) {
    case 'multi_choice': {
      const selected = Array.isArray(value)
        ? value.filter((v): v is string => typeof v === 'string')
        : [];
      return (
        <MultiChoiceInput
          options={question.options}
          value={selected}
          onChange={(next) =>
            onChange({ display: next.join(', '), value: next })
          }
        />
      );
    }
    case 'date': {
      const selected = value instanceof Date ? value : undefined;
      return (
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(date) =>
              onChange({
                display: date ? format(date, 'MMM d, yyyy') : '',
                value: date,
              })
            }
          />
        </div>
      );
    }
    case 'date_range': {
      const range = isDateRange(value) ? value : undefined;
      return (
        <div className="flex justify-center">
          <Calendar
            mode="range"
            selected={range}
            onSelect={(next) =>
              onChange({
                display: formatRange(next),
                value: next,
              })
            }
          />
        </div>
      );
    }
    case 'time': {
      const current = typeof value === 'string' ? value : '';
      return (
        <Input
          id={fieldId}
          type="time"
          value={current}
          onChange={(e) =>
            onChange({ display: e.target.value, value: e.target.value })
          }
          className="w-40"
        />
      );
    }
    case 'slider': {
      const current =
        typeof value === 'number'
          ? value
          : question.defaultValue ??
            Math.round((question.min + question.max) / 2);
      return (
        <SliderInput
          min={question.min}
          max={question.max}
          step={question.step}
          unit={question.unit}
          value={current}
          onChange={(next) =>
            onChange({
              display: formatSliderDisplay(next, question.unit),
              value: next,
            })
          }
        />
      );
    }
    case 'color': {
      const current =
        typeof value === 'string' && value ? value : displayValue || '#8142E3';
      return (
        <ColorInput
          value={current}
          presets={question.presets}
          onChange={(next) => onChange({ display: next, value: next })}
        />
      );
    }
    default:
      return null;
  }
}

function isDateRange(value: unknown): value is DateRange {
  return !!value && typeof value === 'object' && 'from' in value;
}

function formatRange(range: DateRange | undefined): string {
  if (!range?.from) return '';
  if (!range.to) return format(range.from, 'MMM d, yyyy');
  return `${format(range.from, 'MMM d')} – ${format(range.to, 'MMM d, yyyy')}`;
}
