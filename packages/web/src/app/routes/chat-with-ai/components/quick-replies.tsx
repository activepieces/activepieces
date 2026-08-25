import { CornerDownRight } from 'lucide-react';
import { motion } from 'motion/react';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';

import { RECURRING_AUTOMATION_REPLY, RecurringChip } from './recurring-chip';

export function QuickReplies({
  replies,
  offerRecurringAutomation,
  onSend,
}: {
  replies: string[];
  offerRecurringAutomation: boolean;
  onSend: (text: string, files?: File[]) => void;
}) {
  const contextualReplies = offerRecurringAutomation
    ? replies
        .filter(
          (reply) =>
            reply.trim().toLowerCase() !==
            RECURRING_AUTOMATION_REPLY.toLowerCase(),
        )
        .slice(0, 2)
    : replies.slice(0, 3);

  if (contextualReplies.length === 0 && !offerRecurringAutomation) return null;

  return (
    <div className="flex flex-col gap-3 pb-3">
      {contextualReplies.map((reply, i) => (
        <motion.button
          key={`${i}-${reply}`}
          type="button"
          onClick={() => onSend(reply)}
          className="flex w-full items-start gap-2 text-left text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer min-w-0 pl-1"
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
      {offerRecurringAutomation && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.25,
            delay: contextualReplies.length * 0.06,
            ease: 'easeOut',
          }}
        >
          <RecurringChip onSend={() => onSend(RECURRING_AUTOMATION_REPLY)} />
        </motion.div>
      )}
    </div>
  );
}
