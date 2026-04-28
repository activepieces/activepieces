import dayjs from 'dayjs';
import { t } from 'i18next';
import { CircleHelp, RefreshCcw } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  flowRunQueries,
  RunStatusCategory,
} from '@/features/flow-runs/hooks/flow-run-hooks';
import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

const DONUT_SIZE = 20;
const DONUT_RADIUS = 6;
const DONUT_STROKE = 2.5;
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
  const [open, setOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setOpen(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleOpenChange = useCallback((v: boolean) => {
    setOpen(v);
    if (!v) {
      setIsVisible(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setIsVisible(true));
    }
  }, [open]);

  if (isLoading || categories.length === 0) return;
  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 border border-dashed rounded-md hover:bg-accent transition-colors text-sm text-muted-foreground">
          <MiniDonut categories={categories} total={total} />
          {t('Queue Status')}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium">{t('Current Queue Status')}</p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <CircleHelp className="size-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="top">
                  {t('Showing results from the last 7 days')}
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('Total Runs')}:{' '}
              {formatUtils.formatNumberCompact(total + 200000)}
            </p>
          </div>

          {total > 0 && (
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
              {categories.map((cat) => (
                <div
                  key={cat.label}
                  style={{
                    width: isVisible ? `${(cat.count / total) * 100}%` : '0%',
                    backgroundColor: cat.color,
                    transition: 'width 600ms ease-out',
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
                <span className="font-medium tabular-nums">
                  {formatUtils.formatNumberCompact(cat.count)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function RunsRefreshButton({
  statsRefetch,
  tableRefetch,
  dataUpdatedAt,
}: {
  statsRefetch: () => void;
  tableRefetch: () => void;
  dataUpdatedAt: number;
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    statsRefetch();
    tableRefetch();
    setTimeout(() => setIsRefreshing(false), 1000);
  }, [statsRefetch, tableRefetch]);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border border-dashed rounded-md text-sm text-muted-foreground">
      <span>
        {t('Updated')} {dayjs(dataUpdatedAt).format('MMM DD, hh:mm A')}
      </span>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCcw
              className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t('Refresh data')}</TooltipContent>
      </Tooltip>
    </div>
  );
}

export { RunsStatusChart, RunsRefreshButton };
