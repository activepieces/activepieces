import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from 'recharts';

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const SEQUENTIAL_CONFIG = {
  value: { label: 'Value', color: 'var(--accent-9)' },
} satisfies ChartConfig;

const ROW_HEIGHT = 36;
const LABEL_WIDTH = 152;
const LABEL_MAX_CHARS = 18;

function sequentialFill(ratio: number): string {
  if (ratio > 0.75) return 'var(--accent-9)';
  if (ratio > 0.5) return 'var(--accent-8)';
  if (ratio > 0.25) return 'var(--accent-7)';
  return 'var(--accent-6)';
}

function truncateLabel(label: string): string {
  return label.length > LABEL_MAX_CHARS
    ? `${label.slice(0, LABEL_MAX_CHARS - 1)}…`
    : label;
}

function CategoryTick({ x, y, payload }: CategoryTickProps) {
  const label = String(payload?.value ?? '');
  return (
    <text x={x} y={y} dy={4} textAnchor="end" className="fill-gray-11 text-sm">
      <title>{label}</title>
      {truncateLabel(label)}
    </text>
  );
}

export function HorizontalBarChart({
  data,
  formatValue = (value) => value.toLocaleString(),
  formatTooltipValue,
  limit,
}: HorizontalBarChartProps) {
  const sorted = [...data]
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, limit ?? data.length);
  const max = Math.max(0, ...sorted.map((item) => item.value));

  return (
    <ChartContainer
      config={SEQUENTIAL_CONFIG}
      className="aspect-auto w-full"
      style={{ height: Math.max(1, sorted.length) * ROW_HEIGHT }}
    >
      <BarChart
        accessibilityLayer
        data={sorted}
        layout="vertical"
        margin={{ top: 0, right: 72, bottom: 0, left: 0 }}
        barCategoryGap={6}
      >
        <XAxis type="number" hide domain={[0, max || 1]} />
        <YAxis
          type="category"
          dataKey="label"
          width={LABEL_WIDTH}
          tickLine={false}
          axisLine={false}
          interval={0}
          tick={<CategoryTick />}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              hideLabel
              hideIndicator
              formatter={(value, _name, item) => (
                <div className="flex w-full items-center justify-between gap-4">
                  <span className="text-gray-11">{item.payload.label}</span>
                  <span className="font-medium text-gray-12 tabular-nums">
                    {(formatTooltipValue ?? formatValue)(Number(value))}
                  </span>
                </div>
              )}
            />
          }
        />
        <Bar
          dataKey="value"
          radius={[0, 4, 4, 0]}
          maxBarSize={24}
          isAnimationActive={false}
        >
          {sorted.map((item) => (
            <Cell
              key={item.key ?? item.label}
              fill={sequentialFill(max > 0 ? item.value / max : 0)}
            />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            offset={12}
            className="fill-gray-12 text-sm font-medium tabular-nums"
            formatter={(value: unknown) => formatValue(Number(value))}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

export type HorizontalBarDatum = {
  key?: string;
  label: string;
  value: number;
};

type HorizontalBarChartProps = {
  data: HorizontalBarDatum[];
  formatValue?: (value: number) => string;
  formatTooltipValue?: (value: number) => string;
  limit?: number;
};

type CategoryTickProps = {
  x?: number;
  y?: number;
  payload?: { value: string };
};
