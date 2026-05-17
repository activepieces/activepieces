import { t } from 'i18next';
import { Paperclip } from 'lucide-react';
import { motion } from 'motion/react';
import { memo } from 'react';

import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent as PromptKitMessageContent,
} from '@/components/prompt-kit/message';
import { ChatUIMessage } from '@/features/chat/lib/chat-types';
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

  return (
    <motion.div
      className="flex justify-end py-3 group/msg"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="max-w-[80%]">
        <Message className="flex-row-reverse">
          <div className="bg-muted rounded-2xl rounded-br-md px-2.5 py-1 text-sm">
            {fileNames.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {fileNames.map((name, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-md bg-background/60 px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    <Paperclip className="size-3" />
                    <span className="max-w-[150px] truncate">{name}</span>
                  </span>
                ))}
              </div>
            )}
            <PromptKitMessageContent markdown className="prose-sm">
              {content}
            </PromptKitMessageContent>
          </div>
        </Message>
        <MessageActions
          className={cn(
            'justify-end mt-1 transition-opacity',
            isLastMessage
              ? 'opacity-100'
              : 'opacity-0 group-hover/msg:opacity-100',
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
