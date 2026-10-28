import { AIProviderName, isNil } from '@activepieces/core-utils';
import {
  AI_USAGE_CREDITS_KEY_ID,
  AI_USAGE_NO_PROJECT_ID,
  AI_USAGE_UNKNOWN_KEY_PREFIX,
  AiUsageDimension,
  AiUsageHistory,
  AiUsageItem,
  AiUsagePeriod,
  AiUsageRanges,
  AiUsageSeriesPoint,
  AiUsageTotals,
  ApEdition,
} from '@activepieces/shared';
import { t } from 'i18next';

import { SUPPORTED_AI_PROVIDERS } from '@/features/agents';

import { usageFormat } from './usage-format';
import { UsageMetric, UsagePoint } from './usage-types';

function seriesToPoints({
  series,
}: {
  series: AiUsageSeriesPoint[];
}): Record<UsageMetric, UsagePoint[]> {
  const pointsFor = (metric: UsageMetric): UsagePoint[] =>
    series.map((point) => ({
      label: point.label,
      current: valueOf({ point, metric, previous: false }),
      previous: valueOf({ point, metric, previous: true }),
    }));
  return {
    spend: pointsFor('spend'),
    calls: pointsFor('calls'),
    tokens: pointsFor('tokens'),
  };
}

function valueOf({
  point,
  metric,
  previous,
}: {
  point: AiUsageSeriesPoint;
  metric: UsageMetric;
  previous: boolean;
}): number | null {
  switch (metric) {
    case 'spend':
      return previous ? point.previousSpendUsd : point.spendUsd;
    case 'calls':
      return previous ? point.previousCalls : point.calls;
    case 'tokens':
      return previous ? point.previousTokens : point.tokens;
  }
}

function creditsNote({
  managedCredits,
}: {
  managedCredits: number;
}): string | undefined {
  return managedCredits > 0
    ? t('Includes {credits} Activepieces credits', {
        credits: usageFormat.whole(managedCredits),
      })
    : undefined;
}

function elapsedDaysOf({
  ranges,
  history,
}: {
  ranges: AiUsageRanges;
  history: AiUsageHistory;
}): number {
  const spanMs =
    new Date(ranges.current.end).getTime() -
    new Date(ranges.current.start).getTime();
  const elapsedMs = spanMs * history.currentCoverage;
  return Math.max(elapsedMs / DAY_MS, MIN_ELAPSED_DAYS);
}

function paceOf({
  totals,
  ranges,
  history,
  period,
}: {
  totals: AiUsageTotals;
  ranges: AiUsageRanges;
  history: AiUsageHistory;
  period: AiUsagePeriod;
}): { avgPerDayUsd: number; forecastUsd?: number } {
  const avgPerDayUsd = totals.spendUsd / elapsedDaysOf({ ranges, history });
  if (period !== 'this-month') {
    return { avgPerDayUsd };
  }
  return {
    avgPerDayUsd,
    forecastUsd: avgPerDayUsd * daysInMonthOf({ iso: ranges.current.start }),
  };
}

function daysInMonthOf({ iso }: { iso: string }): number {
  const date = new Date(iso);
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate();
}

function monthEndDateLabel({ iso }: { iso: string }): string {
  const date = new Date(iso);
  const end = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  );
  return usageFormat.pointLabel({ label: end.toISOString().slice(0, 10) });
}

function legendRangeLabel({
  iso,
  period,
}: {
  iso: string;
  period: AiUsagePeriod;
}): string {
  return SUB_DAY_PERIODS.includes(period)
    ? usageFormat.pointLabel({ label: iso })
    : usageFormat.pointLabel({ label: iso.slice(0, 10) });
}

function legendRanges({
  ranges,
  period,
}: {
  ranges: AiUsageRanges;
  period: AiUsagePeriod;
}): { current: string; previous: string } {
  const inclusiveEnd = (iso: string): string =>
    SUB_DAY_PERIODS.includes(period)
      ? iso
      : new Date(new Date(iso).getTime() - DAY_MS).toISOString();
  return {
    current: `${legendRangeLabel({
      iso: ranges.current.start,
      period,
    })} – ${legendRangeLabel({
      iso: inclusiveEnd(ranges.current.end),
      period,
    })}`,
    previous: `${legendRangeLabel({
      iso: ranges.previous.start,
      period,
    })} – ${legendRangeLabel({
      iso: inclusiveEnd(ranges.previous.end),
      period,
    })}`,
  };
}

