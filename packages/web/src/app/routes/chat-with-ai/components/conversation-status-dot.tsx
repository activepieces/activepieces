import { t } from 'i18next';

import { TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ConversationIndicatorState } from '@/features/chat/lib/use-conversation-indicators';
import { cn } from '@/lib/utils';

import { DelayedTooltip } from './delayed-tooltip';

export function ConversationStatusDot({
  state,
}: {
  state: ConversationIndicatorState;
}) {
  return (
    <DelayedTooltip>
      <TooltipTrigger asChild>
        <span className="relative flex h-1.5 w-1.5 items-center justify-center">
          {state === 'working' && (
            <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
          )}
          <span
            className={cn(
              'relative inline-flex h-1.5 w-1.5 rounded-full',
              DOT_CLASS[state],
            )}
          />
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="right"
        align="center"
        className="pointer-events-none"
      >
        {getStateLabel(state)}
      </TooltipContent>
    </DelayedTooltip>
  );
}

function getStateLabel(state: ConversationIndicatorState): string {
  switch (state) {
    case 'working':
      return t('Working…');
    case 'waiting':
      return t('Waiting for your input');
    case 'unread':
      return t('New response');
  }
}

const DOT_CLASS: Record<ConversationIndicatorState, string> = {
  working: 'bg-primary',
  waiting: 'bg-amber-500',
  unread: 'bg-emerald-500',
};
