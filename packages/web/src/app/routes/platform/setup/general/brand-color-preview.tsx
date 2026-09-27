import { brandColors, HEX_COLOR_PATTERN } from '@activepieces/shared';
import { t } from 'i18next';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export const BrandColorPreview = ({ color }: BrandColorPreviewProps) => {
  if (!HEX_COLOR_PATTERN.test(color)) {
    return null;
  }
  const report = brandColors.describeContrast({ hex: color });
  const labelIsWhite = report.onWhite >= report.onBlack;
  const seed = brandColors.cssVariables({ primaryColor: color });

  return (
    <div className="flex flex-col gap-3 rounded-md border border-gray-6 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-gray-11">
          {t('Label contrast')}
        </span>
        <Badge variant={report.passesText ? 'success' : 'warning'}>
          {report.best.toFixed(2)}:1
        </Badge>
        <span className="text-xs text-gray-11">
          {labelIsWhite ? t('white label') : t('black label')}
        </span>
        {!report.passesText && (
          <span className="text-xs text-warning-11">
            {t('Below the 4.5:1 minimum for readable text')}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <ScalePreview label={t('Light')} seed={seed} />
        <ScalePreview label={t('Dark')} seed={seed} inverse />
      </div>
    </div>
  );
};

const ScalePreview = ({ label, seed, inverse }: ScalePreviewProps) => (
  <div
    data-theme={inverse ? 'dark' : 'light'}
    ref={(element) => applySeed({ element, seed })}
    className="flex min-w-[170px] flex-1 flex-col gap-2 rounded-md border border-gray-6 bg-panel p-3"
  >
    <span className="text-xs font-medium text-gray-11">{label}</span>
    <span className="rounded-md bg-accent-9 px-3 py-1.5 text-center text-sm text-on-accent">
      {t('Button')}
    </span>
    <div className="flex items-center gap-1.5">
      <StepDot className="bg-accent-3" title={t('Surface')} />
      <StepDot className="bg-accent-7" title={t('Border')} />
      <StepDot className="bg-accent-9" title={t('Solid')} />
      <StepDot className="bg-accent-9/90" title={t('Hover')} />
      <StepDot className="bg-accent-11" title={t('Text and marks')} />
    </div>
  </div>
);

const StepDot = ({ className, title }: StepDotProps) => (
  <span
    title={title}
    className={cn('size-5 rounded-full border border-gray-6', className)}
  />
);

function applySeed({
  element,
  seed,
}: {
  element: HTMLDivElement | null;
  seed: Record<string, string>;
}) {
  Object.entries(seed).forEach(([name, value]) =>
    element?.style.setProperty(name, value),
  );
}

type BrandColorPreviewProps = {
  color: string;
};

type ScalePreviewProps = {
  label: string;
  seed: Record<string, string>;
  inverse?: boolean;
};

type StepDotProps = {
  className: string;
  title: string;
};
