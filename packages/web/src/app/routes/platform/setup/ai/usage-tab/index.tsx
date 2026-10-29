import { isNil } from '@activepieces/core-utils';
import {
  AiUsageHistory,
  AiUsageOverview,
  AiUsagePeriod,
  AiUsageRanges,
  AiUsageTotals,
} from '@activepieces/shared';
import { t } from 'i18next';
import { CalendarRange, Gauge, Hash, TrendingUp, Type } from 'lucide-react';

import { AdminPageHeader, StatCard, StatGrid } from '@/app/components/admin';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { aiUsageHooks } from '@/features/ai-usage';

import { usageAdapters } from './usage-adapters';
import { UsageEmptyNote } from './usage-empty';
import { usageFormat } from './usage-format';
import {
  UsageHeaderControls,
  UsageView,
  useUsageView,
} from './usage-header-controls';
import { UsageHero } from './usage-hero';
import { UsageOverviewSkeleton } from './usage-skeletons';
import { UsageSourceDonut } from './usage-source-donut';
import { UsageTopList } from './usage-top-list';

export function UsageTab() {
  const view = useUsageView();
  const { data, isLoading, isError, refetch } = aiUsageHooks.useUsageOverview({
    period: view.period,
    scope: view.scope,
  });
  return (
    <>
      <AdminPageHeader
        title={t('AI usage')}
        description={t(
          'Where your AI spend goes across flows, agents and chat.',
        )}
      >
        <UsageHeaderControls view={view} />
      </AdminPageHeader>
      <UsageBody
        view={view}
        data={data}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
      />
    </>
  );
}

function UsageBody({
  view,
  data,
  isLoading,
  isError,
  onRetry,
}: {
  view: UsageView;
  data: AiUsageOverview | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => unknown;
}) {
  if (isError) {
    return <DataFetchErrorState entity={t('AI usage')} onRetry={onRetry} />;
  }
  if (isLoading || isNil(data)) {
    return <UsageOverviewSkeleton />;
  }
  const { totals, history, ranges, top } = data;
  return (
    <>
      {totals.calls === 0 && <UsageEmptyNote view={view} history={history} />}
      <StatGrid columns={3}>
        <PaceTile
          view={view}
          totals={totals}
          ranges={ranges}
          history={history}
        />
        <StatCard
          label={t('AI calls')}
          icon={<Hash />}
          value={usageFormat.whole(totals.calls)}
          hint={t('{cost} per call on average', {
            cost: usageFormat.usd(
              totals.calls === 0 ? 0 : totals.spendUsd / totals.calls,
            ),
          })}
        />
        <StatCard
          label={t('Tokens')}
          icon={<Type />}
          value={usageFormat.compact(totals.tokens)}
          hint={
            totals.tokens === 0
              ? undefined
              : t('{share} of input served from cache', {
                  share: usageFormat.percent(totals.cacheShare),
                })
          }
        />
      </StatGrid>

      <UsageHero
        series={usageAdapters.seriesToPoints({ series: data.series })}
        period={view.period}
        ranges={ranges}
        history={history}
        note={usageAdapters.creditsNote({
          managedCredits: totals.managedCredits,
        })}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <UsageSourceDonut className="lg:col-span-8" sources={data.bySource} />
        <UsageTopList
          className="lg:col-span-4"
          dimension="project"
          items={top.project}
          totalUsd={totals.spendUsd}
          search={view.search}
        />
        <UsageTopList
          className="lg:col-span-4"
          dimension="flow"
          items={top.flow}
          totalUsd={totals.spendUsd}
          search={view.search}
        />
        <UsageTopList
          className="lg:col-span-4"
          dimension="agent"
          items={top.agent}
          totalUsd={totals.spendUsd}
          search={view.search}
        />
        <UsageTopList
          className="lg:col-span-4"
          dimension="user"
          items={top.user}
          totalUsd={totals.spendUsd}
          search={view.search}
        />
        <UsageTopList
          className="lg:col-span-6"
          dimension="key"
          items={top.key}
          totalUsd={totals.spendUsd}
          search={view.search}
        />
        <UsageTopList
          className="lg:col-span-6"
          dimension="model"
          items={top.model}
          totalUsd={totals.spendUsd}
          search={view.search}
        />
      </div>
    </>
  );
}

function PaceTile({
  view,
  totals,
  ranges,
  history,
}: {
  view: UsageView;
  totals: AiUsageTotals;
  ranges: AiUsageRanges;
  history: AiUsageHistory;
}) {
  const pace = usageAdapters.paceOf({
    totals,
    ranges,
    history,
    period: view.period,
  });
  if (view.period === 'this-month' && pace.forecastUsd !== undefined) {
    return (
      <StatCard
        label={t('Month-end forecast')}
        icon={<TrendingUp />}
        info={
          <PaceInfo
            title={t('A projection, not money spent')}
            body={t(
              'Spend so far this month, divided by the days so far, times the days in the month. It moves as the month goes on.',
            )}
          />
        }
        value={usageFormat.usd(pace.forecastUsd)}
        hint={t('Projected by {date} · {amount} a day so far', {
          date: usageAdapters.monthEndDateLabel({ iso: ranges.current.start }),
          amount: usageFormat.usd(pace.avgPerDayUsd),
        })}
      />
    );
  }
  if (SHORT_PERIODS.includes(view.period)) {
    return (
      <StatCard
        label={t('Daily run rate')}
        icon={<Gauge />}
        info={
          <PaceInfo
            title={t('A projection, not money spent')}
            body={t(
              'What a full day would cost if spend kept the pace of this period. Short periods swing a lot, so read it as a rough rate.',
            )}
          />
        }
        value={usageFormat.usd(pace.avgPerDayUsd)}
        hint={t('At the pace of the {period}, for a full day', {
          period: usageFormat
            .periodLabel({ period: view.period })
            .toLowerCase(),
        })}
      />
    );
  }
  return (
    <StatCard
      label={t('Average per day')}
      icon={<CalendarRange />}
      info={
        <PaceInfo
          title={t('Real spend, spread evenly')}
          body={t('Total spend in this period divided by its number of days.')}
        />
      }
      value={usageFormat.usd(pace.avgPerDayUsd)}
      hint={t('Across {period}', {
        period: usageFormat.periodLabel({ period: view.period }).toLowerCase(),
      })}
    />
  );
}

function PaceInfo({ title, body }: { title: string; body: string }) {
  return (
    <span className="flex flex-col gap-1">
      <span className="font-medium">{title}</span>
      <span className="opacity-80">{body}</span>
    </span>
  );
}

const SHORT_PERIODS: AiUsagePeriod[] = ['1h', '6h', '12h', '24h'];
