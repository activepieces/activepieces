import { t } from 'i18next';

import {
  UsageDimension,
  UsageMetric,
  UsagePeriod,
  UsageScope,
  UsageSource,
} from './usage-dummy-data';

function usd(value: number): string {
  if (value > 0 && value < 0.01) {
    return '<$0.01';
  }
  return USD.format(value);
}

function compact(value: number): string {
  return COMPACT.format(value);
}

function whole(value: number): string {
  return WHOLE.format(Math.round(value));
}

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function change({
  current,
  previous,
}: {
  current: number;
  previous: number;
}): number {
  return previous === 0 ? 0 : (current - previous) / previous;
}

function signedPercent(value: number): string {
  const rounded = Math.round(value * 100);
  return rounded > 0 ? `+${rounded}%` : `${rounded}%`;
}

function metricValue({
  metric,
  value,
}: {
  metric: UsageMetric;
  value: number;
}): string {
  return metric === 'spend' ? usd(value) : compact(value);
}

function pointLabel({ label }: { label: string }): string {
  if (!label.includes('T')) {
    return new Date(`${label}T00:00:00Z`).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
  }
  return new Date(label).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  });
}

function periodLabel({ period }: { period: UsagePeriod }): string {
  switch (period) {
    case '1h':
      return t('Last hour');
    case '6h':
      return t('Last 6 hours');
    case '12h':
      return t('Last 12 hours');
    case '24h':
      return t('Last 24 hours');
    case '7d':
      return t('Last 7 days');
    case '30d':
      return t('Last 30 days');
    case '90d':
      return t('Last 90 days');
    case 'this-month':
      return t('This month');
    case 'last-month':
      return t('Last month');
  }
}

function previousLabel({ period }: { period: UsagePeriod }): string {
  switch (period) {
    case '1h':
      return t('vs previous hour');
    case '6h':
      return t('vs previous 6 hours');
    case '12h':
      return t('vs previous 12 hours');
    case '24h':
      return t('vs previous 24 hours');
    case '7d':
      return t('vs previous 7 days');
    case '30d':
      return t('vs previous 30 days');
    case '90d':
      return t('vs previous 90 days');
    case 'this-month':
      return t('vs same days last month');
    case 'last-month':
      return t('vs the month before');
  }
}

function dimensionLabel({ dimension }: { dimension: UsageDimension }): string {
  switch (dimension) {
    case 'project':
      return t('Projects');
    case 'flow':
      return t('Flows');
    case 'agent':
      return t('Agents');
    case 'user':
      return t('Users');
    case 'key':
      return t('Providers & keys');
    case 'model':
      return t('Models');
  }
}

function dimensionBadge({ dimension }: { dimension: UsageDimension }): string {
  switch (dimension) {
    case 'project':
      return t('Project');
    case 'flow':
      return t('Flow');
    case 'agent':
      return t('Agent');
    case 'user':
      return t('User');
    case 'key':
      return t('Key');
    case 'model':
      return t('Model');
  }
}

function sourceLabel({ source }: { source: UsageSource }): string {
  switch (source) {
    case 'flow-steps':
      return t('Flow AI steps');
    case 'agent-steps':
      return t('Run Agent steps');
    case 'agents':
      return t('Agents');
    case 'chat':
      return t('Chat');
    case 'knowledge-base':
      return t('Knowledge base');
  }
}

function metricLabel({ metric }: { metric: UsageMetric }): string {
  switch (metric) {
    case 'spend':
      return t('Spend');
    case 'calls':
      return t('Calls');
    case 'tokens':
      return t('Tokens');
  }
}

function scopeLabel({ scope }: { scope: UsageScope }): string {
  switch (scope) {
    case 'production':
      return t('Production');
    case 'all':
      return t('All');
  }
}

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const COMPACT = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});
const WHOLE = new Intl.NumberFormat('en-US');

export const usageFormat = {
  usd,
  compact,
  whole,
  percent,
  change,
  signedPercent,
  metricValue,
  pointLabel,
  periodLabel,
  previousLabel,
  dimensionLabel,
  dimensionBadge,
  sourceLabel,
  metricLabel,
  scopeLabel,
};
