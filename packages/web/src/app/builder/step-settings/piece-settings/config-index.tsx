import { t } from 'i18next';
import { AlertCircle, Check } from 'lucide-react';

import { cn } from '@/lib/utils';

import { type ConfigSection } from './config-sections';

function ConfigIndex({
  sections,
  activeKey,
  stateByKey,
  showDescriptions,
  onSelect,
}: ConfigIndexProps) {
  return (
    <nav aria-label={t('Sections')}>
      <ol className="flex flex-col gap-0.5">
        {sections.map((section, index) => {
          const state = stateByKey[section.key] ?? 'pending';
          const isActive = section.key === activeKey;
          return (
            <li key={section.key}>
              <button
                type="button"
                onClick={() => onSelect(section.key)}
                aria-current={isActive ? 'step' : undefined}
                className={cn(
                  'group flex w-full items-start gap-2.5 rounded-md px-2 py-2 text-left transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35',
                  isActive ? 'bg-primary/10' : 'hover:bg-muted',
                )}
              >
                <SectionMarker
                  index={index}
                  state={state}
                  isActive={isActive}
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'block truncate text-[13px] leading-5',
                      isActive
                        ? 'font-semibold text-foreground'
                        : state === 'error'
                        ? 'font-medium text-destructive'
                        : 'font-medium text-muted-foreground group-hover:text-foreground',
                    )}
                  >
                    {t(section.label)}
                  </span>
                  {showDescriptions && section.description && (
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {t(section.description)}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

ConfigIndex.displayName = 'ConfigIndex';

function SectionMarker({
  index,
  state,
  isActive,
}: {
  index: number;
  state: ConfigSectionState;
  isActive: boolean;
}) {
  if (state === 'complete') {
    return (
      <span
        aria-label={t('Completed')}
        className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-success-100 text-success-600"
      >
        <Check className="size-3.5" strokeWidth={3} />
      </span>
    );
  }
  if (state === 'error') {
    return (
      <span
        aria-label={t('Has errors')}
        className="mt-0.5 flex size-5 shrink-0 items-center justify-center text-destructive"
      >
        <AlertCircle className="size-4" />
      </span>
    );
  }
  return (
    <span
      className={cn(
        'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground',
      )}
    >
      {index + 1}
    </span>
  );
}

export { ConfigIndex };

export type ConfigSectionState = 'pending' | 'complete' | 'error';

type ConfigIndexProps = {
  sections: ConfigSection[];
  activeKey: string;
  stateByKey: Record<string, ConfigSectionState>;
  showDescriptions: boolean;
  onSelect: (key: string) => void;
};
