import { brandColors, HEX_COLOR_PATTERN } from '@activepieces/shared';
import { t } from 'i18next';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export const ColorSample = ({ tone, theme }: ColorSampleProps) => (
  <div
    data-theme={theme}
    className="flex items-center gap-1.5 rounded-md border border-gray-6 bg-panel px-2 py-1.5"
  >
    <span
      className={cn(
        'rounded-sm px-2 py-0.5 text-xs',
        TONES[tone].solidClassName,
      )}
    >
      {t('Button')}
    </span>
    <Badge variant={TONES[tone].badge}>{TONES[tone].badgeLabel()}</Badge>
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

const TONES: Record<ColorTone, Tone> = {
  primary: {
    solidClassName: 'bg-accent-9 text-on-accent',
    badge: 'info',
    badgeLabel: () => t('Active'),
  },
  danger: {
    solidClassName: 'bg-danger-9 text-on-danger',
    badge: 'destructive',
    badgeLabel: () => t('Failed'),
  },
  warning: {
    solidClassName: 'bg-warning-9 text-on-warning',
    badge: 'warning',
    badgeLabel: () => t('Paused'),
  },
  success: {
    solidClassName: 'bg-success-9 text-on-success',
    badge: 'success',
    badgeLabel: () => t('Succeeded'),
  },
};

export type ColorTone = 'primary' | 'danger' | 'warning' | 'success';

type Tone = {
  solidClassName: string;
  badge: 'info' | 'destructive' | 'warning' | 'success';
  badgeLabel: () => string;
};

type ColorSampleProps = {
  tone: ColorTone;
  theme: 'light' | 'dark';
};

type ContrastWarningProps = {
  color: string;
};
