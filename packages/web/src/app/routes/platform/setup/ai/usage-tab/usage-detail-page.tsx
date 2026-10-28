import { isNil } from '@activepieces/core-utils';
import {
  AI_USAGE_DIMENSIONS,
  AiUsageDetail,
  AiUsageDimension,
  ApEdition,
  ApFlagId,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  Calculator,
  CircleDollarSign,
  ExternalLink,
  Gauge,
  Hash,
  Play,
  Receipt,
  Type,
} from 'lucide-react';
import { ReactNode } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';

import { AdminPageHeader, StatCard, StatGrid } from '@/app/components/admin';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { Button } from '@/components/ui/button';
import { aiUsageHooks } from '@/features/ai-usage';
import { flagsHooks } from '@/hooks/flags-hooks';

import { usageAdapters } from './usage-adapters';
import { relatedSpan, UsageTrail } from './usage-bits';
import { UsageEmpty } from './usage-empty';
import { usageFormat } from './usage-format';
import {
  UsageHeaderControls,
  UsageView,
  useUsageView,
} from './usage-header-controls';
import { UsageHero } from './usage-hero';
import { UsageDetailSkeleton } from './usage-skeletons';
import { UsageSourceDonut } from './usage-source-donut';
import { UsageTopList } from './usage-top-list';

export function UsageDetailPage() {
  const { dimension: param, id } = useParams();
  const dimension = AI_USAGE_DIMENSIONS.find((item) => item === param);
  const view = useUsageView();
  const { data, isLoading, isError, refetch } = aiUsageHooks.useUsageDetail({
    dimension,
    id,
    period: view.period,
    scope: view.scope,
  });
  if (isNil(dimension)) {
    return <Navigate to={`/platform/ai/usage${view.search}`} replace />;
  }
  const overviewLink = `/platform/ai/usage${view.search}`;

  return (
    <>
      <AdminPageHeader
        title={
          <UsageTrail
            crumbs={[
              { label: t('AI usage'), to: overviewLink },
              {
                label: usageFormat.dimensionLabel({ dimension }),
                to: `/platform/ai/usage/${dimension}${view.search}`,
              },
            ]}
            current={
              data
                ? usageAdapters.itemDisplayName({ item: data.item })
                : usageFormat.dimensionBadge({ dimension })
            }
          />
        }
        description={
          data ? usageAdapters.itemSubtitle({ item: data.item }) : undefined
        }
      >
        <UsageHeaderControls view={view} />
      </AdminPageHeader>
      <DetailBody
        view={view}
        dimension={dimension}
        data={data}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
      />
    </>
  );
}

