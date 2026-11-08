import { t } from 'i18next';
import { motion } from 'motion/react';
import { memo } from 'react';

import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent as PromptKitMessageContent,
} from '@/components/prompt-kit/message';
import { ChatUIMessage } from '@/features/chat/lib/chat-types';

import { getTextFromParts } from '../lib/message-parsers';

import { ChatFileChip } from './chat-ui/chat-file-chip';
import { CopyIconButton } from './copy-icon-button';

export const UserMessage = memo(function UserMessage({
  message,
}: {
  message: ChatUIMessage;
}) {
  const content = getTextFromParts(message.parts);
  const files = message.parts.flatMap((p) =>
    p.type === 'file' && typeof p.filename === 'string'
      ? [{ name: p.filename, mediaType: p.mediaType, url: p.url }]
      : [],
  );

  const isFromHistory = message.id.startsWith('hist-');

  return (
    <motion.div
      className="flex justify-end py-3 group/msg"
      initial={isFromHistory ? false : { opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex max-w-[85%] flex-col items-end">
        {files.length > 0 && (
          <div className="mb-1.5 flex flex-wrap justify-end gap-1.5">
            {files.map((file, i) => (
              <ChatFileChip
                key={`${i}-${file.name}`}
                name={file.name}
                type={fileTypeLabel(file)}
                thumbnailUrl={
                  file.mediaType.startsWith('image/') ? file.url : undefined
                }
                onOpen={() => window.open(file.url, '_blank', 'noopener')}
              />
            ))}
          </div>
        )}
        <Message className="flex-row-reverse">
          <div className="rounded-xl rounded-br-md bg-gray-3 px-3 py-1.5 text-sm font-medium [&_*]:text-sm">
            <PromptKitMessageContent markdown>
              {content}
            </PromptKitMessageContent>
          </div>
        </Message>
        <MessageActions
          className="justify-end mt-1"
        >
          <MessageAction tooltip={t('Copy')}>
            <CopyIconButton textToCopy={content} className="h-6 w-6" />
          </MessageAction>
        </MessageActions>
      </div>
    </motion.div>
  );
});

function fileTypeLabel({
  name,
  mediaType,
}: {
  name: string;
  mediaType: string;
}): string {
  const dot = name.lastIndexOf('.');
  if (dot > 0 && dot < name.length - 1) {
    return name.slice(dot + 1).toUpperCase();
  }
  return mediaType.split('/').pop()?.toUpperCase() ?? '';
}
