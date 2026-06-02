import {
  FlowRunStatus,
  PlatformMetricsStatusPoint,
} from '@activepieces/shared';
import { t } from 'i18next';
import { LineChart as LineChartIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatUtils } from '@/lib/format-utils';

const SERIES: Array<{ status: FlowRunStatus; label: string; color: string }> = [
  { status: FlowRunStatus.SUCCEEDED, label: 'Succeeded', color: '#22c55e' },
  { status: FlowRunStatus.FAILED, label: 'Failed', color: '#f59e0b' },
  {
    status: FlowRunStatus.INTERNAL_ERROR,
    label: 'Internal error',
    color: '#ef4444',
  },
  { status: FlowRunStatus.CANCELED, label: 'Cancelled', color: '#9ca3af' },
];

type StatusLineChartProps = {
  data: PlatformMetricsStatusPoint[] | undefined;
  isLoading: boolean;
};

export function StatusLineChart({ data, isLoading }: StatusLineChartProps) {
  const [selectedStatus, setSelectedStatus] = useState<FlowRunStatus>(
    FlowRunStatus.SUCCEEDED,
  );

  const series =
    SERIES.find((item) => item.status === selectedStatus) ?? SERIES[0];

  const chartData = useMemo(() => {
    const byDay = new Map<string, Record<string, string | number>>();
    for (const point of data ?? []) {
      const existing = byDay.get(point.day) ?? createEmptyDay(point.day);
      existing[point.status] = point.count;
      byDay.set(point.day, existing);
    }
    return Array.from(byDay.values()).sort((a, b) =>
      String(a.date).localeCompare(String(b.date)),
    );
  }, [data]);

  const chartConfig = {
    [series.status]: { label: t(series.label), color: series.color },
  } satisfies ChartConfig;

  const gradientId = `status-gradient-${series.status}`;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-medium">
            {t('{status} Jobs Per Month', { status: t(series.label) })}
          </CardTitle>
          <Select
            value={selectedStatus}
            onValueChange={(value) => setSelectedStatus(value as FlowRunStatus)}
          >
            <SelectTrigger className="w-auto gap-2 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="bottom" align="end">
              {SERIES.map((item) => (
                <SelectItem key={item.status} value={item.status}>
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    {t(item.label)}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : chartData.length === 0 ? (
          <div className="flex h-[300px] w-full flex-col items-center justify-center gap-2">
            <LineChartIcon className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t('No runs in this period')}
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
              margin={{ left: 0, right: 12, top: 12, bottom: 0 }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={series.color}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor={series.color}
                    stopOpacity={0.05}
                  />
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
                tickFormatter={(value) =>
                  formatUtils.formatNumberCompact(value as number)
                }
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    }
                  />
                }
              />
              <Area
                dataKey={series.status}
                type="monotone"
                stroke={series.color}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={{
                  r: 5,
                  fill: series.color,
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

function createEmptyDay(day: string): Record<string, string | number> {
  const row: Record<string, string | number> = { date: day };
  for (const series of SERIES) {
    row[series.status] = 0;
  }
  return row;
}
