import { t } from 'i18next';
import { ChartLine, Info } from 'lucide-react';
import { ReactNode } from 'react';

import { adminSurface } from '@/app/components/admin';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { usageFormat } from './usage-format';
import { UsageView } from './usage-header-controls';

export function UsageEmptyNote({ view }: { view: UsageView }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-gray-6 bg-gray-1 px-4 py-3">
      <Info className="size-4 shrink-0 text-gray-11" />
      <p className="min-w-0 flex-1 text-sm text-gray-11">
        <span className="font-medium text-gray-12">
          {neverUsed({ view })
            ? t('No AI spend yet.')
            : t('No AI spend in this view.')}
        </span>{' '}
        {emptyReason({ view })}
      </p>
      <EmptyActions view={view} />
    </div>
  );
}

export function UsageEmpty({ view, title, extraAction }: UsageEmptyProps) {
  return (
    <section className={cn(adminSurface.card, 'flex items-start gap-4 p-5')}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gray-3 text-gray-11">
        <ChartLine className="size-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-medium text-gray-12">
            {neverUsed({ view }) ? t('No AI spend yet') : title}
          </h2>
          <p className="text-sm text-gray-11">{emptyReason({ view })}</p>
        </div>
        <EmptyActions view={view} extraAction={extraAction} />
      </div>
    </section>
  );
}

function EmptyActions({
  view,
  extraAction,
}: {
  view: UsageView;
  extraAction?: ReactNode;
}) {
  if (neverUsed({ view })) {
    return null;
  }
  const widerPeriod = view.period !== LONGEST_PERIOD;
  const widerScope = view.scope !== 'all';
  if (!widerPeriod && !widerScope && !extraAction) {
    return null;
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
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
  );
}

function emptyReason({ view }: { view: UsageView }): string {
  if (neverUsed({ view })) {
    return t(
      'It shows up about a minute after the first AI step, agent run or chat message.',
    );
  }
  return t('Nothing used AI in {scope} for {period}.', {
    scope: usageFormat.scopeLabel({ scope: view.scope }),
    period: usageFormat.periodLabel({ period: view.period }).toLowerCase(),
  });
}

function neverUsed({ view }: { view: UsageView }): boolean {
  return view.preset === 'empty';
}

const LONGEST_PERIOD = '90d';

type UsageEmptyProps = {
  view: UsageView;
  title: string;
  extraAction?: ReactNode;
};
