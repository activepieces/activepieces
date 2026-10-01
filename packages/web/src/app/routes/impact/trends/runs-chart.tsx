import { PlatformAnalyticsReport } from '@activepieces/shared';
import { t } from 'i18next';
import { TrendingUp } from 'lucide-react';

import { impactRunsUtils } from '../lib/impact-runs-utils';

import { AnalyticsAreaChart } from './analytics-area-chart';

type RunsChartProps = {
  report?: PlatformAnalyticsReport;
};

export function RunsChart({ report }: RunsChartProps) {
  const chartData = report
    ? impactRunsUtils
        .runsByDay(report)
        .map(({ date, value }) => ({ date, runs: value }))
    : [];

  return (
    <AnalyticsAreaChart
      title={t('Runs per day')}
      subtitle={t('Every flow run in the period, day by day.')}
      tooltipLabel={t('Runs')}
      dataKey="runs"
      color="var(--chart-1)"
      gradientId="fillRuns"
      chartData={chartData}
      isLoading={!report}
      emptyIcon={<TrendingUp />}
      emptyText={t(
        'No runs recorded yet. Data will appear here once your flows start running.',
      )}
      downloadFilename="flow-runs"
    />
  );
}
