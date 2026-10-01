import { PlatformAnalyticsReport } from '@activepieces/shared';
import { t } from 'i18next';
import { Clock } from 'lucide-react';

import { HorizontalBarChart } from '@/components/custom/horizontal-bar-chart';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { formatUtils } from '@/lib/format-utils';

import { impactRunsUtils } from '../lib/impact-runs-utils';

const MAX_BARS = 8;

export function TimeSavedBreakdownChart({
  report,
}: TimeSavedBreakdownChartProps) {
  const projectCount = new Set(report?.flows.map((flow) => flow.projectId))
    .size;
  const groupBy = projectCount > 1 ? 'project' : 'flow';
  const data = report
    ? impactRunsUtils.secondsSavedBy({ report, groupBy })
    : [];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>
          {groupBy === 'project'
            ? t('Time saved by project')
            : t('Time saved by flow')}
        </CardTitle>
        <CardDescription>
          {groupBy === 'project'
            ? t('Where the time came back.')
            : t('The flows that saved the most time.')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!report ? (
          <Skeleton className="h-72 w-full" />
        ) : data.length === 0 ? (
          <Empty className="h-72">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Clock />
              </EmptyMedia>
              <EmptyDescription>
                {t(
                  'No time saved yet. Data will appear here once your flows start running.',
                )}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <HorizontalBarChart
            data={data}
            limit={MAX_BARS}
            formatValue={(seconds) =>
              seconds >= 3600
                ? `${formatUtils.formatNumber(Math.round(seconds / 3600))}h`
                : formatUtils.formatToHoursAndMinutes(seconds)
            }
            formatTooltipValue={(seconds) =>
              formatUtils.formatToHoursAndMinutes(seconds)
            }
          />
        )}
      </CardContent>
    </Card>
  );
}

type TimeSavedBreakdownChartProps = {
  report?: PlatformAnalyticsReport;
};
