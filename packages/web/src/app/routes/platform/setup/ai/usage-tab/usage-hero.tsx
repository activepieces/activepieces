import { t } from 'i18next';
import { ReactNode, useId, useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from 'recharts';

import { adminSurface } from '@/app/components/admin';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

import { DeltaChip } from './usage-bits';
import {
  USAGE_METRICS,
  UsageMetric,
  UsagePeriod,
  UsagePoint,
} from './usage-dummy-data';
import { usageFormat } from './usage-format';

export function UsageHero({
  series,
  period,
  note,
  height = 280,
}: UsageHeroProps) {
  const [metric, setMetric] = useState<UsageMetric>('spend');
  const points = series[metric];
  const current = points.reduce((sum, point) => sum + point.current, 0);
  const previous = points.reduce((sum, point) => sum + point.previous, 0);

  return (
    <section className={cn(adminSurface.card, 'flex flex-col gap-5 p-5')}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-gray-11">
            {usageFormat.metricLabel({ metric })}
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-4xl font-semibold tracking-tight tabular-nums text-gray-12">
              {usageFormat.metricValue({ metric, value: current })}
            </span>
            <DeltaChip value={usageFormat.change({ current, previous })} />
            <span className="text-sm text-gray-11">
              {usageFormat.previousLabel({ period })}
            </span>
          </div>
          {metric === 'spend' && note && (
            <span className="text-xs text-gray-11">{note}</span>
          )}
        </div>
        <Tabs
          value={metric}
          onValueChange={(value) =>
            setMetric(USAGE_METRICS.find((item) => item === value) ?? 'spend')
          }
        >
          <TabsList size="sm">
            {USAGE_METRICS.map((item) => (
              <TabsTrigger key={item} value={item} size="sm">
                {usageFormat.metricLabel({ metric: item })}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      <UsageLineChart points={points} metric={metric} height={height} />
    </section>
  );
}

export function UsageLineChart({
  points,
  metric,
  height,
  compact = false,
}: UsageLineChartProps) {
  const gradientId = useId().replaceAll(':', '');
  const config = {
    current: { label: t('This period'), color: 'var(--accent-9)' },
    previous: { label: t('Previous period'), color: 'var(--gray-8)' },
  } satisfies ChartConfig;

  return (
    <ChartContainer
      config={config}
      className="aspect-auto w-full"
      style={{ height }}
    >
      <ComposedChart
        data={points}
        margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor={config.current.color}
              stopOpacity={0.22}
            />
            <stop
              offset="100%"
              stopColor={config.current.color}
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        {!compact && (
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            stroke="var(--gray-5)"
          />
        )}
        <XAxis
          dataKey="label"
          hide={compact}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={28}
          tick={{ fill: 'var(--gray-11)', fontSize: 12 }}
          tickFormatter={(label: string) => usageFormat.pointLabel({ label })}
        />
        <YAxis
          hide={compact}
          tickLine={false}
          axisLine={false}
          width={56}
          tick={{ fill: 'var(--gray-11)', fontSize: 12 }}
          tickFormatter={(value: number) =>
            usageFormat.metricValue({ metric, value })
          }
        />
        <ChartTooltip
          cursor={{ stroke: 'var(--gray-8)', strokeWidth: 1 }}
          content={
            <ChartTooltipContent
              indicator="line"
              labelFormatter={(label) =>
                usageFormat.pointLabel({ label: String(label) })
              }
              formatter={(value, name) => (
                <TooltipRow
                  label={
                    String(name) === 'previous'
                      ? config.previous.label
                      : config.current.label
                  }
                  value={usageFormat.metricValue({
                    metric,
                    value: Number(value),
                  })}
                />
              )}
            />
          }
        />
        <Line
          dataKey="previous"
          type="monotone"
          stroke={config.previous.color}
          strokeWidth={1.5}
          strokeDasharray="4 4"
          dot={false}
          activeDot={false}
        />
        <Area
          dataKey="current"
          type="monotone"
          stroke={config.current.color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0, fill: config.current.color }}
        />
      </ComposedChart>
    </ChartContainer>
  );
}

function TooltipRow({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex w-full justify-between gap-4">
      <span className="text-gray-11">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </span>
  );
}

type UsageHeroProps = {
  series: Record<UsageMetric, UsagePoint[]>;
  period: UsagePeriod;
  note?: ReactNode;
  height?: number;
};

type UsageLineChartProps = {
  points: UsagePoint[];
  metric: UsageMetric;
  height: number;
  compact?: boolean;
};
