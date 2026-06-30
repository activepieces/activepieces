import { t } from 'i18next';
import { X } from 'lucide-react';
import { motion } from 'motion/react';
import { ReactNode } from 'react';

import { Button } from '@/components/ui/button';

export function InteractiveCardShell({
  onDismiss,
  title,
  headerExtra,
  children,
}: InteractiveCardShellProps) {
  return (
    <motion.div
      className="chat-question-gradient-border rounded-2xl bg-background p-4 sm:p-5 shadow-[0_12px_40px_-12px_rgba(129,66,227,0.22)] dark:bg-neutral-900 dark:shadow-[0_12px_40px_-12px_rgba(129,66,227,0.35)] backdrop-blur-sm transition-colors"
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {typeof title === 'string' ? (
            <h3 className="text-base font-semibold leading-snug text-foreground">
              {title}
            </h3>
          ) : (
            title
          )}
        </div>
        <div className="flex items-center gap-1 text-muted-foreground shrink-0">
          {headerExtra}
          <Button
            variant="ghost"
            size="icon"
            className="ms-1 h-7 w-7"
            onClick={onDismiss}
            aria-label={t('Dismiss')}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <div className="mt-4">{children}</div>
    </motion.div>
  );
}

type InteractiveCardShellProps = {
  onDismiss: () => void;
  title?: ReactNode;
  headerExtra?: ReactNode;
  children: ReactNode;
};
