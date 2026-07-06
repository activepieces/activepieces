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
import { Checkbox } from '@/components/ui/checkbox';
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
  const [selectedStatuses, setSelectedStatuses] = useState<FlowRunStatus[]>(
    SERIES.map((item) => item.status),
  );

  const selectedSeries = SERIES.filter((item) =>
    selectedStatuses.includes(item.status),
  );

  const toggleStatus = (status: FlowRunStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((item) => item !== status)
        : [...prev, status],
    );
  };

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

  const chartConfig = selectedSeries.reduce((config, item) => {
    config[item.status] = { label: t(item.label), color: item.color };
    return config;
  }, {} as ChartConfig) satisfies ChartConfig;

  const hasSelection = selectedSeries.length > 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">
          {t('Jobs Per Month')}
        </CardTitle>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
          {SERIES.map((item) => (
            <label
              key={item.status}
              className="flex items-center gap-1.5 text-sm cursor-pointer select-none"
            >
              <Checkbox
                checked={selectedStatuses.includes(item.status)}
                onCheckedChange={() => toggleStatus(item.status)}
              />
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {t(item.label)}
            </label>
          ))}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : !hasSelection ? (
          <div className="flex h-[300px] w-full flex-col items-center justify-center gap-2">
            <LineChartIcon className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t('Select at least one status to display')}
            </p>
          </div>
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
                {selectedSeries.map((item) => (
                  <linearGradient
                    key={item.status}
                    id={`status-gradient-${item.status}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={item.color}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="100%"
                      stopColor={item.color}
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                ))}
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
              {selectedSeries.map((item) => (
                <Area
                  key={item.status}
                  dataKey={item.status}
                  type="monotone"
                  stroke={item.color}
                  strokeWidth={2}
                  fill={`url(#status-gradient-${item.status})`}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
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
