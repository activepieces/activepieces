import { BatchProgressData } from '@activepieces/shared';
import { t } from 'i18next';
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export function BatchProgressCard({
  progress,
}: {
  progress: BatchProgressData;
}) {
  const percentage =
    progress.total > 0
      ? Math.round((progress.completed / progress.total) * 100)
      : 0;

  const hasFailures = progress.failed > 0;

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
            <Zap className="h-3.5 w-3.5 text-muted-foreground" />
            {progress.label}
          </h3>
          <BatchStatusBadge progress={progress} />
        </div>
      </div>

      <div className="px-3.5 pb-3 space-y-2.5">
        <div className="space-y-2">
          <Progress
            value={percentage}
            className="h-2"
            indicatorClassName={cn(
              'transition-all duration-500 ease-out',
              progress.done
                ? hasFailures
                  ? 'bg-amber-500'
                  : 'bg-green-500'
                : undefined,
            )}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              {progress.succeeded > 0 && (
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <Check className="h-3 w-3" />
                  {progress.succeeded} {t('succeeded')}
                </span>
              )}
              {progress.failed > 0 && (
                <span className="flex items-center gap-1 text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  {progress.failed} {t('failed')}
                </span>
              )}
            </div>
            <span className="tabular-nums">
              {progress.completed}/{progress.total}
            </span>
          </div>
        </div>

        {progress.done && hasFailures && (
          <FailureDetails
            results={progress.results.filter((r) => !r.success)}
          />
        )}
      </div>
    </motion.div>
  );
}

function BatchStatusBadge({ progress }: { progress: BatchProgressData }) {
  if (!progress.done) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
        <Loader2 className="h-3 w-3 animate-spin" />
        {progress.completed}/{progress.total}
      </span>
    );
  }
  if (progress.failed === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-medium">
        <Check className="h-3 w-3" />
        {t('Done')}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs font-medium">
      <AlertCircle className="h-3 w-3" />
      {progress.failed} {t('failed')}
    </span>
  );
}

function FailureDetails({
  results,
}: {
  results: BatchProgressData['results'];
}) {
  const [expanded, setExpanded] = useState(results.length <= 3);

  if (results.length === 0) return null;

  const visible = expanded ? results : results.slice(0, 2);
  const remaining = results.length - 2;

  return (
    <div className="rounded-lg bg-destructive/5 px-3 py-2 space-y-1.5">
      <span className="text-xs font-medium text-destructive">
        {t('Failed items')}
      </span>
      <div className="space-y-1">
        {visible.map((r) => (
          <div
            key={r.index}
            className="flex items-start gap-1.5 text-xs text-destructive/80"
          >
            <span className="shrink-0 tabular-nums text-destructive/50">
              #{r.index + 1}
            </span>
            <span className="break-words min-w-0">
              {cleanErrorText(r.error ?? t('Unknown error'))}
            </span>
          </div>
        ))}
      </div>
      <AnimatePresence>
        {!expanded && remaining > 0 && (
          <motion.button
            type="button"
            className="flex items-center gap-1 text-xs text-destructive/60 hover:text-destructive transition-colors"
            onClick={() => setExpanded(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ChevronDown className="h-3 w-3" />
            {remaining} {t('more')}
          </motion.button>
        )}
        {expanded && results.length > 3 && (
          <motion.button
            type="button"
            className="flex items-center gap-1 text-xs text-destructive/60 hover:text-destructive transition-colors"
            onClick={() => setExpanded(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ChevronUp className="h-3 w-3" />
            {t('Show less')}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function cleanErrorText(text: string): string {
  return text.replace(/^[❌⏳✅]\s*/, '');
}
