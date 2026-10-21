import { t } from 'i18next';
import { Bot, MessageSquare, Workflow } from 'lucide-react';
import { ReactNode } from 'react';

import { adminSurface } from '@/app/components/admin';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { usageFormat } from './usage-format';
import { UsageView } from './usage-header-controls';

export function UsageEmpty({
  view,
  ghost,
  title,
  extraAction,
}: UsageEmptyProps) {
  const never = view.preset === 'empty';
  const widerPeriod = view.period !== LONGEST_PERIOD;
  const widerScope = view.scope !== 'all';
  return (
    <section
      className={cn(
        adminSurface.card,
        'relative flex min-h-[360px] flex-col items-center justify-center overflow-hidden px-6 py-12',
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 opacity-70 [mask-image:linear-gradient(to_top,black,transparent)]"
      >
        {ghost === 'chart' ? <GhostChart /> : <GhostRows />}
      </div>
      <div className="relative flex max-w-md flex-col items-center gap-3 text-center">
        <h2 className="text-lg font-semibold text-gray-12">
          {never
            ? t('No AI spend yet')
            : title ?? t('No AI spend in this view')}
        </h2>
        <p className="text-sm text-gray-11">
          {never
            ? t(
                'Spend shows up here about a minute after the first AI call, from any project.',
              )
            : t('Nothing used AI in {scope} for {period}.', {
                scope: usageFormat.scopeLabel({ scope: view.scope }),
                period: usageFormat
                  .periodLabel({ period: view.period })
                  .toLowerCase(),
              })}
        </p>
        {never ? (
          <ul className="mt-2 flex flex-wrap justify-center gap-2">
            {trackedSources().map((source) => (
              <li
                key={source.label}
                className="flex items-center gap-1.5 rounded-full border border-gray-6 bg-gray-1 px-3 py-1 text-xs text-gray-11"
              >
                {source.icon}
                {source.label}
              </li>
            ))}
          </ul>
        ) : (
          (widerPeriod || widerScope || extraAction) && (
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {widerPeriod && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => view.setPeriod(LONGEST_PERIOD)}
                >
                  {t('Show last 90 days')}
                </Button>
              )}
              {widerScope && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => view.setScope('all')}
                >
                  {view.scope === 'production'
                    ? t('Include testing')
                    : t('Include production')}
                </Button>
              )}
              {extraAction}
            </div>
          )
        )}
      </div>
    </section>
  );
}

function GhostChart() {
  return (
    <svg viewBox="0 0 600 200" preserveAspectRatio="none" className="size-full">
      <path
        d="M0 150 C 60 140, 90 120, 140 128 S 230 90, 290 100 S 380 60, 440 72 S 540 40, 600 30 L 600 200 L 0 200 Z"
        fill="var(--gray-3)"
      />
      <path
        d="M0 150 C 60 140, 90 120, 140 128 S 230 90, 290 100 S 380 60, 440 72 S 540 40, 600 30"
        fill="none"
        stroke="var(--gray-7)"
        strokeWidth={2}
        strokeDasharray="6 6"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function GhostRows() {
  return (
    <ul className="flex flex-col gap-5 px-8 pt-6">
      {GHOST_ROWS.map((width) => (
        <li key={width} className="flex items-center gap-3">
          <span className="size-8 shrink-0 rounded-lg bg-gray-3" />
          <span className="flex flex-1 flex-col gap-1.5">
            <span className="h-3 rounded-full bg-gray-3" style={{ width }} />
            <span className="h-1 w-24 rounded-full bg-gray-3" />
          </span>
          <span className="h-3 w-14 rounded-full bg-gray-3" />
        </li>
      ))}
    </ul>
  );
}

function trackedSources(): { label: string; icon: ReactNode }[] {
  return [
    { label: t('AI steps in flows'), icon: <Workflow className="size-3.5" /> },
    { label: t('Agent runs'), icon: <Bot className="size-3.5" /> },
    { label: t('Chat'), icon: <MessageSquare className="size-3.5" /> },
  ];
}

const LONGEST_PERIOD = '90d';
const GHOST_ROWS = ['40%', '32%', '36%', '28%'];

type UsageEmptyProps = {
  view: UsageView;
  ghost: 'chart' | 'rows';
  title?: string;
  extraAction?: ReactNode;
};