function DetailBody({
  view,
  dimension,
  data,
  isLoading,
  isError,
  onRetry,
}: {
  view: UsageView;
  dimension: AiUsageDimension;
  data: AiUsageDetail | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => unknown;
}) {
  if (isError) {
    return <DataFetchErrorState entity={t('AI usage')} onRetry={onRetry} />;
  }
  if (isLoading || isNil(data)) {
    return <UsageDetailSkeleton dimension={dimension} />;
  }
  if (usageAdapters.isDetailEmpty({ item: data.item })) {
    return (
      <UsageEmpty
        view={view}
        history={data.history}
        title={t('No spend for this {type} in this period', {
          type: usageFormat.dimensionBadge({ dimension }).toLowerCase(),
        })}
        extraAction={
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/platform/ai/usage/${dimension}${view.search}`}>
              {t('See all {items}', {
                items: usageFormat.dimensionLabel({ dimension }).toLowerCase(),
              })}
            </Link>
          </Button>
        }
      />
    );
  }
  const related = Object.entries(data.related).flatMap(([key, items]) => {
    const other = AI_USAGE_DIMENSIONS.find((item) => item === key);
    return isNil(other) || isNil(items) ? [] : [{ dimension: other, items }];
  });
  const relatedTotal = data.item.spendUsd;

  return (
    <>
      <DetailTiles dimension={dimension} detail={data} />
      <UsageHero
        series={usageAdapters.seriesToPoints({ series: data.series })}
        period={view.period}
        ranges={data.ranges}
        history={data.history}
      />
      {data.bySource && <UsageSourceDonut sources={data.bySource} />}
      {related.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {related.map((group, index) => (
            <UsageTopList
              key={group.dimension}
              className={relatedSpan({ index, count: related.length })}
              dimension={group.dimension}
              items={group.items}
              totalUsd={relatedTotal}
              search={view.search}
              shareOf={t('{name} spend', {
                name: usageAdapters.itemDisplayName({ item: data.item }),
              })}
            />
          ))}
        </div>
      )}
    </>
  );
}

function DetailTiles({
  dimension,
  detail,
}: {
  dimension: AiUsageDimension;
  detail: AiUsageDetail;
}) {
  const { item } = detail;
  const perCall = item.calls === 0 ? 0 : item.spendUsd / item.calls;
  const calls = (
    <StatCard
      key="calls"
      label={t('AI calls')}
      icon={<Hash />}
      value={usageFormat.whole(item.calls)}
      hint={t('{cost} per call on average', { cost: usageFormat.usd(perCall) })}
    />
  );
  const tokens = (
    <StatCard
      key="tokens"
      label={t('Tokens')}
      icon={<Type />}
      value={usageFormat.compact(item.tokens)}
    />
  );
  const tilesByType: Record<AiUsageDimension, ReactNode[]> = {
    project: [
      <StatCard
        key="spend"
        label={t('Spend')}
        icon={<CircleDollarSign />}
        value={usageFormat.usd(item.spendUsd)}
        hint={usageAdapters.itemSubtitle({ item })}
      />,
      calls,
      tokens,
    ],
    flow: [
      <StatCard
        key="runs"
        label={t('Runs')}
        icon={<Play />}
        value={usageFormat.whole(detail.runs ?? 0)}
        hint={t('Runs that made at least one AI call')}
      />,
      <StatCard
        key="per-run"
        label={t('Cost per run')}
        icon={<Calculator />}
        value={usageFormat.usd(
          isNil(detail.runs) || detail.runs === 0
            ? 0
            : item.spendUsd / detail.runs,
        )}
        hint={t('Average across the period')}
      />,
      calls,
    ],
    agent: [
      calls,
      tokens,
      <StatCard
        key="spend"
        label={t('Spend')}
        icon={<CircleDollarSign />}
        value={usageFormat.usd(item.spendUsd)}
      />,
    ],
    user: [
      calls,
      tokens,
      <StatCard
        key="spend"
        label={t('Spend')}
        icon={<CircleDollarSign />}
        value={usageFormat.usd(item.spendUsd)}
      />,
    ],
    key: [
      <StatCard
        key="reported"
        label={t('Reported by provider')}
        icon={<Receipt />}
        value={usageFormat.usd(detail.reportedUsd ?? 0)}
        hint={t('Cost the provider sent back with each call')}
      />,
      <StatCard
        key="estimated"
        label={t('Estimated')}
        icon={<Calculator />}
        value={usageFormat.usd(detail.estimatedUsd ?? 0)}
        hint={t('Tokens times list price, where the provider sent no cost')}
      />,
      <DashboardTile key="dashboard" item={item} />,
    ],
    model: [
      <StatCard
        key="price"
        label={t('List price per 1M tokens')}
        icon={<Gauge />}
        value={
          isNil(item.inputPrice) || isNil(item.outputPrice)
            ? t('Unknown')
            : `${usageFormat.usd(item.inputPrice)} · ${usageFormat.usd(
                item.outputPrice,
              )}`
        }
        hint={
          isNil(item.inputPrice)
            ? t('No list price, so calls count as unpriced')
            : t('Input · output')
        }
      />,
      calls,
      tokens,
    ],
  };
  return <StatGrid columns={3}>{tilesByType[dimension]}</StatGrid>;
}

function DashboardTile({ item }: { item: AiUsageDetail['item'] }) {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const url = usageAdapters.dashboardUrlOf({ item, edition });
  const internal = !isNil(url) && url.startsWith('/');
  return (
    <StatCard
      label={t('Provider dashboard')}
      icon={<ExternalLink />}
      value={internal ? t('Activepieces credits') : t('Your bill')}
      hint={
        internal
          ? t('Credits are billed on your plan')
          : t('Compare these numbers with your provider')
      }
    >
      {!isNil(url) && (
        <Button variant="outline" size="xs" className="w-fit" asChild>
          {internal ? (
            <Link to={url}>{t('Open billing')}</Link>
          ) : (
            <a href={url} target="_blank" rel="noreferrer">
              {t('Open dashboard')}
              <ExternalLink className="size-3.5" />
            </a>
          )}
        </Button>
      )}
    </StatCard>
  );
}
