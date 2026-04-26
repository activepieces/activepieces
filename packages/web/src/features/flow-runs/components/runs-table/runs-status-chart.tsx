import { t } from 'i18next';

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  flowRunQueries,
  RunStatusCategory,
} from '@/features/flow-runs/hooks/flow-run-hooks';
import { formatUtils } from '@/lib/format-utils';

const DONUT_SIZE = 18;
const DONUT_RADIUS = 6;
const DONUT_STROKE = 3;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;
const DONUT_CENTER = DONUT_SIZE / 2;

function MiniDonut({
  categories,
  total,
}: {
  categories: RunStatusCategory[];
  total: number;
}) {
  let accumulated = 0;
  return (
    <svg
      width={DONUT_SIZE}
      height={DONUT_SIZE}
      viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}
    >
      {categories.map((cat) => {
        const segmentLength = (cat.count / total) * DONUT_CIRCUMFERENCE;
        const offset = DONUT_CIRCUMFERENCE - accumulated;
        accumulated += segmentLength;
        return (
          <circle
            key={cat.label}
            cx={DONUT_CENTER}
            cy={DONUT_CENTER}
            r={DONUT_RADIUS}
            fill="none"
            stroke={cat.color}
            strokeWidth={DONUT_STROKE}
            strokeDasharray={`${segmentLength} ${
              DONUT_CIRCUMFERENCE - segmentLength
            }`}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${DONUT_CENTER} ${DONUT_CENTER})`}
          />
        );
      })}
    </svg>
  );
}

function RunsStatusChart() {
  const { categories, total, isLoading } = flowRunQueries.useRunStats();

  if (isLoading || categories.length === 0) return;
  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>
        <button className="flex items-center gap-2 px-3 h-8 rounded-md hover:bg-accent transition-colors text-sm text-accent-foreground">
          <MiniDonut categories={categories} total={total} />
          {t('Statistics')}
        </button>
      </HoverCardTrigger>
      <HoverCardContent align="end" className="w-72 p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{t('Runs by Status')}</p>
            <p className="text-xs text-muted-foreground">
              {t('Total Runs')}: {total}
            </p>
          </div>

          {total > 0 && (
            <div className="flex h-3 w-full overflow-hidden rounded-full">
              {categories.map((cat) => (
                <div
                  key={cat.label}
                  style={{
                    width: `${(cat.count / total) * 100}%`,
                    backgroundColor: cat.color,
                  }}
                />
              ))}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            {categories.map((cat) => (
              <div
                key={cat.label}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span>
                    {formatUtils.convertEnumToHumanReadable(cat.label)}
                  </span>
                </div>
                <span className="font-medium tabular-nums">{cat.count}</span>
              </div>
            ))}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

export { RunsStatusChart };
