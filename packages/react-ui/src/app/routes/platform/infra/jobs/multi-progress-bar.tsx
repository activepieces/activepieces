import { t } from 'i18next';
import { cn } from '@/lib/utils';
import { WorkerJobStats, WorkerJobStatus } from '@activepieces/shared';
import { getStatusColor } from '.';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMemo } from 'react';

export const MultiProgressBar = ({ stats }: { stats: WorkerJobStats }) => {
  const total = useMemo(() => Object.values(stats).reduce((a, b) => a + b, 0), [stats]);

  if (total === 0) {
    return (
      <div className="flex w-full items-center gap-3">
        <div className="h-5 flex-grow rounded-full bg-muted" />
        <span className="w-16 text-right text-sm font-medium text-muted-foreground">
          {t('zeroJobs')}
        </span>
      </div>
    );
  }

  return (
    <div className="flex w-full items-center gap-3">
      <div className="flex h-5 flex-grow overflow-hidden rounded-full bg-muted text-xs font-bold text-white">
        {Object.values(WorkerJobStatus).map((status, index) => {
          if (stats[status] <= 0) return null;
          const percentage = (stats[status] / total) * 100;
          return (
            <TooltipProvider key={index}>
              <Tooltip key={index}>
                <TooltipTrigger asChild>
              <div
                key={index}
                className={cn(
                  'flex items-center justify-center transition-all duration-300',
                  getStatusColor(status),
                )}
                style={{ width: `${percentage}%` }}
              >
                <span className="drop-shadow-sm">{percentage.toFixed()}%</span>
              </div>
              </TooltipTrigger>
              <TooltipContent>
                {t(status)}
              </TooltipContent>
            </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
      <span className="w-16 text-right text-sm font-medium text-muted-foreground">
        {t('countJobs', { count: total })}
      </span>
    </div>
  );
};
