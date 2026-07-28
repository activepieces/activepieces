import { t } from 'i18next';
import { X } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function InteractiveCardShell({
  onDismiss,
  title,
  headerExtra,
  children,
  tone = 'assistant',
  showDismiss = true,
  frameClassName,
}: InteractiveCardShellProps) {
  const reduceMotion = useReducedMotion();
  const decision = tone === 'decision';
  return (
    <motion.div
      className={cn(
        'rounded-2xl bg-background p-4 sm:p-5 transition-colors dark:bg-neutral-900',
        decision
          ? 'border shadow-sm'
          : 'chat-question-gradient-border shadow-[0_12px_40px_-12px_rgba(129,66,227,0.22)] dark:shadow-[0_12px_40px_-12px_rgba(129,66,227,0.35)] backdrop-blur-sm',
        frameClassName,
      )}
      initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: 8, scale: 0.98 }}
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
        {(headerExtra || showDismiss) && (
          <div className="flex items-center gap-1 text-muted-foreground shrink-0">
            {headerExtra}
            {showDismiss && (
              <Button
                variant="ghost"
                size="icon"
                className="ms-1 size-9"
                onClick={onDismiss}
                aria-label={t('Dismiss')}
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        )}
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
  tone?: 'assistant' | 'decision';
  showDismiss?: boolean;
  frameClassName?: string;
};
