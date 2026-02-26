'use client';

import { t } from 'i18next';
import { Download } from 'lucide-react';
import { useRef } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

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

type AnalyticsAreaChartProps = {
  title: string;
  subtitle: string;
  tooltipLabel: string;
  dataKey: string;
  color: string;
  gradientId: string;
  chartData: Array<Record<string, string | number>>;
  isLoading: boolean;
  emptyIcon: React.ReactNode;
  emptyText: string;
  downloadFilename: string;
  yAxisFormatter?: (value: number) => string;
  tooltipFormatter?: (value: number) => string;
};

export function AnalyticsAreaChart({
  title,
  subtitle,
  tooltipLabel,
  dataKey,
  color,
  gradientId,
  chartData,
  isLoading,
  emptyIcon,
  emptyText,
  downloadFilename,
  yAxisFormatter,
  tooltipFormatter,
}: AnalyticsAreaChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const chartConfig = {
    [dataKey]: { label: tooltipLabel, color },
  } satisfies ChartConfig;

  return (
    <Card ref={chartRef}>
      <CardHeader className="space-y-0 pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 print:hidden"
                onClick={() => downloadChartAsPng(chartRef, downloadFilename)}
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('Download as PNG')}</TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : chartData.length === 0 ? (
          <div className="flex h-[300px] w-full flex-col items-center justify-center gap-2">
            {emptyIcon}
            <p className="text-sm text-muted-foreground">{emptyText}</p>
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[300px] w-full"
          >
            <AreaChart
              accessibilityLayer
              data={chartData}
              margin={{ left: 0, right: 12, top: 12, bottom: 0 }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.05} />
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
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                }
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                width={40}
                tickFormatter={yAxisFormatter}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[150px]"
                    nameKey={dataKey}
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    }
                    formatter={
                      tooltipFormatter
                        ? (value) => tooltipFormatter(value as number)
                        : undefined
                    }
                  />
                }
              />
              <Area
                dataKey={dataKey}
                type="monotone"
                stroke={color}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={{
                  r: 5,
                  fill: color,
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
