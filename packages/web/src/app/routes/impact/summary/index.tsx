import {
  FlowStatus,
  PlatformAnalyticsReport,
  UserStatus,
} from '@activepieces/shared';
import { t } from 'i18next';

import { StatRow, StatValue } from '@/components/custom/stats';
import { formatUtils } from '@/lib/format-utils';

import { impactRunsUtils } from '../lib/impact-runs-utils';

export function Summary({ report }: SummaryProps) {
  return (
    <StatRow
      size="lead"
      divided
      loading={!report}
      stats={report ? buildStats(report) : placeholderStats()}
    />
  );
}

function buildStats(report: PlatformAnalyticsReport): StatValue[] {
  const runsByFlow = impactRunsUtils.sumRunsByFlow(report.runs);
  const flowsWithTimeSaved = report.flows.filter(
    (flow) => (flow.timeSavedPerRun ?? 0) !== 0,
  );
  const totalSecondsSaved = flowsWithTimeSaved.reduce(
    (acc, flow) =>
      acc + (flow.timeSavedPerRun ?? 0) * (runsByFlow.get(flow.flowId) ?? 0),
    0,
  );
  const hasTimeSaved = flowsWithTimeSaved.length > 0;
  const workdays = Math.round(totalSecondsSaved / 3600 / 8);

  const activeFlows = report.flows.filter(
    (flow) => flow.status === FlowStatus.ENABLED,
  ).length;
  const activeUsers = report.users.filter(
    (user) => user.status === UserStatus.ACTIVE,
  ).length;
  const totalUsers = report.users.length;
  const adoptionRate =
    totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
  const totalRuns = report.flows.reduce(
    (acc, flow) => acc + (runsByFlow.get(flow.flowId) ?? 0),
    0,
  );

  return [
    {
      key: 'time-saved',
      label: t('Time saved'),
      hint: t('Total time saved by automation'),
      value: hasTimeSaved
        ? formatUtils.formatToHoursAndMinutes(totalSecondsSaved)
        : '—',
      caption:
        hasTimeSaved && workdays > 0
          ? t('{days} workdays saved', { days: workdays.toLocaleString() })
          : undefined,
    },
    {
      key: 'active-flows',
      label: t('Active flows'),
      hint: t('Number of currently active flows'),
      value: formatUtils.formatNumber(activeFlows),
      caption: t('{total} total flows created', {
        total: report.flows.length.toLocaleString(),
      }),
    },
    {
      key: 'active-users',
      label: t('Active users'),
      hint: t('Users actively using the platform'),
      value: formatUtils.formatNumber(activeUsers),
      caption: t('{rate}% adoption rate ({total} total users)', {
        rate: adoptionRate,
        total: totalUsers.toLocaleString(),
      }),
    },
    {
      key: 'runs',
      label: t('Flow runs'),
      hint: t('Every flow run in the period'),
      value: formatUtils.formatNumber(totalRuns),
    },
  ];
}

function placeholderStats(): StatValue[] {
  return [
    { key: 'time-saved', label: t('Time saved'), value: null },
    { key: 'active-flows', label: t('Active flows'), value: null },
    { key: 'active-users', label: t('Active users'), value: null },
    { key: 'runs', label: t('Flow runs'), value: null },
  ];
}

type SummaryProps = {
  report?: PlatformAnalyticsReport;
};
