import { PlatformAnalyticsReport } from '@activepieces/shared';
import { Clock01Icon } from '@hugeicons/core-free-icons';
import { t } from 'i18next';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { formatUtils } from '@/lib/format-utils';

import { AnalyticsAreaChart } from './analytics-area-chart';

type TimeSavedChartProps = {
  report?: PlatformAnalyticsReport;
};

export function TimeSavedChart({ report }: TimeSavedChartProps) {
  const chartData =
    report?.runs
      .map((data) => ({
        date: data.day,
        minutesSaved:
          (report?.flows.find((flow) => flow.flowId === data.flowId)
            ?.timeSavedPerRun ?? 0) * data.runs,
      }))
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ) ?? [];

  return (
    <AnalyticsAreaChart
      title={t('Time Saved Over Time')}
      subtitle={t('Track how much time your automations are saving')}
      tooltipLabel={t('Time Saved')}
      dataKey="minutesSaved"
      color="var(--swatch-8-mark)"
      gradientId="fillTimeSaved"
      chartData={chartData}
      isLoading={!report}
      emptyIcon={
        <HugeiconsIcon icon={Clock01Icon} className="h-10 w-10 text-gray-9" />
      }
      emptyText={t(
        'No time saved yet. Data will appear here once your flows start running.',
      )}
      downloadFilename="time-saved"
      yAxisFormatter={(v) => formatUtils.formatToHoursAndMinutes(v)}
      tooltipFormatter={(v) => formatUtils.formatToHoursAndMinutes(v)}
    />
  );
}
