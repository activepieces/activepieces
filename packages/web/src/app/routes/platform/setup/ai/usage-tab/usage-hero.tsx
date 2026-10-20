import { isNil } from '@activepieces/core-utils';
import { t } from 'i18next';
import { ChartColumn, ChartLine, Info } from 'lucide-react';
import { ReactNode, useId, useState } from 'react';
import {
  Area,
  Bar,
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { DeltaChip } from './usage-bits';
import {
  USAGE_METRICS,
  UsageHistory,
  UsageMetric,
  UsagePeriod,
  UsagePoint,
} from './usage-dummy-data';
import { usageFormat } from './usage-format';

export function UsageHero({
  series,
  period,
  note,
  history,
  height = 280,
}: UsageHeroProps) {
  const [metric, setMetric] = useState<UsageMetric>('spend');
  const [chartType, setChartType] = useState<UsageChartType>('line');
  const points = series[metric];
  const current = points.reduce((sum, point) => sum + (point.current ?? 0), 0);
  const previous = points.reduce(
    (sum, point) => sum + (point.previous ?? 0),
    0,
  );
  const comparable = history?.comparable ?? true;
  const partial = !isNil(history) && history.currentCoverage < 1;

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
            {comparable ? (
              <>
                <DeltaChip value={usageFormat.change({ current, previous })} />
                <span className="text-sm text-gray-11">
                  {usageFormat.previousLabel({ period })}
                </span>
              </>
            ) : (
              <NoComparison />
            )}
          </div>
          {metric === 'spend' && note && (
            <span className="text-xs text-gray-11">{note}</span>
          )}
          {partial && history && (
            <span className="text-xs text-warning-11">
              {t(
                'Tracking started {date}, so this covers {covered} of {total} days',
                {
                  date: usageFormat.pointLabel({
                    label: history.trackingSince,
                  }),
                  covered: Math.round(history.coveredDays),
                  total: Math.round(history.periodDays),
                },
              )}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
          <Tabs
            value={chartType}
            onValueChange={(value) =>
              setChartType(CHART_TYPES.find((item) => item === value) ?? 'line')
            }
          >
            <TabsList size="sm">
              <TabsTrigger value="line" size="sm" aria-label={t('Line chart')}>
                <ChartLine className="size-4" />
              </TabsTrigger>
              <TabsTrigger value="bar" size="sm" aria-label={t('Bar chart')}>
                <ChartColumn className="size-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <ChartLegend
          points={points}
          period={period}
          chartType={chartType}
          comparable={comparable}
        />
        <UsageLineChart
          points={points}
          metric={metric}
          height={height}
          chartType={chartType}
        />
      </div>
    </section>
  );
}

export function UsageLineChart({
  points,
  metric,
  height,
  compact = false,
  chartType = 'line',
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
          width={Y_AXIS_WIDTH}
          tick={(props: AxisTickProps) => (
            <YAxisTick
              y={props.y}
              value={props.payload?.value}
              metric={metric}
            />
          )}
        />
        <ChartTooltip
          cursor={
            chartType === 'bar'
              ? { fill: 'var(--gray-3)' }
              : { stroke: 'var(--gray-8)', strokeWidth: 1 }
          }
          content={
            <ChartTooltipContent
              indicator="line"
              labelFormatter={(label) =>
                usageFormat.pointLabel({ label: String(label) })
              }
              formatter={(value, name) =>
                value === null || value === undefined ? null : (
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
                )
              }
            />
          }
        />
        {chartType === 'bar' && (
          <Bar
            dataKey="current"
            fill={config.current.color}
            radius={[3, 3, 0, 0]}
            maxBarSize={28}
          />
        )}
        {chartType === 'bar' && (
          <Bar
            dataKey="previous"
            fill={PREVIOUS_BAR_COLOR}
            radius={[3, 3, 0, 0]}
            maxBarSize={28}
          />
        )}
        {chartType === 'line' && (
          <Line
            dataKey="previous"
            type="monotone"
            stroke={config.previous.color}
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            activeDot={false}
          />
        )}
        {chartType === 'line' && (
          <Area
            dataKey="current"
            type="monotone"
            stroke={config.current.color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: config.current.color }}
          />
        )}
      </ComposedChart>
    </ChartContainer>
  );
}

function YAxisTick({
  y,
  value,
  metric,
}: {
  y?: number;
  value?: number;
  metric: UsageMetric;
}) {
  return (
    <text
      x={0}
      y={y}
      dominantBaseline="middle"
      fill="var(--gray-11)"
      fontSize={12}
    >
      {usageFormat.metricValue({ metric, value: value ?? 0 })}
    </text>
  );
}

function NoComparison() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex cursor-default items-center gap-1.5 text-sm text-gray-11">
          {t('No full previous period to compare yet')}
          <Info className="size-3.5" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6} className="max-w-xs">
        {t(
          'Usage tracking started after the previous period began, so a change % would be wrong. It shows up once a full previous period is tracked.',
        )}
      </TooltipContent>
    </Tooltip>
  );
}

function ChartLegend({
  points,
  period,
  chartType,
  comparable,
}: {
  points: UsagePoint[];
  period: UsagePeriod;
  chartType: UsageChartType;
  comparable: boolean;
}) {
  const hasPrevious = points.some((point) => point.previous !== null);
  const ranges = usageFormat.rangeLabel({
    labels: points.map((point) => point.label),
    period,
  });
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-gray-11">
      <LegendItem
        previous={false}
        chartType={chartType}
        label={t('This period')}
        range={ranges?.current}
      />
      <LegendItem
        previous
        chartType={chartType}
        label={t('Previous period')}
        range={
          hasPrevious
            ? comparable
              ? ranges?.previous
              : t('{range}, partly tracked', { range: ranges?.previous ?? '' })
            : t('not tracked yet')
        }
      />
    </div>
  );
}

function LegendItem({
  previous,
  chartType,
  label,
  range,
}: {
  previous: boolean;
  chartType: UsageChartType;
  label: string;
  range?: string;
}) {
  const dashed = previous;
  return (
    <span className="flex items-center gap-2">
      {chartType === 'bar' ? (
        <span
          className="size-2.5 shrink-0 rounded-xs"
          style={{
            backgroundColor: previous ? PREVIOUS_BAR_COLOR : 'var(--accent-9)',
          }}
        />
      ) : (
        <svg
          width="20"
          height="8"
          viewBox="0 0 20 8"
          aria-hidden="true"
          className="shrink-0"
        >
          <line
            x1="1"
            y1="4"
            x2="19"
            y2="4"
            stroke={dashed ? 'var(--gray-8)' : 'var(--accent-9)'}
            strokeWidth={dashed ? 1.5 : 2}
            strokeDasharray={dashed ? '3 3' : undefined}
            strokeLinecap="round"
          />
        </svg>
      )}
      <span className="text-gray-12">{label}</span>
      {range && <span className="tabular-nums">{range}</span>}
    </span>
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

const Y_AXIS_WIDTH = 56;

type AxisTickProps = {
  y?: number;
  payload?: { value?: number };
};
const PREVIOUS_BAR_COLOR = 'var(--gray-6)';
const CHART_TYPES: UsageChartType[] = ['line', 'bar'];

type UsageChartType = 'line' | 'bar';

type UsageHeroProps = {
  series: Record<UsageMetric, UsagePoint[]>;
  history?: UsageHistory;
  period: UsagePeriod;
  note?: ReactNode;
  height?: number;
};

type UsageLineChartProps = {
  points: UsagePoint[];
  metric: UsageMetric;
  height: number;
  compact?: boolean;
  chartType?: UsageChartType;
};
