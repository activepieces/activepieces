import { t } from 'i18next';
import { ArrowRight, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { USE_CASE_OPTIONS } from '@/features/synkra-onboarding';

export function UseCaseStep({
  initial = [],
  onNext,
  onSkip,
}: {
  initial?: string[];
  onNext: (selected: string[]) => void;
  onSkip: () => void;
}) {
  const [selected, setSelected] = useState<string[]>(initial);

  const toggle = (value: string) => {
    setSelected((s) =>
      s.includes(value) ? s.filter((v) => v !== value) : [...s, value],
    );
  };

  return (
    <div className="flex flex-col max-w-2xl mx-auto gap-6 py-8">
      <div>
        <h2 className="text-2xl font-semibold">
          {t('What would you like to automate?')}
        </h2>
        <p className="text-sm text-gray-11 mt-2">
          {t(
            'Pick one or more. We use this to recommend templates and integrations.',
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {USE_CASE_OPTIONS.map((opt) => {
          const active = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className={cn(
                'rounded-lg border p-4 text-left transition-colors flex items-start gap-3',
                active
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-6 hover:border-gray-8',
              )}
            >
              <div
                className={cn(
                  'mt-0.5 flex h-5 w-5 items-center justify-center rounded border',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-gray-7',
                )}
              >
                {active && <Check className="h-3.5 w-3.5" />}
              </div>
              <div className="text-sm font-medium">{t(opt.label)}</div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onSkip}>
          {t('Skip this step')}
        </Button>
        <Button
          onClick={() => onNext(selected)}
          disabled={selected.length === 0}
          className="gap-2"
        >
          {t('Continue')}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
