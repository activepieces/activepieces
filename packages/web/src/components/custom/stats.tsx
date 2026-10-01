import { t } from 'i18next';
import { ArrowDownRight, ArrowUpRight, Info } from 'lucide-react';
import * as React from 'react';

import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

function StatRow({
  stats,
  size = 'default',
  divided = false,
  loading = false,
  className,
}: StatRowProps) {
  return (
    <div
      data-slot="stat-row"
      className={cn(
        divided
          ? 'grid grid-cols-2 gap-6 md:auto-cols-fr md:grid-flow-col md:grid-cols-none'
          : 'flex flex-wrap gap-x-10 gap-y-4',
        className,
      )}
    >
      {stats.map((stat) => (
        <div
          key={stat.key ?? stat.label}
          className={cn(
            'flex min-w-0 flex-col gap-1',
            divided &&
              'md:border-l md:border-gray-6 md:pl-6 md:first:border-l-0 md:first:pl-0',
          )}
        >
          <div className="flex min-w-0 items-center gap-1.5 text-sm text-gray-11">
            <span className="truncate">{stat.label}</span>
            {stat.hint && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="size-3.5 shrink-0 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  {stat.hint}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          {loading ? (
            <Skeleton className={cn('w-24', size === 'lead' ? 'h-9' : 'h-8')} />
          ) : (
            <div
              className={cn(
                'truncate font-semibold tracking-tight tabular-nums',
                size === 'lead' ? 'text-3xl' : 'text-2xl',
                stat.bad ? 'text-danger-11' : 'text-gray-12',
              )}
            >
              {stat.value}
            </div>
          )}
          {!loading && stat.delta && <StatDeltaLine delta={stat.delta} />}
          {!loading && stat.caption && (
            <div className="truncate text-xs text-gray-11">{stat.caption}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function StatDeltaLine({ delta }: { delta: StatDelta }) {
  const Arrow = delta.direction === 'down' ? ArrowDownRight : ArrowUpRight;
  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-1 text-sm font-medium tabular-nums',
        delta.good ? 'text-success-11' : 'text-warning-11',
      )}
    >
      <Arrow className="size-4 shrink-0" />
      {delta.value}
      <span className="truncate font-normal text-gray-11">
        {delta.against ?? t('vs last period')}
      </span>
    </div>
  );
}

function percentDelta({
  current,
  previous,
  upIsGood = true,
}: DeltaParams): StatDelta | undefined {
  if (!Number.isFinite(previous) || previous === 0) {
    return undefined;
  }
  const change = ((current - previous) / previous) * 100;
  return signedDelta({ change, suffix: '%', upIsGood });
}

function pointDelta({
  current,
  previous,
  upIsGood = true,
}: DeltaParams): StatDelta | undefined {
  if (!Number.isFinite(previous) || previous === 0) {
    return undefined;
  }
  return signedDelta({ change: current - previous, suffix: 'pt', upIsGood });
}

function signedDelta({
  change,
  suffix,
  upIsGood,
}: {
  change: number;
  suffix: string;
  upIsGood: boolean;
}): StatDelta {
  const rounded = Math.round(change * 10) / 10;
  const up = rounded >= 0;
  return {
    value: `${up ? '+' : '−'}${Math.abs(rounded).toFixed(1)}${suffix}`,
    direction: up ? 'up' : 'down',
    good: up === upIsGood,
  };
}

function Meter({
  value,
  max,
  label,
  limit,
  warnAt = 0.9,
  className,
}: MeterProps) {
  const ratio = max > 0 ? value / max : 0;
  const near = ratio >= warnAt;
  return (
    <div
      data-slot="meter"
      className={cn('flex w-full min-w-0 flex-col gap-2', className)}
    >
      <div className="flex w-full min-w-0 items-baseline justify-between gap-4 text-sm">
        <span
          className={cn(
            'flex min-w-0 items-center gap-2 [&_svg]:size-4 [&_svg]:shrink-0',
            near ? 'font-medium text-danger-11' : 'text-gray-12',
          )}
        >
          {label}
        </span>
        {limit && (
          <span className="shrink-0 text-gray-11 tabular-nums">{limit}</span>
        )}
      </div>
      <Progress
        value={Math.min(100, Math.max(0, ratio * 100))}
        className="bg-gray-4"
        indicatorClassName={cn(
          'rounded-full',
          near ? 'bg-danger-11' : 'bg-accent-11',
        )}
      />
    </div>
  );
}

export const statDeltaUtils = { percentDelta, pointDelta };

export { StatRow, Meter };

type DeltaParams = {
  current: number;
  previous: number;
  upIsGood?: boolean;
};

export type StatDelta = {
  value: string;
  direction: 'up' | 'down';
  good: boolean;
  against?: string;
};

export type StatValue = {
  key?: string;
  label: string;
  value: React.ReactNode;
  hint?: string;
  delta?: StatDelta;
  bad?: boolean;
  caption?: React.ReactNode;
};

type StatRowProps = {
  stats: StatValue[];
  size?: 'default' | 'lead';
  divided?: boolean;
  loading?: boolean;
  className?: string;
};

type MeterProps = {
  value: number;
  max: number;
  label: React.ReactNode;
  limit?: React.ReactNode;
  warnAt?: number;
  className?: string;
};
