import { t } from 'i18next';
import { Check, Circle, ListChecks, X } from 'lucide-react';
import { motion } from 'motion/react';

import { Button } from '@/components/ui/button';

export function PlanApprovalForm({
  planSummary,
  steps,
  onApprove,
  onReject,
  onDismiss,
}: {
  planSummary: string;
  steps: string[];
  onApprove: () => void;
  onReject: () => void;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      className="rounded-2xl border bg-background overflow-hidden shadow-sm"
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 shrink-0 mt-0.5">
              <ListChecks className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                {t('Ready to execute')}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {planSummary}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            onClick={onDismiss}
            aria-label={t('Close')}
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      {steps.length > 0 && (
        <div className="px-4 pb-3">
          <div className="flex flex-col gap-0.5">
            {steps.map((step, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 py-1.5 px-2 rounded-md"
              >
                <Circle className="h-3 w-3 text-muted-foreground/30 shrink-0" />
                <span className="text-xs text-muted-foreground">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 px-4 py-3 border-t bg-muted/30">
        <Button size="sm" onClick={onApprove} className="gap-1.5" type="button">
          <Check className="size-3.5" />
          {t('Approve')}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onReject}
          className="text-muted-foreground"
          type="button"
        >
          {t('Cancel')}
        </Button>
      </div>
    </motion.div>
  );
}
