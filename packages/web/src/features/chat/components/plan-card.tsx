import { t } from 'i18next';
import { Check, Circle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

import { cn } from '@/lib/utils';

type PlanEntryStatus = 'pending' | 'in_progress' | 'completed';

type PlanEntry = {
  content: string;
  status: string;
};

function normalizePlanStatus(status: string): PlanEntryStatus {
  if (status === 'in_progress' || status === 'completed') return status;
  return 'pending';
}

function PlanStatusIcon({ status }: { status: PlanEntryStatus }) {
  switch (status) {
    case 'completed':
      return (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className="flex items-center justify-center"
        >
          <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
        </motion.span>
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

export function PlanCard({ entries }: { entries: PlanEntry[] }) {
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
        {entries.map((entry, i) => {
          const status = normalizePlanStatus(entry.status);
          return (
            <motion.div
              key={i}
              className="flex items-center gap-2 text-sm"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
            >
              <span className="flex items-center justify-center h-4 w-4 shrink-0">
                <PlanStatusIcon status={status} />
              </span>
              <span
                className={cn(
                  'transition-colors duration-300',
                  status === 'completed' && 'text-muted-foreground',
                  status === 'in_progress' && 'text-foreground',
                  status === 'pending' && 'text-muted-foreground/60',
                )}
              >
                {entry.content}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
