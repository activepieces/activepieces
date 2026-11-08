import { t } from 'i18next';

import { TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ConversationIndicatorState } from '@/features/chat/lib/use-conversation-indicators';

import { ChatStatusIcon } from './chat-ui/chat-status';
import { chatStatusUtils } from './chat-ui/chat-status-utils';
import { DelayedTooltip } from './delayed-tooltip';

export function ConversationStatusDot({
  state,
}: {
  state: ConversationIndicatorState;
}) {
  const status = chatStatusUtils.fromConversationIndicator(state);
  const label = getStateLabel(state);
  return (
    <DelayedTooltip>
      <TooltipTrigger asChild>
        <span
          role="img"
          aria-label={label}
          data-state={state}
          className="flex size-3.5 items-center justify-center"
        >
          {status === null ? (
            <span className="size-1.5 rounded-full bg-gray-12" />
          ) : (
            <ChatStatusIcon status={status} decorative />
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="right"
        align="center"
        className="pointer-events-none"
      >
        {label}
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
