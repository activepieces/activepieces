import { t } from 'i18next';

import { UsageGroupBy, UsagePeriod } from './usage-dummy-data';

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

function groupLabel({ groupBy }: { groupBy: UsageGroupBy }): string {
  switch (groupBy) {
    case 'project':
      return t('Projects');
    case 'flow':
      return t('Flows');
    case 'agent':
      return t('Agents');
    case 'user':
      return t('Users');
    case 'key':
      return t('Keys');
    case 'model':
      return t('Models');
    case 'origin':
      return t('Sources');
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
  pointLabel,
  periodLabel,
  groupLabel,
};
