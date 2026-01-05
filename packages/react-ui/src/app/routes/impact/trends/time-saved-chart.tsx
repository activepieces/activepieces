'use client';

import { t } from 'i18next';
import { Clock } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { LineChart, CartesianGrid, XAxis, Line } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { formatUtils } from '@/lib/utils';
import { PlatformAnalyticsReport } from '@activepieces/shared';

type TimeSavedChartProps = {
  report?: PlatformAnalyticsReport;
  selectedDateRange?: DateRange;
};

export function TimeSavedChart({
  report,
  selectedDateRange,
}: TimeSavedChartProps) {
  const chartData =
    report?.runsUsage
      .map((data) => ({
        date: data.day,
        minutesSaved: data.minutesSaved,
      }))
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ) || [];

  const chartConfig = {
    minutesSaved: {
      label: t('Time Saved'),
      color: 'hsl(var(--chart-2))',
    },
  } satisfies ChartConfig;

  const filteredData = chartData.filter((data) => {
    if (!selectedDateRange?.from || !selectedDateRange?.to) {
      return true;
    }
    const date = new Date(data.date);
    return date >= selectedDateRange.from && date <= selectedDateRange.to;
  });

  return (
    <Card className="col-span-full">
      <CardHeader className="space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base">
            {t('Time Saved Over Time')}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('Track how much time your automations are saving')}
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {!report ? (
          <Skeleton className="h-[300px] w-full" />
        ) : filteredData.length === 0 ? (
          <div className="flex h-[300px] w-full flex-col items-center justify-center gap-2">
            <Clock className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {t(
                'No time saved yet. Data will appear here once your flows start running.',
              )}
            </p>
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[300px] w-full"
          >
            <LineChart
              accessibilityLayer
              data={filteredData}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  });
                }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[150px]"
                    nameKey="minutesSaved"
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      });
                    }}
                    formatter={(value) =>
                      formatUtils.formatToHoursAndMinutes(value as number)
                    }
                  />
                }
              />
              <Line
                dataKey="minutesSaved"
                type="monotone"
                stroke="var(--color-minutesSaved)"
                strokeWidth={2}
                dot={
                  filteredData.length === 1
                    ? { r: 6, fill: 'var(--color-minutesSaved)' }
                    : false
                }
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
