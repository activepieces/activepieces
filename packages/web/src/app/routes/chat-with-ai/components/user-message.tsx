import { t } from 'i18next';
import { Paperclip } from 'lucide-react';
import { motion } from 'motion/react';
import { memo } from 'react';

import { UserAvatar } from '@/components/custom/user-avatar';
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent as PromptKitMessageContent,
} from '@/components/prompt-kit/message';
import { ChatUIMessage } from '@/features/chat/lib/chat-types';
import { useIsPanelChat } from '@/features/chat/lib/chat-variant-context';
import { userHooks } from '@/hooks/user-hooks';
import { cn } from '@/lib/utils';

import { getTextFromParts } from '../lib/message-parsers';

import { CopyIconButton } from './copy-icon-button';

export const UserMessage = memo(function UserMessage({
  message,
  isLastMessage = false,
}: {
  message: ChatUIMessage;
  isLastMessage?: boolean;
}) {
  const content = getTextFromParts(message.parts);
  const fileNames = message.parts
    .filter(
      (
        p,
      ): p is {
        type: 'file';
        filename: string;
        mediaType: string;
        url: string;
      } =>
        p.type === 'file' && 'filename' in p && typeof p.filename === 'string',
    )
    .map((p) => p.filename);

  const isFromHistory = message.id.startsWith('hist-');
  const isPanel = useIsPanelChat();

  return (
    <motion.div
      className="flex justify-end py-3 group/msg"
      initial={isFromHistory ? false : { opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className={isPanel ? 'max-w-[90%]' : 'max-w-[80%]'}>
        <Message className={cn('flex-row-reverse', isPanel && 'gap-2')}>
          {isPanel && <CurrentUserAvatar />}
          <div
            className={cn(
              'bg-gray-3 text-sm',
              isPanel
                ? 'rounded-lg p-3'
                : 'rounded-xl rounded-br-md px-2.5 py-1',
            )}
          >
            {fileNames.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {fileNames.map((name, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-md bg-gray-1/60 px-2 py-0.5 text-xs text-gray-11"
                  >
                    <Paperclip className="size-3" />
                    <span className="max-w-[150px] truncate">{name}</span>
                  </span>
                ))}
              </div>
            )}
            <PromptKitMessageContent markdown>
              {content}
            </PromptKitMessageContent>
          </div>
        </Message>
        <MessageActions
          className={cn(
            'justify-end mt-1 transition-opacity',
            isLastMessage
              ? 'opacity-100'
              : 'opacity-0 group-hover/msg:opacity-100 focus-within:opacity-100',
          )}
        >
          <MessageAction tooltip={t('Copy')}>
            <CopyIconButton textToCopy={content} className="h-6 w-6" />
          </MessageAction>
        </MessageActions>
      </div>
    </motion.div>
  );
});

function CurrentUserAvatar() {
  const { data: user } = userHooks.useCurrentUser();
  if (!user) {
    return null;
  }
  return (
    <span className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-3">
      <UserAvatar
        className="size-full object-cover"
        name={`${user.firstName} ${user.lastName}`}
        email={user.email}
        imageUrl={user.imageUrl}
        size={24}
        disableTooltip={true}
      />
    </span>
  );
}