function providerDisplayName({
  provider,
}: {
  provider?: AIProviderName;
}): string {
  if (isNil(provider)) {
    return t('Unknown');
  }
  const info = SUPPORTED_AI_PROVIDERS.find(
    (candidate) => candidate.provider === provider,
  );
  return info?.name ?? provider;
}

function itemDisplayName({ item }: { item: AiUsageItem }): string {
  if (!isNil(item.name)) {
    return item.name;
  }
  if (item.dimension === 'project' && item.id === AI_USAGE_NO_PROJECT_ID) {
    return t('No project (platform chat)');
  }
  if (item.dimension === 'key' && item.id === AI_USAGE_CREDITS_KEY_ID) {
    return t('Activepieces credits');
  }
  if (
    item.dimension === 'key' &&
    item.id.startsWith(AI_USAGE_UNKNOWN_KEY_PREFIX)
  ) {
    return t('Unknown {provider} key', {
      provider: providerDisplayName({ provider: item.provider }),
    });
  }
  return t(DELETED_LABELS[item.dimension]);
}

function itemSubtitle({ item }: { item: AiUsageItem }): string {
  if (item.provider === AIProviderName.ACTIVEPIECES) {
    return t('Billed on your plan');
  }
  if (item.dimension === 'project') {
    return t(
      '{flows, plural, =1 {1 flow} other {# flows}} · {agents, plural, =1 {1 agent} other {# agents}}',
      { flows: item.flowCount ?? 0, agents: item.agentCount ?? 0 },
    );
  }
  if (item.dimension === 'key' || item.dimension === 'model') {
    return providerDisplayName({ provider: item.provider });
  }
  return item.parent ?? '';
}

function dashboardUrlOf({
  item,
  edition,
}: {
  item: AiUsageItem;
  edition: ApEdition | null;
}): string | undefined {
  if (item.dimension !== 'key') {
    return undefined;
  }
  if (item.id === AI_USAGE_CREDITS_KEY_ID) {
    return isNil(edition) || edition === ApEdition.COMMUNITY
      ? undefined
      : '/platform/billing';
  }
  const info = SUPPORTED_AI_PROVIDERS.find(
    (candidate) => candidate.provider === item.provider,
  );
  return info?.dashboardUrl;
}

function hasSharedSpend({ item }: { item: AiUsageItem }): boolean {
  return !isNil(item.sharedUsd) && item.sharedUsd > 0;
}

function sharedBadgeText({ item }: { item: AiUsageItem }): string {
  const other = item.dimension === 'flow' ? t('Agents') : t('Flows');
  return t(
    '{amount} of this comes from Run Agent steps, so it also counts under {other}.',
    { amount: usageFormat.usd(item.sharedUsd ?? 0), other },
  );
}

function isDetailEmpty({ item }: { item: AiUsageItem }): boolean {
  return item.calls === 0 && item.previousSpendUsd === 0;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_ELAPSED_DAYS = 1 / (24 * 60);
const SUB_DAY_PERIODS: AiUsagePeriod[] = ['1h', '6h', '12h', '24h'];

const DELETED_LABELS: Record<AiUsageDimension, string> = {
  project: 'Deleted project',
  flow: 'Deleted flow',
  agent: 'Deleted agent',
  user: 'Deleted user',
  key: 'Deleted key',
  model: 'Deleted model',
};

export const usageAdapters = {
  seriesToPoints,
  creditsNote,
  paceOf,
  monthEndDateLabel,
  legendRanges,
  providerDisplayName,
  itemDisplayName,
  itemSubtitle,
  dashboardUrlOf,
  hasSharedSpend,
  sharedBadgeText,
  isDetailEmpty,
};
