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
  edgeChartTicks,
  niceChartTicks,
} from '@/components/ui/chart';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { formatUtils } from '@/lib/format-utils';

const SERIES: Array<{ status: FlowRunStatus; label: string; color: string }> = [
  {
    status: FlowRunStatus.SUCCEEDED,
    label: 'Succeeded',
    color: 'var(--success-11)',
  },
  {
    status: FlowRunStatus.FAILED,
    label: 'Failed',
    color: 'var(--warning-11)',
  },
  {
    status: FlowRunStatus.INTERNAL_ERROR,
    label: 'Internal error',
    color: 'var(--danger-11)',
  },
  {
    status: FlowRunStatus.CANCELED,
    label: 'Cancelled',
    color: 'var(--gray-11)',
  },
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
  const yTicks = niceChartTicks(
    Math.max(
      0,
      ...chartData.flatMap((row) =>
        selectedSeries.map((item) => Number(row[item.status] ?? 0)),
      ),
    ),
  );
  const xTicks = edgeChartTicks(chartData.map((row) => String(row.date)));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('Jobs Per Month')}</CardTitle>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
          {SERIES.map((item) => (
            <label
              key={item.status}
              className="flex cursor-pointer items-center gap-2 text-sm select-none"
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
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : !hasSelection ? (
          <div className="flex h-[300px] w-full flex-col items-center justify-center gap-2">
            <LineChartIcon className="size-10 text-gray-11" />
            <p className="text-sm text-gray-11">
              {t('Select at least one status to display')}
            </p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-[300px] w-full flex-col items-center justify-center gap-2">
            <LineChartIcon className="size-10 text-gray-11" />
            <p className="text-sm text-gray-11">
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
                      stopOpacity={0.16}
                    />
                    <stop
                      offset="100%"
                      stopColor={item.color}
                      stopOpacity={0.01}
                    />
                  </linearGradient>
                ))}
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
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--panel)' }}
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
