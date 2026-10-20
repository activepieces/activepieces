import { t } from 'i18next';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { adminSurface } from '@/app/components/admin';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { cn } from '@/lib/utils';

import { UsagePoint } from './usage-dummy-data';
import { usageFormat } from './usage-format';

export function UsageChart({ points, title }: UsageChartProps) {
  const config = {
    exactUsd: { label: t('Own keys · exact'), color: 'var(--accent-9)' },
    estimatedUsd: {
      label: t('Own keys · estimated'),
      color: 'var(--accent-6)',
    },
    creditsUsd: { label: t('Credits'), color: 'var(--chart-2)' },
  } satisfies ChartConfig;

  return (
    <section className={cn(adminSurface.card, 'flex flex-col gap-4 p-5')}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-gray-12">{title}</h2>
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-11">
          {Object.entries(config).map(([key, item]) => (
            <span key={key} className="flex items-center gap-1.5">
              <span
                className="size-2.5 rounded-xs"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </span>
          ))}
        </div>
      </div>
      <ChartContainer config={config} className="aspect-auto h-[260px] w-full">
        <BarChart
          data={points}
          margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
        >
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            stroke="var(--gray-6)"
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={24}
            tick={{ fill: 'var(--gray-11)', fontSize: 12 }}
            tickFormatter={(label: string) => usageFormat.pointLabel({ label })}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={56}
            tick={{ fill: 'var(--gray-11)', fontSize: 12 }}
            tickFormatter={(value: number) => usageFormat.usd(value)}
          />
          <ChartTooltip
            cursor={{ fill: 'var(--gray-3)' }}
            content={
              <ChartTooltipContent
                labelFormatter={(label) =>
                  usageFormat.pointLabel({ label: String(label) })
                }
                formatter={(value, name) => (
                  <span className="flex w-full justify-between gap-4">
                    <span className="text-gray-11">
                      {
                        Object.entries(config).find(
                          ([key]) => key === String(name),
                        )?.[1].label
                      }
                    </span>
                    <span className="font-medium tabular-nums">
                      {usageFormat.usd(Number(value))}
                    </span>
                  </span>
                )}
              />
            }
          />
          <Bar
            dataKey="exactUsd"
            stackId="spend"
            fill={config.exactUsd.color}
          />
          <Bar
            dataKey="estimatedUsd"
            stackId="spend"
            fill={config.estimatedUsd.color}
          />
          <Bar
            dataKey="creditsUsd"
            stackId="spend"
            fill={config.creditsUsd.color}
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
    </section>
  );
}

type UsageChartProps = {
  points: UsagePoint[];
  title: string;
};
