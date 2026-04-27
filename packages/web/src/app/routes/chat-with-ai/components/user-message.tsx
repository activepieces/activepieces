import { t } from 'i18next';
import { Paperclip } from 'lucide-react';
import { motion } from 'motion/react';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
} from '@/components/prompt-kit/message';
import { ChatUIMessage } from '@/features/chat/lib/chat-types';

import { getTextFromParts } from '../lib/message-parsers';

export function UserMessage({ message }: { message: ChatUIMessage }) {
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
          <div className="bg-muted rounded-2xl rounded-br-md px-4 py-2.5">
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
            <MessageContent className="prose-sm">{content}</MessageContent>
          </div>
        </Message>
        <MessageActions className="justify-end mt-1">
          <MessageAction tooltip={t('Copy')}>
            <CopyButton
              textToCopy={content}
              withoutTooltip
              variant="ghost"
              className="h-6 w-6 p-0"
            />
          </MessageAction>
        </MessageActions>
      </div>
    </motion.div>
  );
}
