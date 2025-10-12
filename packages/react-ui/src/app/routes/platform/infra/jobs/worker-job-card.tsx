import { t } from 'i18next';
import { AlertCircle, Info } from 'lucide-react';

import { Card, CardHeader, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  WorkerJobType,
  WorkerJobStats,
  WorkerJobStatus,
} from '@activepieces/shared';

import { MultiProgressBar } from './multi-progress-bar';

export type WorkerJobCardProps = {
  jobType: WorkerJobType;
  stats: WorkerJobStats;
  description?: string;
};

export const WorkerJobCard = ({
  jobType,
  stats,
  description,
}: WorkerJobCardProps) => {
  const cardClasses = `flex flex-col gap-3 border ${
    stats[WorkerJobStatus.FAILED] > 0 ? 'border-l-4 border-l-red-500 pl-3' : ''
  }`;

  return (
    <Card className={cardClasses}>
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <h3 className="font-mono text-sm font-semibold text-slate-800">
          {t(jobType)}
        </h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 cursor-pointer text-slate-400" />
            </TooltipTrigger>
            <TooltipContent>
              <p>{description || t('No description')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 p-4 pt-0">
        <MultiProgressBar stats={stats} />
        <div className="mt-auto flex min-h-[18px] items-center justify-between pt-2 text-xs text-slate-500">
          {stats[WorkerJobStatus.FAILED] > 0 && (
            <span className="flex items-center font-bold text-red-600">
              <AlertCircle className="mr-1 h-4 w-4" />
              {t('{count} failed', { count: stats[WorkerJobStatus.FAILED] })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
