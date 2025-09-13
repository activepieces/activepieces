import { t } from 'i18next';

import { cn } from '@/lib/utils';
import { WorkerJobStats } from '@activepieces/shared';

import { getStatusColor } from '.';

export const MultiProgressBar = ({ stats }: { stats: WorkerJobStats }) => {
  const total = Object.values(stats).reduce((a, b) => a + b, 0);

  const segments = [
    { value: stats.active, color: getStatusColor('active') },
    { value: stats.retried, color: getStatusColor('retrying') },
    { value: stats.delayed, color: getStatusColor('delayed') },
    { value: stats.throttled, color: getStatusColor('throttled') },
    { value: stats.failed, color: getStatusColor('failed') },
  ];

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
        {segments.map((seg, index) => {
          if (seg.value <= 0) return null;
          const percentage = (seg.value / total) * 100;
          return (
            <div
              key={index}
              className={cn(
                'flex items-center justify-center transition-all duration-300',
                seg.color,
              )}
              style={{ width: `${percentage}%` }}
            >
              <span className="drop-shadow-sm">{percentage.toFixed()}%</span>
            </div>
          );
        })}
      </div>
      <span className="w-16 text-right text-sm font-medium text-muted-foreground">
        {t('countJobs', { count: total })}
      </span>
    </div>
  );
};
