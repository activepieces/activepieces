import { t } from 'i18next';
import { Minus, Plus } from 'lucide-react';
import React from 'react';

const buttonClass =
  'flex size-8 items-center justify-center text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-ring/50';

function NumberStepper({
  value,
  onChange,
  min,
  max,
  step,
  disabled,
}: NumberStepperProps) {
  const parsed = typeof value === 'number' ? value : Number(value);
  const current = Number.isFinite(parsed) ? parsed : min ?? 0;
  const stepBy = step ?? 1;

  const clamp = (next: number) => {
    let result = next;
    if (typeof min === 'number') result = Math.max(min, result);
    if (typeof max === 'number') result = Math.min(max, result);
    return result;
  };

  const atMin = typeof min === 'number' && current <= min;
  const atMax = typeof max === 'number' && current >= max;

  return (
    <div className="inline-flex items-center overflow-hidden rounded-md border border-input">
      <button
        type="button"
        aria-label={t('Decrease')}
        disabled={disabled || atMin}
        onClick={() => onChange(clamp(current - stepBy))}
        className={buttonClass}
      >
        <Minus className="size-4" />
      </button>
      <input
        type="number"
        value={Number.isFinite(parsed) ? parsed : ''}
        min={min}
        max={max}
        step={stepBy}
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.value === '' ? '' : Number(event.target.value))
        }
        className="h-8 w-14 border-x border-input bg-transparent text-center text-sm font-medium tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        aria-label={t('Increase')}
        disabled={disabled || atMax}
        onClick={() => onChange(clamp(current + stepBy))}
        className={buttonClass}
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

NumberStepper.displayName = 'NumberStepper';

export { NumberStepper };

type NumberStepperProps = {
  value: unknown;
  onChange: (value: number | string) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
};
