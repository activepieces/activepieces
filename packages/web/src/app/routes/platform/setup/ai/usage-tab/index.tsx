import { t } from 'i18next';
import { CalendarRange, ChartLine, Hash, TrendingUp, Type } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import {
  AdminEmpty,
  AdminPageHeader,
  StatCard,
  StatGrid,
  adminSurface,
} from '@/app/components/admin';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { UsageOverview, usageDummyData } from './usage-dummy-data';
import { usageFormat } from './usage-format';
import {
  UsageHeaderControls,
  UsageView,
  useUsageView,
} from './usage-header-controls';
import { UsageHero } from './usage-hero';
import { UsageLimitsCard, UsageTestingSection } from './usage-insight-cards';
import { UsagePreviewSwitcher } from './usage-preview-switcher';
import { UsageSourceDonut } from './usage-source-donut';
import { UsageTopList } from './usage-top-list';

export function UsageTab() {
  const view = useUsageView();
  const overview = useMemo(
    () =>
      usageDummyData.buildOverview({
        period: view.period,
        scope: view.scope,
        preset: view.dataPreset,
      }),
    [view.period, view.scope, view.dataPreset],
  );
  const hasData = view.preset !== 'loading' && view.preset !== 'error';

  return (
    <>
      <AdminPageHeader
        title={t('AI usage')}
        description={
          <div className="flex flex-col gap-1">
            <span>
              {t('Where your AI spend goes across flows, agents and chat.')}
            </span>
            {hasData && overview.totals.calls > 0 && (
              <span className="text-xs">
                {t('Updated {minutes} min ago · Tracking since {date}', {
                  minutes: overview.updatedMinutesAgo,
                  date: new Date(
                    `${overview.trackingSince}T00:00:00Z`,
                  ).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    timeZone: 'UTC',
                  }),
                })}
              </span>
            )}
          </div>
        }
      >
        <UsageHeaderControls
          view={view}
          exportRows={Object.values(overview.top).flat()}
          exportSeries={overview.series.spend}
          exportName="ai-usage"
        />
      </AdminPageHeader>

      <UsageBody view={view} overview={overview} />
      <UsagePreviewSwitcher view={view} />
    </>
  );
}

function UsageBody({
  view,
  overview,
}: {
  view: UsageView;
  overview: UsageOverview;
}) {
  if (view.preset === 'loading') {
    return <UsageSkeleton />;
  }
  if (view.preset === 'error') {
    return (
      <DataFetchErrorState
        entity={t('AI usage')}
        onRetry={() => view.setPreset('rich')}
      />
    );
  }
  if (overview.totals.calls === 0) {
    return (
      <AdminEmpty
        icon={<ChartLine />}
        title={t('No AI usage yet')}
        description={t(
          'Spend shows up here a minute after your first AI step, agent run or chat message.',
        )}
        action={
          <Button variant="outline" size="sm" asChild>
            <Link to="/platform/ai">{t('Set up AI providers')}</Link>
          </Button>
        }
      />
    );
  }
  const { totals } = overview;
  return (
    <>
      <StatGrid columns={3}>
        {overview.forecastUsd === undefined ? (
          <StatCard
            label={t('Average per day')}
            icon={<CalendarRange />}
            value={usageFormat.usd(overview.avgPerDayUsd)}
            hint={usageFormat.periodLabel({ period: view.period })}
          />
        ) : (
          <StatCard
            label={t('Month-end forecast')}
            icon={<TrendingUp />}
            value={usageFormat.usd(overview.forecastUsd)}
            hint={t('At this month’s daily pace')}
          />
        )}
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
          hint={t('{share} of input served from cache', {
            share: usageFormat.percent(totals.cacheShare),
          })}
        />
      </StatGrid>

      <UsageHero
        series={overview.series}
        period={view.period}
        note={
          totals.credits > 0
            ? t('Includes {credits} credits', {
                credits: usageFormat.whole(totals.credits),
              })
            : undefined
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <UsageTopList
          className="lg:col-span-4"
          dimension="project"
          items={overview.top.project}
          totalUsd={totals.spendUsd}
          search={view.search}
        />
        <UsageTopList
          className="lg:col-span-4"
          dimension="flow"
          items={overview.top.flow}
          totalUsd={totals.spendUsd}
          search={view.search}
        />
        <UsageTopList
          className="lg:col-span-4"
          dimension="agent"
          items={overview.top.agent}
          totalUsd={totals.spendUsd}
          search={view.search}
        />
        <UsageSourceDonut
          className="lg:col-span-8"
          sources={overview.bySource}
        />
        <UsageTopList
          className="lg:col-span-4"
          dimension="user"
          items={overview.top.user}
          totalUsd={totals.spendUsd}
          search={view.search}
        />
        <UsageTopList
          className="lg:col-span-4"
          dimension="key"
          items={overview.top.key}
          totalUsd={totals.spendUsd}
          search={view.search}
        />
        <UsageTopList
          className={
            overview.limits.length === 0 ? 'lg:col-span-8' : 'lg:col-span-4'
          }
          dimension="model"
          items={overview.top.model}
          totalUsd={totals.spendUsd}
          search={view.search}
        />
        {overview.limits.length > 0 && (
          <UsageLimitsCard
            className="lg:col-span-4"
            projects={overview.limits}
          />
        )}
      </div>

      <UsageTestingSection
        testing={overview.testing}
        scope={view.scope}
        search={view.search}
      />

      <p className="text-xs text-gray-11">
        {t(
          'Own-key costs come from your provider when it reports them, otherwise from list prices. Open a key to see the split.',
        )}
      </p>
    </>
  );
}

function UsageSkeleton() {
  return (
    <>
      <StatGrid columns={3}>
        {SKELETON_TILES.map((key) => (
          <Skeleton key={key} className="h-[118px] rounded-xl" />
        ))}
      </StatGrid>
      <div className={cn(adminSurface.card, 'flex flex-col gap-5 p-5')}>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-48" />
        </div>
        <Skeleton className="h-[280px] w-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {SKELETON_CARDS.map((card) => (
          <Skeleton
            key={card.key}
            className={cn('h-72 rounded-xl', card.span)}
          />
        ))}
      </div>
    </>
  );
}

const SKELETON_TILES = ['forecast', 'calls', 'tokens'];

const SKELETON_CARDS = [
  { key: 'projects', span: 'lg:col-span-4' },
  { key: 'flows', span: 'lg:col-span-4' },
  { key: 'agents', span: 'lg:col-span-4' },
  { key: 'source', span: 'lg:col-span-8' },
  { key: 'users', span: 'lg:col-span-4' },
];
