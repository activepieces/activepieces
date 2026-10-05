import { t } from 'i18next';
import { Download } from 'lucide-react';
import { useRef } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  edgeChartTicks,
  niceChartTicks,
} from '@/components/ui/chart';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatUtils } from '@/lib/format-utils';

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

  const yTicks = niceChartTicks(
    Math.max(0, ...chartData.map((row) => Number(row[dataKey] ?? 0))),
  );
  const xTicks = edgeChartTicks(chartData.map((row) => String(row.date)));

  const chartConfig = {
    [dataKey]: { label: tooltipLabel, color },
  } satisfies ChartConfig;

  return (
    <Card ref={chartRef}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
        <CardAction>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                className="print:hidden"
                onClick={() => downloadChartAsPng(chartRef, downloadFilename)}
              >
                <Download />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('Download as PNG')}</TooltipContent>
          </Tooltip>
        </CardAction>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-72 w-full" />
        ) : chartData.length === 0 ? (
          <Empty className="h-72">
            <EmptyHeader>
              <EmptyMedia variant="icon">{emptyIcon}</EmptyMedia>
              <EmptyDescription>{emptyText}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-72 w-full"
          >
            <AreaChart
              accessibilityLayer
              data={chartData}
              margin={{ left: 0, right: 12, top: 12, bottom: 0 }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.16} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                ticks={xTicks}
                interval={0}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fill: 'var(--gray-11)', fontSize: 12 }}
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                }
              />
              <YAxis
                ticks={yTicks}
                domain={[0, yTicks[yTicks.length - 1]]}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fill: 'var(--gray-11)', fontSize: 12 }}
                width={48}
                tickFormatter={
                  yAxisFormatter ??
                  ((value: number) => formatUtils.formatNumberCompact(value))
                }
              />
              <ChartTooltip
                cursor={{ stroke: 'var(--gray-8)' }}
                content={
                  <ChartTooltipContent
                    className="min-w-40"
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
                strokeLinecap="round"
                strokeLinejoin="round"
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: color,
                  strokeWidth: 2,
                  stroke: 'var(--panel)',
                }}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
