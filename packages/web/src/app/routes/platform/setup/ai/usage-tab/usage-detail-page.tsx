import { isNil } from '@activepieces/core-utils';
import { t } from 'i18next';
import {
  Calculator,
  ChartLine,
  CircleDollarSign,
  ExternalLink,
  Gauge,
  Hash,
  Play,
  Receipt,
  Type,
} from 'lucide-react';
import { ReactNode, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';

import {
  AdminEmpty,
  AdminPageHeader,
  StatCard,
  StatGrid,
} from '@/app/components/admin';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import { SetLimitDialog } from './set-limit-dialog';
import { ItemIcon } from './usage-bits';
import {
  USAGE_DIMENSIONS,
  UsageDetail,
  usageDummyData,
  UsageDimension,
} from './usage-dummy-data';
import { usageFormat } from './usage-format';
import {
  UsageHeaderControls,
  UsageView,
  useUsageView,
} from './usage-header-controls';
import { UsageHero } from './usage-hero';
import { UsagePreviewSwitcher } from './usage-preview-switcher';
import { UsageSourceDonut } from './usage-source-donut';
import { UsageTopList } from './usage-top-list';

export function UsageDetailPage() {
  const { dimension: param, id } = useParams();
  const dimension = USAGE_DIMENSIONS.find((item) => item === param);
  const view = useUsageView();
  const detail = useMemo(
    () =>
      isNil(dimension) || isNil(id) || view.preset === 'empty'
        ? undefined
        : usageDummyData.buildDetail({
            period: view.period,
            scope: view.scope,
            preset: view.dataPreset,
            dimension,
            id,
          }),
    [dimension, id, view.period, view.scope, view.dataPreset, view.preset],
  );
  if (isNil(dimension)) {
    return <Navigate to={`/platform/ai/usage${view.search}`} replace />;
  }
  const overviewLink = `/platform/ai/usage${view.search}`;

  return (
    <>
      <AdminPageHeader
        back={{ to: overviewLink, label: t('AI usage') }}
        title={
          <div className="flex min-w-0 items-center gap-2.5">
            {detail && <ItemIcon item={detail.item} />}
            <h1 className="min-w-0 break-words text-2xl font-semibold tracking-tight text-gray-12">
              {detail?.item.name ?? usageFormat.dimensionBadge({ dimension })}
            </h1>
            <Badge variant="secondary">
              {usageFormat.dimensionBadge({ dimension })}
            </Badge>
          </div>
        }
        description={
          detail?.item.parent
            ? t('In {parent}', { parent: detail.item.parent })
            : undefined
        }
      >
        <UsageHeaderControls
          view={view}
          exportRows={
            detail ? [detail.item, ...Object.values(detail.related).flat()] : []
          }
          exportSeries={detail?.series.spend ?? []}
          exportName={`ai-usage-${dimension}-${id ?? ''}`}
        />
      </AdminPageHeader>
      <DetailBody view={view} dimension={dimension} detail={detail} />
      <UsagePreviewSwitcher view={view} />
    </>
  );
}

function DetailBody({
  view,
  dimension,
  detail,
}: {
  view: UsageView;
  dimension: UsageDimension;
  detail: UsageDetail | undefined;
}) {
  if (view.preset === 'loading') {
    return (
      <>
        <StatGrid columns={3}>
          {['a', 'b', 'c'].map((key) => (
            <Skeleton key={key} className="h-[118px] rounded-xl" />
          ))}
        </StatGrid>
        <Skeleton className="h-[380px] rounded-xl" />
      </>
    );
  }
  if (view.preset === 'error') {
    return (
      <DataFetchErrorState
        entity={t('AI usage')}
        onRetry={() => view.setPreset('rich')}
      />
    );
  }
  if (isNil(detail)) {
    return (
      <AdminEmpty
        icon={<ChartLine />}
        title={t('No AI usage for this {type} in this period', {
          type: usageFormat.dimensionBadge({ dimension }).toLowerCase(),
        })}
        description={t(
          'Pick a longer period, or switch to All to include test runs.',
        )}
        action={
          <Button variant="outline" size="sm" asChild>
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
  const related = Object.entries(detail.related).flatMap(([key, items]) => {
    const other = USAGE_DIMENSIONS.find((item) => item === key);
    return isNil(other) || isNil(items) ? [] : [{ dimension: other, items }];
  });
  const relatedTotal = detail.item.spendUsd;

  return (
    <>
      <DetailTiles dimension={dimension} detail={detail} />
      <UsageHero
        series={detail.series}
        period={view.period}
        history={detail.history}
      />
      {detail.bySource && <UsageSourceDonut sources={detail.bySource} />}
      {related.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {related.map((group, index) => (
            <UsageTopList
              key={group.dimension}
              className={spanFor({ index, count: related.length })}
              dimension={group.dimension}
              items={group.items}
              totalUsd={relatedTotal}
              search={view.search}
              shareOf={t('{name} spend', { name: detail.item.name })}
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
  dimension: UsageDimension;
  detail: UsageDetail;
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
  const tilesByType: Record<UsageDimension, ReactNode[]> = {
    project: [<ProjectLimitTile key="limit" detail={detail} />, calls, tokens],
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
      <DashboardTile key="dashboard" url={item.dashboardUrl} />,
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

function ProjectLimitTile({ detail }: { detail: UsageDetail }) {
  const [limitUsd, setLimitUsd] = useState<number | null>(
    detail.item.monthlyLimitUsd ?? null,
  );
  const [editing, setEditing] = useState(false);
  const spent = detail.item.monthToDateUsd ?? detail.item.spendUsd;
  const used = isNil(limitUsd) ? 0 : spent / limitUsd;
  return (
    <StatCard
      label={t('Monthly limit')}
      icon={<Gauge />}
      value={isNil(limitUsd) ? t('No limit') : usageFormat.usd(limitUsd)}
      tone={used >= 1 ? 'danger' : used >= LIMIT_WARN ? 'warning' : 'default'}
      hint={
        isNil(limitUsd)
          ? t('New AI calls never stop for this project')
          : t('{spent} used this month', { spent: usageFormat.usd(spent) })
      }
    >
      {!isNil(limitUsd) && (
        <Progress
          value={Math.min(used * 100, 100)}
          className={cn(
            'h-1.5',
            used >= 1
              ? '*:bg-danger-9'
              : used >= LIMIT_WARN
              ? '*:bg-warning-9'
              : '',
          )}
        />
      )}
      <Button
        variant="outline"
        size="xs"
        className="w-fit"
        onClick={() => setEditing(true)}
      >
        {isNil(limitUsd) ? t('Set limit') : t('Change limit')}
      </Button>
      <SetLimitDialog
        open={editing}
        onOpenChange={setEditing}
        projectName={detail.item.name}
        currentLimitUsd={limitUsd}
        onSave={(value) => {
          setLimitUsd(value);
          setEditing(false);
        }}
      />
    </StatCard>
  );
}

function DashboardTile({ url }: { url: string | undefined }) {
  const internal = !isNil(url) && url.startsWith('/');
  return (
    <StatCard
      label={t('Provider dashboard')}
      icon={<ExternalLink />}
      value={internal ? t('Credits') : t('Your bill')}
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

function spanFor({ index, count }: { index: number; count: number }): string {
  if (count % 3 === 0) {
    return 'lg:col-span-4';
  }
  if (count % 3 === 2) {
    return index >= count - 2 ? 'lg:col-span-6' : 'lg:col-span-4';
  }
  return 'lg:col-span-6';
}

const LIMIT_WARN = 0.8;
