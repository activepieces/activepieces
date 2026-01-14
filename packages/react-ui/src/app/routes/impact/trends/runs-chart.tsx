'use client';

import { t } from 'i18next';
import { TrendingUp } from 'lucide-react';
import { LineChart, CartesianGrid, XAxis, Line } from 'recharts';

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
};

export function RunsChart({ report }: RunsChartProps) {
  const chartData =
    report?.runs
      .map((data) => ({
        date: data.day,
        runs: data.runs,
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
        ) : chartData.length === 0 ? (
          <div className="flex h-[300px] w-full flex-col items-center justify-center gap-2">
            <TrendingUp className="h-10 w-10 text-muted-foreground/50" />
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
            <LineChart
              accessibilityLayer
              data={chartData}
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
              <Line
                dataKey="runs"
                type="monotone"
                stroke="var(--color-runs)"
                strokeWidth={2}
                dot={
                  chartData.length === 1
                    ? { r: 6, fill: 'var(--color-runs)' }
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
