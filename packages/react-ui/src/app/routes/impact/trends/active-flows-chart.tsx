'use client';

import { t } from 'i18next';
import { Activity } from 'lucide-react';
import { LineChart, CartesianGrid, XAxis, Line } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { AnalyticsActiveFlowsItem } from '@activepieces/shared';

type ActiveFlowsChartProps = {
  activeFlowsOverTime?: AnalyticsActiveFlowsItem[];
  isLoading: boolean;
};

export function ActiveFlowsChart({
  activeFlowsOverTime,
  isLoading,
}: ActiveFlowsChartProps) {
  const chartData =
    activeFlowsOverTime
      ?.map((data) => ({
        date: data.day,
        activeFlows: data.activeFlows,
      }))
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ) || [];

  const chartConfig = {
    activeFlows: {
      label: t('Active Flows'),
      color: 'hsl(var(--chart-4))',
    },
  } satisfies ChartConfig;

  return (
    <Card className="col-span-full">
      <CardHeader className="space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base">
            {t('Active Flows Over Time')}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('Track how many automations are enabled')}
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : chartData.length === 0 ? (
          <div className="flex h-[300px] w-full flex-col items-center justify-center gap-2">
            <Activity className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {t('No active flows yet. Data will appear here once flows are enabled.')}
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
                    nameKey="activeFlows"
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
                dataKey="activeFlows"
                type="monotone"
                stroke="var(--color-activeFlows)"
                strokeWidth={2}
                dot={
                  chartData.length === 1
                    ? { r: 6, fill: 'var(--color-activeFlows)' }
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

