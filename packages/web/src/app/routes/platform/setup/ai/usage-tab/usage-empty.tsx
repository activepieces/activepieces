import { isNil } from '@activepieces/core-utils';
import { AiUsageHistory, ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import { ChartLine, Info } from 'lucide-react';
import { ReactNode } from 'react';

import { adminSurface } from '@/app/components/admin';
import { Button } from '@/components/ui/button';
import { flagsHooks } from '@/hooks/flags-hooks';
import { cn } from '@/lib/utils';

import { usageFormat } from './usage-format';
import { UsageView } from './usage-header-controls';

export function UsageEmptyNote({
  view,
  history,
}: {
  view: UsageView;
  history: AiUsageHistory;
}) {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const state = stateOf({ edition, history });
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-gray-6 bg-gray-1 px-4 py-3">
      <Info className="size-4 shrink-0 text-gray-11" />
      <p className="min-w-0 flex-1 text-sm text-gray-11">
        <span className="font-medium text-gray-12">
          {headlineOf({ state })}
        </span>{' '}
        {reasonOf({ state, view })}
      </p>
      <EmptyActions state={state} view={view} />
    </div>
  );
}

export function UsageEmpty({
  view,
  history,
  title,
  extraAction,
}: UsageEmptyProps) {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const state = stateOf({ edition, history });
  return (
    <section className={cn(adminSurface.card, 'flex items-start gap-4 p-5')}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gray-3 text-gray-11">
        <ChartLine className="size-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-medium text-gray-12">
            {state === 'filtered' ? title : headlineOf({ state })}
          </h2>
          <p className="text-sm text-gray-11">{reasonOf({ state, view })}</p>
        </div>
        <EmptyActions state={state} view={view} extraAction={extraAction} />
      </div>
    </section>
  );
}

function EmptyActions({
  state,
  view,
  extraAction,
}: {
  state: UsageEmptyState;
  view: UsageView;
  extraAction?: ReactNode;
}) {
  if (state !== 'filtered') {
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

function headlineOf({ state }: { state: UsageEmptyState }): string {
  switch (state) {
    case 'unavailable':
      return t("AI usage isn't available on this install");
    case 'never-used':
      return t('No AI spend yet.');
    case 'filtered':
      return t('No AI spend in this view.');
  }
}

function reasonOf({
  state,
  view,
}: {
  state: UsageEmptyState;
  view: UsageView;
}): string {
  switch (state) {
    case 'unavailable':
      return t(
        'Usage data comes from your billing connection, which this install does not have.',
      );
    case 'never-used':
      return t(
        'It shows up a few minutes after the first AI step, agent run or chat message.',
      );
    case 'filtered':
      return t('Nothing used AI in {scope} for {period}.', {
        scope: usageFormat.scopeLabel({ scope: view.scope }),
        period: usageFormat.periodLabel({ period: view.period }).toLowerCase(),
      });
  }
}

function stateOf({
  edition,
  history,
}: {
  edition: ApEdition | null;
  history: AiUsageHistory;
}): UsageEmptyState {
  if (edition === ApEdition.ENTERPRISE && isNil(history.trackingSince)) {
    return 'unavailable';
  }
  return history.hasAnyUsage ? 'filtered' : 'never-used';
}

const LONGEST_PERIOD = '90d';

type UsageEmptyState = 'unavailable' | 'never-used' | 'filtered';

type UsageEmptyProps = {
  view: UsageView;
  history: AiUsageHistory;
  title: string;
  extraAction?: ReactNode;
};
