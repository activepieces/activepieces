// Custom
import { forwardRef } from 'react';

import { UserAvatar } from '@/components/ui/user-avatar';
import {
  PromptMessage,
} from '@/features/flows/lib/prompt-to-flow-api';
import { flagsHooks } from '@/hooks/flags-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { formatUtils } from '@/lib/utils';
import { BuilderMessageRole } from '@activepieces/shared';

interface ChatMessageProps {
  message: PromptMessage;
}

export const ChatMessage = forwardRef<HTMLDivElement, ChatMessageProps>(
  ({ message }, ref) => {
    const isUser = message.role === BuilderMessageRole.USER;
    const branding = flagsHooks.useWebsiteBranding();
    const { data: currentUser } = userHooks.useCurrentUser();

    const userIcon = isUser ? (
      <UserAvatar
        name={
          `${currentUser?.firstName ?? ''} ${
            currentUser?.lastName ?? ''
          }`.trim() || 'You'
        }
        email={currentUser?.email ?? ''}
        size={24}
        disableTooltip={true}
      />
    ) : (
      <img
        src={branding.logos.logoIconUrl}
        alt="AutomationX"
        className="h-6 w-6 object-contain"
      />
    );

    const userName = isUser
      ? `${currentUser?.firstName ?? ''} ${
          currentUser?.lastName ?? ''
        }`.trim() || 'You'
      : 'AutomationX';
    const time = formatUtils.formatDate(
      new Date(message.created ?? new Date()),
    );

    return (
      <div ref={ref}>
        <div className="flex gap-3">
          <div className="w-6 h-6 shrink-0 basis-6">{userIcon}</div>

          <div>
            <p className="font-medium">{userName}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{time}</p>
            <div className="mt-2 text-sm whitespace-pre-wrap">
              {message.content}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

ChatMessage.displayName = 'ChatMessage';
