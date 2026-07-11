import { CornerDownRight } from 'lucide-react';
import { motion } from 'motion/react';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { AutomationSuggestion } from '@/features/chat/lib/chat-types';
import { cn } from '@/lib/utils';

import { AutomationChip } from './automation-chip';

export function QuickReplies({
  replies,
  automationSuggestion,
  onSend,
  max = 3,
  className,
}: {
  replies: string[];
  automationSuggestion?: AutomationSuggestion;
  onSend: (text: string, files?: File[]) => void;
  max?: number;
  className?: string;
}) {
  const normalMax = automationSuggestion ? Math.max(0, max - 1) : max;
  const shown = replies.slice(0, normalMax);
  if (shown.length === 0 && !automationSuggestion) return null;

  return (
    <div className={cn('flex flex-col gap-3 px-1 pb-3', className)}>
      {shown.map((reply, i) => (
        <motion.button
          key={`${i}-${reply}`}
          type="button"
          onClick={() => onSend(reply)}
          className="flex w-full items-start gap-2 text-left text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer min-w-0"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: i * 0.06, ease: 'easeOut' }}
        >
          <CornerDownRight className="size-4 shrink-0 mt-0.5" />
          <TextWithTooltip tooltipMessage={reply}>
            <span className="min-w-0 flex-1">{reply}</span>
          </TextWithTooltip>
        </motion.button>
      ))}
      {automationSuggestion && (
        <AutomationChip
          label={automationSuggestion.label}
          onClick={() => onSend(automationSuggestion.prompt)}
          index={shown.length}
        />
      )}
    </div>
  );
}
