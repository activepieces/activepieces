'use client';

import { t } from 'i18next';
import { FilePlus } from 'lucide-react';
import { LineChart, CartesianGrid, XAxis, Line } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { AnalyticsFlowsCreatedItem } from '@activepieces/shared';

type FlowsCreatedChartProps = {
  flowsCreated?: AnalyticsFlowsCreatedItem[];
  isLoading: boolean;
};

export function FlowsCreatedChart({
  flowsCreated,
  isLoading,
}: FlowsCreatedChartProps) {
  const chartData =
    flowsCreated
      ?.map((data) => ({
        date: data.day,
        flowsCreated: data.flowsCreated,
      }))
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ) || [];

  const chartConfig = {
    flowsCreated: {
      label: t('Flows Created'),
      color: 'hsl(var(--chart-3))',
    },
  } satisfies ChartConfig;

  return (
    <Card className="col-span-full">
      <CardHeader className="space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base">
            {t('Flows Created Over Time')}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('Track when new automations are being created')}
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : chartData.length === 0 ? (
          <div className="flex h-[300px] w-full flex-col items-center justify-center gap-2">
            <FilePlus className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {t('No flows created yet. Data will appear here once flows are created.')}
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
                    nameKey="flowsCreated"
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
                dataKey="flowsCreated"
                type="monotone"
                stroke="var(--color-flowsCreated)"
                strokeWidth={2}
                dot={
                  chartData.length === 1
                    ? { r: 6, fill: 'var(--color-flowsCreated)' }
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

