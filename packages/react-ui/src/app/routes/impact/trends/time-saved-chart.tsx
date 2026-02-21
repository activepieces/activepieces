'use client';

import { t } from 'i18next';
import { Clock, Download } from 'lucide-react';
import { useRef } from 'react';
import { AreaChart, CartesianGrid, XAxis, YAxis, Area } from 'recharts';

import { Button } from '@/components/ui/button';
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

import { downloadChartAsPng } from '../lib/impact-utils';

type TimeSavedChartProps = {
  report?: PlatformAnalyticsReport;
};

export function TimeSavedChart({ report }: TimeSavedChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

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
      ) || [];

  const chartConfig = {
    minutesSaved: {
      label: t('Time Saved'),
      color: '#10b981',
    },
  } satisfies ChartConfig;

  return (
    <Card ref={chartRef}>
      <CardHeader className="space-y-0 pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">
              {t('Time Saved Over Time')}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('Track how much time your automations are saving')}
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 print:hidden"
            onClick={() => downloadChartAsPng(chartRef, 'time-saved')}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {!report ? (
          <Skeleton className="h-[300px] w-full" />
        ) : chartData.length === 0 ? (
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
            <AreaChart
              accessibilityLayer
              data={chartData}
              margin={{
                left: 0,
                right: 12,
                top: 12,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient id="fillTimeSaved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  });
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                width={40}
                tickFormatter={(value) =>
                  formatUtils.formatToHoursAndMinutes(value as number)
                }
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
              <Area
                dataKey="minutesSaved"
                type="monotone"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#fillTimeSaved)"
                dot={false}
                activeDot={{
                  r: 5,
                  fill: '#10b981',
                  strokeWidth: 2,
                  stroke: '#fff',
                }}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
