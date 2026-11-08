import { CornerDownRight } from 'lucide-react';

import { ChatLine } from './chat-ui/chat-line';
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
    <div className="flex flex-col gap-0.5 pb-3 animate-in fade-in duration-200">
      {contextualReplies.map((reply, i) => (
        <ChatLine
          key={`${i}-${reply}`}
          icon={<CornerDownRight className="size-3.5 text-gray-11" />}
          title={reply}
          onClick={() => onSend(reply)}
        >
          {reply}
        </ChatLine>
      ))}
      {offerRecurringAutomation && (
        <RecurringChip onSend={() => onSend(RECURRING_AUTOMATION_REPLY)} />
      )}
    </div>
  );
}
