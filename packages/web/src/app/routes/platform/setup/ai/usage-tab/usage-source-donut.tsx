import { t } from 'i18next';
import { Cell, Pie, PieChart } from 'recharts';

import { adminSurface } from '@/app/components/admin';
import { ChartConfig, ChartContainer } from '@/components/ui/chart';
import { cn } from '@/lib/utils';

import { UsageSourceSpend } from './usage-dummy-data';
import { usageFormat } from './usage-format';

export function UsageSourceDonut({
  sources,
  className,
}: {
  sources: UsageSourceSpend[];
  className?: string;
}) {
  const totalUsd = sources.reduce((sum, item) => sum + item.spendUsd, 0);
  const config = Object.fromEntries(
    sources.map((item, index) => [
      item.source,
      {
        label: usageFormat.sourceLabel({ source: item.source }),
        color: SLICE_COLORS[index % SLICE_COLORS.length],
      },
    ]),
  ) satisfies ChartConfig;

  return (
    <section
      className={cn(adminSurface.card, 'flex flex-col gap-3 p-5', className)}
    >
      <h2 className="text-base font-semibold text-gray-12">
        {t('Spend by source')}
      </h2>
      <div className="flex flex-wrap items-center gap-5">
        <div className="relative size-36 shrink-0">
          <ChartContainer config={config} className="aspect-square size-36">
            <PieChart>
              <Pie
                data={sources}
                dataKey="spendUsd"
                nameKey="source"
                innerRadius={48}
                outerRadius={70}
                strokeWidth={2}
                stroke="var(--panel)"
              >
                {sources.map((item, index) => (
                  <Cell
                    key={item.source}
                    fill={SLICE_COLORS[index % SLICE_COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-semibold tabular-nums text-gray-12">
              {usageFormat.usd(totalUsd)}
            </span>
            <span className="text-xs text-gray-11">{t('total')}</span>
          </div>
        </div>
        <ul className="flex min-w-40 flex-1 flex-col gap-2">
          {sources.map((item, index) => (
            <li key={item.source} className="flex items-center gap-2 text-sm">
              <span
                className="size-2.5 shrink-0 rounded-xs"
                style={{
                  backgroundColor: SLICE_COLORS[index % SLICE_COLORS.length],
                }}
              />
              <span className="min-w-0 flex-1 truncate text-gray-12">
                {usageFormat.sourceLabel({ source: item.source })}
              </span>
              <span className="tabular-nums text-gray-11">
                {usageFormat.percent(
                  totalUsd === 0 ? 0 : item.spendUsd / totalUsd,
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const SLICE_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];
