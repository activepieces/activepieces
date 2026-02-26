import { PlatformAnalyticsReport } from '@activepieces/shared';
import { t } from 'i18next';
import { Download, TrendingUp } from 'lucide-react';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { downloadChartAsPng } from '../lib/impact-utils';

type RunsChartProps = {
  report?: PlatformAnalyticsReport;
};

export function RunsChart({ report }: RunsChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

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
      color: '#8b5cf6',
    },
  } satisfies ChartConfig;

  return (
    <Card ref={chartRef}>
      <CardHeader className="space-y-0 pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">
              {t('Flow Runs Over Time')}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('Track your automation execution trends')}
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 print:hidden"
                onClick={() => downloadChartAsPng(chartRef, 'flow-runs')}
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('Download as PNG')}</TooltipContent>
          </Tooltip>
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
                <linearGradient id="fillRuns" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} />
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
              <Area
                dataKey="runs"
                type="monotone"
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="url(#fillRuns)"
                dot={false}
                activeDot={{
                  r: 5,
                  fill: '#8b5cf6',
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
