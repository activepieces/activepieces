import { t } from 'i18next';
import { X } from 'lucide-react';
import { motion } from 'motion/react';
import { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { MOTION } from '@/features/workspace/lib/chat-layout';
import { cn } from '@/lib/utils';

export function InteractiveCardShell({
  onDismiss,
  title,
  headerExtra,
  active = true,
  children,
}: InteractiveCardShellProps) {
  return (
    <motion.div
      className={cn(
        'chat-question-gradient-border rounded-xl bg-panel p-4 @chat-sm/chat:p-5 shadow-glow-primary backdrop-blur-sm transition-[color,background-color,border-color,opacity] duration-(--dur-micro) ease-[ease]',
        !active && 'opacity-60',
      )}
      initial={{ opacity: 0, y: 4, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{
        opacity: 0,
        y: 4,
        scale: 0.98,
        transition: { duration: MOTION.fast, ease: MOTION.easeOut },
      }}
      transition={{ duration: MOTION.base, ease: MOTION.easeOut }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {typeof title === 'string' ? (
            <h3 className="text-base font-semibold leading-snug text-gray-12">
              {title}
            </h3>
          ) : (
            title
          )}
        </div>
        <div className="flex items-center gap-1 text-gray-11 shrink-0">
          {headerExtra}
          <Button
            variant="ghost"
            size="icon-xs"
            className="ms-1"
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
  active?: boolean;
  children: ReactNode;
};
