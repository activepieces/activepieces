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
import { previewUtils } from './previews/preview-utils';

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
                type={
                  previewUtils.readableFileType({
                    mediaType: file.mediaType,
                    fileName: file.name,
                  }) ?? t('File')
                }
                thumbnailUrl={
                  file.url !== '' && file.mediaType.startsWith('image/')
                    ? file.url
                    : undefined
                }
                onOpen={
                  file.url !== ''
                    ? () => window.open(file.url, '_blank', 'noopener')
                    : undefined
                }
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
        <MessageActions className="justify-end mt-1">
          <MessageAction tooltip={t('Copy')}>
            <CopyIconButton textToCopy={content} className="h-6 w-6" />
          </MessageAction>
        </MessageActions>
      </div>
    </motion.div>
  );
});
