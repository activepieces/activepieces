import { PlanItem } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, Circle, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

function PlanStatusIcon({ status }: { status: PlanItem['status'] }) {
  switch (status) {
    case 'completed':
      return (
        <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
      );
    case 'in_progress':
      return (
        <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin" />
      );
    default:
      return (
        <Circle className="h-2.5 w-2.5 text-muted-foreground/40 fill-current" />
      );
  }
}

export function PlanCard({ entries }: { entries: PlanItem[] }) {
  if (entries.length === 0) return null;

  const completedCount = entries.filter((e) => e.status === 'completed').length;
  const isAllDone = completedCount === entries.length;

  return (
    <div className="mt-1 mb-2">
      <p className="text-xs text-muted-foreground mb-1.5">
        {isAllDone
          ? t('Completed all steps')
          : `${completedCount}/${entries.length} ${t('steps')}`}
      </p>
      <div className="space-y-1">
        {entries.map((entry, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="flex items-center justify-center h-4 w-4 shrink-0">
              <PlanStatusIcon status={entry.status} />
            </span>
            <span
              className={cn(
                entry.status === 'completed' && 'text-muted-foreground',
                entry.status === 'in_progress' && 'text-foreground',
                entry.status === 'pending' && 'text-muted-foreground/60',
              )}
            >
              {entry.content}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
