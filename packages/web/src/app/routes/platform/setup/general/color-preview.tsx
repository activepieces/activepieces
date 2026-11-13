import { t } from 'i18next';

import { cn } from '@/lib/utils';

export const ColorPreview = ({ tone }: ColorPreviewProps) => {
  const steps = STEP_CLASSES[tone];
  return (
    <div
      aria-hidden
      className="flex items-center justify-between gap-3 rounded-md bg-gray-2 px-3 py-2.5 select-none"
    >
      <span className={cn('rounded-md px-3 py-1.5 text-sm', steps.button)}>
        {t('Button')}
      </span>
      <div className="flex items-center gap-1.5">
        <StepDot className={steps.surface} title={t('Surface')} />
        <StepDot className={steps.border} title={t('Border')} />
        <StepDot className={steps.solid} title={t('Solid')} />
        <StepDot className={steps.hover} title={t('Hover')} />
        <StepDot className={steps.text} title={t('Text and marks')} />
      </div>
    </div>
  );
};

const StepDot = ({ className, title }: StepDotProps) => (
  <span
    title={title}
    className={cn('size-4 rounded-full border border-gray-6', className)}
  />
);

const STEP_CLASSES: Record<ColorTone, ScaleStepClasses> = {
  primary: {
    button: 'bg-accent-9 text-on-accent',
    surface: 'bg-accent-3',
    border: 'bg-accent-7',
    solid: 'bg-accent-9',
    hover: 'bg-accent-9/90',
    text: 'bg-accent-11',
  },
  danger: {
    button: 'bg-danger-9 text-on-danger',
    surface: 'bg-danger-3',
    border: 'bg-danger-7',
    solid: 'bg-danger-9',
    hover: 'bg-danger-9/90',
    text: 'bg-danger-11',
  },
  warning: {
    button: 'bg-warning-9 text-on-warning',
    surface: 'bg-warning-3',
    border: 'bg-warning-7',
    solid: 'bg-warning-9',
    hover: 'bg-warning-9/90',
    text: 'bg-warning-11',
  },
  success: {
    button: 'bg-success-9 text-on-success',
    surface: 'bg-success-3',
    border: 'bg-success-7',
    solid: 'bg-success-9',
    hover: 'bg-success-9/90',
    text: 'bg-success-11',
  },
};

export type ColorTone = 'primary' | 'danger' | 'warning' | 'success';

type ScaleStepClasses = {
  button: string;
  surface: string;
  border: string;
  solid: string;
  hover: string;
  text: string;
};

type ColorPreviewProps = {
  tone: ColorTone;
};

type StepDotProps = {
  className: string;
  title: string;
};
