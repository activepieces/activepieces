import { cn } from '@/lib/utils';
import { WorkerJobStatus } from '@activepieces/shared';

import { getStatusColor, getStatusLabel } from '.';

export const StatusLegend = () => (
  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pb-4">
    {Object.values(WorkerJobStatus).map((status) => (
      <div key={status} className="flex items-center gap-2">
        <span className={cn('h-3 w-3 rounded-full', getStatusColor(status))} />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {getStatusLabel(status)}
        </span>
      </div>
    ))}
  </div>
);
