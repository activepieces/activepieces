import { PlanStepStatus, PlanStepUpdate } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, ListChecks, Loader2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo } from 'react';

import { TextShimmer } from '@/components/ui/text-shimmer';
import { cn } from '@/lib/utils';

import { PlanProgressData } from '../lib/message-parsers';

function computeStepStatuses({
  stepCount,
  updates,
}: {
  stepCount: number;
  updates: PlanStepUpdate[];
}): PlanStepStatus[] {
  const statuses: PlanStepStatus[] = Array.from(
    { length: stepCount },
    () => 'pending',
  );
  for (const update of updates) {
    if (update.stepIndex >= 0 && update.stepIndex < stepCount) {
      statuses[update.stepIndex] = update.status;
    }
  }
  return statuses;
}

function StepIndicator({
  status,
  index,
}: {
  status: PlanStepStatus;
  index: number;
}) {
  switch (status) {
    case 'done':
      return (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/20">
          <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
        </span>
      );
    case 'executing':
      return (
        <span className="flex h-5 w-5 items-center justify-center">
          <Loader2 className="h-4 w-4 text-primary animate-spin" />
        </span>
      );
    case 'error':
      return (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive/10">
          <X className="h-3 w-3 text-destructive" />
        </span>
      );
    default:
      return (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground/50 text-[10px] font-medium">
          {index + 1}
        </span>
      );
  }
}

function overallStatus(
  statuses: PlanStepStatus[],
): 'pending' | 'executing' | 'done' | 'error' {
  if (statuses.some((s) => s === 'error')) return 'error';
  if (statuses.every((s) => s === 'done')) return 'done';
  if (statuses.some((s) => s === 'executing' || s === 'done'))
    return 'executing';
  return 'pending';
}

function completedCount(statuses: PlanStepStatus[]): number {
  return statuses.filter((s) => s === 'done').length;
}

export function PlanProgressCard({
  progress,
  updates,
  currentActivity,
  isStreaming = false,
}: {
  progress: PlanProgressData;
  updates: PlanStepUpdate[];
  currentActivity?: string | null;
  isStreaming?: boolean;
}) {
  const stepStatuses = useMemo(
    () =>
      computeStepStatuses({
        stepCount: progress.steps.length,
        updates,
      }),
    [progress.steps.length, updates],
  );

  const rawStatus = overallStatus(stepStatuses);
  const status = isStreaming && rawStatus === 'done' ? 'executing' : rawStatus;
  const done = completedCount(stepStatuses);
  const total = progress.steps.length;

  return (
    <motion.div
      className="rounded-xl border bg-background overflow-hidden my-2"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="px-3.5 pt-3 pb-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-medium text-xs flex items-center gap-1.5 text-foreground">
            <ListChecks className="h-3.5 w-3.5 text-muted-foreground" />
            {progress.title}
          </h3>
          {status === 'done' ? (
            <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-medium">
              <Check className="h-3 w-3" />
              {t('Done')}
            </span>
          ) : status === 'error' ? (
            <span className="inline-flex items-center gap-1 text-destructive text-xs font-medium">
              <X className="h-3 w-3" />
              {t('Error')}
            </span>
          ) : status === 'executing' ? (
            <span className="text-xs text-muted-foreground">
              {done}/{total}
            </span>
          ) : null}
        </div>
      </div>

      <div className="px-3.5 pb-3">
        <div className="flex flex-col gap-0.5">
          {progress.steps.map((step, index) => {
            const stepStatus = stepStatuses[index];
            return (
              <div key={index}>
                <motion.div
                  className="flex items-center gap-2.5 py-1 px-1 rounded-md"
                  initial={false}
                  animate={{
                    backgroundColor:
                      stepStatus === 'executing'
                        ? 'var(--color-primary-50, rgba(99,102,241,0.05))'
                        : 'transparent',
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <StepIndicator status={stepStatus} index={index} />
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={cn(
                        'text-xs transition-all duration-200',
                        stepStatus === 'done' &&
                          'line-through text-muted-foreground',
                        stepStatus === 'executing' &&
                          'font-medium text-foreground',
                        stepStatus === 'error' && 'text-destructive',
                        stepStatus === 'pending' && 'text-muted-foreground',
                      )}
                    >
                      {step}
                    </span>
                    {stepStatus === 'executing' && (
                      <span className="text-[11px] text-primary font-medium shrink-0">
                        {t('Running')}
                      </span>
                    )}
                  </div>
                </motion.div>

                <AnimatePresence>
                  {stepStatus === 'executing' && currentActivity && (
                    <motion.div
                      className="ml-8 mt-0.5 mb-1"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <TextShimmer
                        className="text-[11px] text-muted-foreground"
                        duration={3}
                      >
                        {currentActivity}
                      </TextShimmer>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
