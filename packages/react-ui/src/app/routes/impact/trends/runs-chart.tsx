'use client';

import { t } from 'i18next';
import { BarChart3 } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { BarChart, CartesianGrid, XAxis, Bar } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { PlatformAnalyticsReport } from '@activepieces/shared';

type RunsChartProps = {
  report?: PlatformAnalyticsReport;
  selectedDateRange?: DateRange;
};

export function RunsChart({ report, selectedDateRange }: RunsChartProps) {
  const chartData =
    report?.runsUsage
      .map((data) => ({
        date: data.day,
        runs: data.totalRuns,
      }))
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ) || [];

  const chartConfig = {
    runs: {
      label: t('Runs'),
      color: 'hsl(var(--chart-1))',
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
            {t('Flow Runs Over Time')}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('Track your automation execution trends')}
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {!report ? (
          <Skeleton className="h-[300px] w-full" />
        ) : filteredData.length === 0 ? (
          <div className="flex h-[300px] w-full flex-col items-center justify-center gap-2">
            <BarChart3 className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {t(
                'No runs recorded yet. Data will appear here once your flows start running.',
              )}
            </p>
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[300px] w-full"
          >
            <BarChart
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
                    nameKey="runs"
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      });
                    }}
                  />
                }
              />
              <Bar dataKey="runs" fill="var(--color-runs)" radius={4} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
