import { Repeat } from 'lucide-react';

import { ChatLine } from './chat-ui/chat-line';

export function RecurringChip({ onSend }: { onSend: () => void }) {
  return (
    <ChatLine
      tone="accent"
      icon={<Repeat className="size-3.5 text-accent-11" />}
      wrap
      onClick={onSend}
    >
      {RECURRING_AUTOMATION_REPLY}
    </ChatLine>
  );
}

export const RECURRING_AUTOMATION_REPLY = 'Run this automatically every day';
