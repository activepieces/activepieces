import { t } from 'i18next';
import { ArrowRight } from 'lucide-react';
import React from 'react';

import { inputClass } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

function DateRangeProperty({
  value,
  onChange,
  disabled,
  display,
}: DateRangePropertyProps) {
  const current =
    value && typeof value === 'object' ? (value as DateRangeShape) : {};
  const presets = display === 'dropdown' ? DROPDOWN_PRESETS : PILL_PRESETS;
  const fallbackPreset = display === 'dropdown' ? 'last_7_days' : 'any_time';
  const preset = current.preset ?? fallbackPreset;

  const selectPreset = (next: string) => {
    onChange(
      next === 'custom'
        ? { preset: 'custom', after: current.after, before: current.before }
        : { preset: next },
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {display === 'dropdown' ? (
        <Select value={preset} onValueChange={selectPreset} disabled={disabled}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {presets.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {t(option.label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {presets.map((option) => {
            const selected = preset === option.value;
            return (
              <button
                key={option.value}
                type="button"
                disabled={disabled}
                aria-pressed={selected}
                onClick={() => selectPreset(option.value)}
                className={cn(
                  'rounded-full border px-3 py-1 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50',
                  selected
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-input text-muted-foreground hover:text-foreground',
                  disabled && 'pointer-events-none opacity-50',
                )}
              >
                {t(option.label)}
              </button>
            );
          })}
        </div>
      )}
      {preset === 'custom' && (
        <div className="flex items-end gap-2">
          <label className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-xs text-muted-foreground">{t('After')}</span>
            <input
              type="date"
              disabled={disabled}
              value={current.after ?? ''}
              onChange={(event) =>
                onChange({
                  preset: 'custom',
                  after: event.target.value,
                  before: current.before,
                })
              }
              className={inputClass}
            />
          </label>
          <ArrowRight className="mb-2 size-4 shrink-0 text-muted-foreground" />
          <label className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-xs text-muted-foreground">{t('Before')}</span>
            <input
              type="date"
              disabled={disabled}
              value={current.before ?? ''}
              onChange={(event) =>
                onChange({
                  preset: 'custom',
                  after: current.after,
                  before: event.target.value,
                })
              }
              className={inputClass}
            />
          </label>
        </div>
      )}
    </div>
  );
}

DateRangeProperty.displayName = 'DateRangeProperty';

const PILL_PRESETS: { value: string; label: string }[] = [
  { value: 'any_time', label: 'Any time' },
  { value: 'last_7_days', label: 'Last 7 days' },
  { value: 'last_30_days', label: 'Last 30 days' },
  { value: 'this_month', label: 'This month' },
  { value: 'custom', label: 'Custom' },
];

const DROPDOWN_PRESETS: { value: string; label: string }[] = [
  { value: 'any_time', label: 'Any time' },
  { value: 'last_24_hours', label: 'Last 24 hours' },
  { value: 'last_7_days', label: 'Last 7 days' },
  { value: 'last_30_days', label: 'Last 30 days' },
  { value: 'last_90_days', label: 'Last 90 days' },
  { value: 'custom', label: 'Custom range…' },
];

export { DateRangeProperty };

type DateRangeShape = { preset?: string; after?: string; before?: string };

type DateRangePropertyProps = {
  value: unknown;
  onChange: (value: DateRangeShape) => void;
  disabled?: boolean;
  display?: 'dropdown';
};
