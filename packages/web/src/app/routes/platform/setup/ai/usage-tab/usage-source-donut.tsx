import { isNil } from '@activepieces/core-utils';
import { t } from 'i18next';
import { useState } from 'react';
import { Cell, Pie, PieChart, Sector, SectorProps } from 'recharts';

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
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const totalUsd = sources.reduce((sum, item) => sum + item.spendUsd, 0);
  const active = isNil(activeIndex) ? undefined : sources[activeIndex];
  const config = Object.fromEntries(
    sources.map((item, index) => [
      item.source,
      {
        label: usageFormat.sourceLabel({ source: item.source }),
        color: colorAt({ index }),
      },
    ]),
  ) satisfies ChartConfig;

  return (
    <section
      className={cn(adminSurface.card, 'flex flex-col gap-4 p-5', className)}
    >
      <h2 className="text-base font-semibold text-gray-12">
        {t('Spend by source')}
      </h2>
      <div className="flex flex-1 flex-col items-center gap-6 sm:flex-row sm:gap-10">
        <div className="relative aspect-square w-full max-w-56 shrink-0">
          <ChartContainer config={config} className="aspect-square w-full">
            <PieChart>
              <Pie
                data={sources}
                dataKey="spendUsd"
                nameKey="source"
                innerRadius="62%"
                outerRadius="86%"
                paddingAngle={1.5}
                strokeWidth={0}
                activeIndex={activeIndex ?? undefined}
                activeShape={ActiveSlice}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {sources.map((item, index) => (
                  <Cell
                    key={item.source}
                    fill={colorAt({ index })}
                    className="cursor-pointer outline-none transition-opacity duration-150"
                    opacity={
                      isNil(activeIndex) || activeIndex === index ? 1 : 0.35
                    }
                  />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5 px-10 text-center">
            <span className="truncate text-xs text-gray-11">
              {isNil(active)
                ? t('Total')
                : usageFormat.sourceLabel({ source: active.source })}
            </span>
            <span className="text-xl font-semibold tracking-tight tabular-nums text-gray-12">
              {usageFormat.usd(active?.spendUsd ?? totalUsd)}
            </span>
            {!isNil(active) && (
              <span className="text-xs tabular-nums text-gray-11">
                {usageFormat.percent(
                  totalUsd === 0 ? 0 : active.spendUsd / totalUsd,
                )}
              </span>
            )}
          </div>
        </div>
        <ul className="flex w-full min-w-0 flex-1 flex-col gap-1">
          {sources.map((item, index) => {
            const share = totalUsd === 0 ? 0 : item.spendUsd / totalUsd;
            const dimmed = !isNil(activeIndex) && activeIndex !== index;
            return (
              <li
                key={item.source}
                className={cn(
                  'flex flex-col gap-1.5 rounded-md py-1.5 transition-opacity duration-150',
                  dimmed && 'opacity-40',
                )}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <div className="flex items-center gap-2.5 text-sm">
                  <span
                    className="size-2.5 shrink-0 rounded-xs"
                    style={{ backgroundColor: colorAt({ index }) }}
                  />
                  <span className="min-w-0 flex-1 truncate text-gray-12">
                    {usageFormat.sourceLabel({ source: item.source })}
                  </span>
                  <span className="font-medium tabular-nums text-gray-12">
                    {usageFormat.usd(item.spendUsd)}
                  </span>
                  <span className="w-10 text-right tabular-nums text-gray-11">
                    {usageFormat.percent(share)}
                  </span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-gray-3">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(share * 100, 1)}%`,
                      backgroundColor: colorAt({ index }),
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function ActiveSlice(props: SectorProps) {
  return (
    <Sector {...props} outerRadius={(props.outerRadius ?? 0) + ACTIVE_GROWTH} />
  );
}

function colorAt({ index }: { index: number }): string {
  return SLICE_COLORS[index % SLICE_COLORS.length];
}

const ACTIVE_GROWTH = 6;

const SLICE_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];
