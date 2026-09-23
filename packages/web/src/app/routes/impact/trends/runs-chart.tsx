import { PlatformAnalyticsReport } from '@activepieces/shared';
import { t } from 'i18next';
import { TrendingUp } from 'lucide-react';

import { AnalyticsAreaChart } from './analytics-area-chart';

type RunsChartProps = {
  report?: PlatformAnalyticsReport;
};

export function RunsChart({ report }: RunsChartProps) {
  const chartData =
    report?.runs
      .map((data) => ({ date: data.day, runs: data.runs }))
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ) ?? [];

  return (
    <AnalyticsAreaChart
      title={t('Flow Runs Over Time')}
      subtitle={t('Track your automation execution trends')}
      tooltipLabel={t('Runs')}
      dataKey="runs"
      color="var(--chart-1)"
      gradientId="fillRuns"
      chartData={chartData}
      isLoading={!report}
      emptyIcon={<TrendingUp className="h-10 w-10 text-ink-subtle" />}
      emptyText={t(
        'No runs recorded yet. Data will appear here once your flows start running.',
      )}
      downloadFilename="flow-runs"
    />
  );
}
