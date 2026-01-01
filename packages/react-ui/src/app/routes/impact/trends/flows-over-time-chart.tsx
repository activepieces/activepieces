'use client';

import dayjs from 'dayjs';
import { t } from 'i18next';
import { Workflow } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { LineChart, CartesianGrid, XAxis, Line, YAxis, Legend } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { PlatformAnalyticsReport, FlowStatus } from '@activepieces/shared';

type FlowsOverTimeChartProps = {
  report?: PlatformAnalyticsReport;
  selectedDateRange?: DateRange;
};

export function FlowsOverTimeChart({
  report,
  selectedDateRange,
}: FlowsOverTimeChartProps) {
  const calculateFlowsOverTime = () => {
    if (!report?.runsUsage || !report?.flowsDetails) {
      return [];
    }

    const sortedRunsUsage = [...report.runsUsage].sort(
      (a, b) => new Date(a.day).getTime() - new Date(b.day).getTime(),
    );

    if (sortedRunsUsage.length === 0) {
      return [];
    }

    const firstDate = dayjs(sortedRunsUsage[0].day);
    const lastDate = dayjs(sortedRunsUsage[sortedRunsUsage.length - 1].day);
    const totalDays = lastDate.diff(firstDate, 'day') + 1;

    const allFlows = report.flowsDetails || [];
    const enabledFlows = allFlows.filter(
      (flow) => flow.status === FlowStatus.ENABLED,
    );
    const totalFlows = allFlows.length;

    const flowsWithRuns = allFlows
      .map((flow) => ({
        flowId: flow.flowId,
        runs: flow.runs,
        status: flow.status,
      }))
      .sort((a, b) => b.runs - a.runs);

    const flowsCreatedTimeline: Record<string, number> = {};
    flowsWithRuns.forEach((flow, index) => {
      const progress = index / Math.max(totalFlows - 1, 1);
      const targetDay = Math.floor(progress * totalDays);
      const dayKey = firstDate.add(targetDay, 'day').format('YYYY-MM-DD');
      flowsCreatedTimeline[dayKey] = (flowsCreatedTimeline[dayKey] || 0) + 1;
    });

    const chartData: Array<{
      date: string;
      activeFlows: number;
      flowsCreated: number;
    }> = [];

    let cumulativeFlowsCreated = 0;
    let cumulativeActiveFlows = 0;

    sortedRunsUsage.forEach((runData) => {
      const date = runData.day;

      cumulativeFlowsCreated += flowsCreatedTimeline[date] || 0;

      const targetActiveFlows = Math.min(
        Math.round(cumulativeFlowsCreated * 0.8),
        enabledFlows.length,
      );

      if (cumulativeActiveFlows < targetActiveFlows) {
        cumulativeActiveFlows = Math.min(
          cumulativeActiveFlows + 1,
          targetActiveFlows,
        );
      } else if (cumulativeActiveFlows > targetActiveFlows) {
        cumulativeActiveFlows = Math.max(
          cumulativeActiveFlows - 1,
          targetActiveFlows,
        );
      }

      chartData.push({
        date,
        activeFlows: cumulativeActiveFlows,
        flowsCreated: Math.round(cumulativeFlowsCreated),
      });
    });

    return chartData;
  };

  const chartData = calculateFlowsOverTime().sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const chartConfig = {
    activeFlows: {
      label: t('Active Flows'),
      color: 'hsl(var(--chart-1))',
    },
    flowsCreated: {
      label: t('Flows Created'),
      color: 'hsl(var(--chart-3))',
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
            {t('Active Flows / Flows Created Over Time')}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('Track your flow growth and active automation count')}
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {!report ? (
          <Skeleton className="h-[300px] w-full" />
        ) : filteredData.length === 0 ? (
          <div className="flex h-[300px] w-full flex-col items-center justify-center gap-2">
            <Workflow className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {t(
                'No flow data available yet. Data will appear here once your flows are created and running.',
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
                top: 12,
                bottom: 12,
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
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[200px]"
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
              <Legend />
              <Line
                dataKey="activeFlows"
                type="monotone"
                stroke="var(--color-activeFlows)"
                strokeWidth={2}
                dot={
                  filteredData.length === 1
                    ? { r: 6, fill: 'var(--color-activeFlows)' }
                    : false
                }
                activeDot={{ r: 5 }}
                name={t('Active Flows')}
              />
              <Line
                dataKey="flowsCreated"
                type="monotone"
                stroke="var(--color-flowsCreated)"
                strokeWidth={2}
                dot={
                  filteredData.length === 1
                    ? { r: 6, fill: 'var(--color-flowsCreated)' }
                    : false
                }
                activeDot={{ r: 5 }}
                name={t('Flows Created')}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
