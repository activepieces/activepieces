import { brandColors, HEX_COLOR_PATTERN } from '@activepieces/shared';
import { t } from 'i18next';

import { cn } from '@/lib/utils';

export const ColorPreview = ({ tone }: ColorPreviewProps) => (
  <div aria-hidden className="flex flex-col gap-2 select-none">
    <ScalePreview label={t('Light')} tone={tone} theme="light" />
    <ScalePreview label={t('Dark')} tone={tone} theme="dark" />
  </div>
);

export const ContrastWarning = ({ color }: ContrastWarningProps) => {
  if (!HEX_COLOR_PATTERN.test(color)) {
    return null;
  }
  const report = brandColors.describeContrast({ hex: color });
  if (report.passesText) {
    return null;
  }
  return (
    <span className="text-xs text-warning-11">
      {report.best.toFixed(2)}:1 ·{' '}
      {t('Below the 4.5:1 minimum for readable text')}
    </span>
  );
};

const ScalePreview = ({ label, tone, theme }: ScalePreviewProps) => {
  const steps = STEP_CLASSES[tone];
  return (
    <div
      data-theme={theme}
      className="flex flex-col gap-3 rounded-md border border-gray-6 bg-panel p-3"
    >
      <span className="text-xs font-medium text-gray-11">{label}</span>
      <div className="flex items-center justify-between gap-3">
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

type ScalePreviewProps = {
  label: string;
  tone: ColorTone;
  theme: 'light' | 'dark';
};

type ContrastWarningProps = {
  color: string;
};

type StepDotProps = {
  className: string;
  title: string;
};
