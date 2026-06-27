import { ChatMention, ChatMentionType } from '@activepieces/shared';
import { t } from 'i18next';
import { ArrowUpRight, Blocks, Paperclip, Table2 } from 'lucide-react';
import { motion } from 'motion/react';
import { memo } from 'react';

import { VerticalFlowIcon } from '@/components/icons/vertical-flow';
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent as PromptKitMessageContent,
} from '@/components/prompt-kit/message';
import { ChatUIMessage } from '@/features/chat/lib/chat-types';
import { authenticationSession } from '@/lib/authentication-session';
import { useNewWindow } from '@/lib/navigation-utils';
import { cn } from '@/lib/utils';

import { getTextFromParts } from '../lib/message-parsers';

import { CopyIconButton } from './copy-icon-button';
import { mentionSerialization } from './mention-composer/mention-serialization';

function MentionChip({ mention }: { mention: ChatMention }) {
  const openNewWindow = useNewWindow();
  const Icon =
    mention.type === ChatMentionType.FLOW
      ? VerticalFlowIcon
      : mention.type === ChatMentionType.TABLE
      ? Table2
      : Blocks;

  const route = mentionRoute(mention);
  const baseClass =
    'mx-px inline-flex items-center gap-1 rounded-[5px] bg-foreground/[0.07] px-1.5 py-px font-medium text-foreground align-baseline';

  if (!route) {
    return (
      <span className={baseClass}>
        <Icon className="size-3 shrink-0 text-muted-foreground" />
        {mention.label}
      </span>
    );
  }

  const open = () => openNewWindow(route);
  return (
    <span
      role="button"
      tabIndex={0}
      title={t('Open')}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      }}
      className={cn(
        baseClass,
        'group/chip cursor-pointer transition-colors hover:bg-foreground/[0.12]',
      )}
    >
      <Icon className="size-3 shrink-0 text-muted-foreground" />
      {mention.label}
      <ArrowUpRight className="size-3 shrink-0 text-muted-foreground/60 transition-colors group-hover/chip:text-foreground" />
    </span>
  );
}

function mentionRoute(mention: ChatMention): string | null {
  if (mention.type === ChatMentionType.FLOW) {
    return authenticationSession.appendProjectRoutePrefix(
      `/flows/${mention.id}`,
    );
  }
  if (mention.type === ChatMentionType.TABLE) {
    return authenticationSession.appendProjectRoutePrefix(
      `/tables/${mention.id}`,
    );
  }
  return null;
}

function UserMessageBody({ content }: { content: string }) {
  const segments = mentionSerialization.parseTokens(content);
  const hasMention = segments.some((s) => s.kind === 'mention');
  if (!hasMention) {
    return (
      <PromptKitMessageContent markdown>{content}</PromptKitMessageContent>
    );
  }
  return (
    <div className="whitespace-pre-wrap break-words leading-relaxed">
      {segments.map((segment, i) =>
        segment.kind === 'text' ? (
          <span key={i}>{segment.value}</span>
        ) : (
          <MentionChip key={i} mention={segment.mention} />
        ),
      )}
    </div>
  );
}

function toDisplayText(content: string): string {
  return mentionSerialization
    .parseTokens(content)
    .map((s) => (s.kind === 'text' ? s.value : `@${s.mention.label}`))
    .join('');
}

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

  return (
    <motion.div
      className="flex justify-end py-3 group/msg"
      initial={isFromHistory ? false : { opacity: 0, x: 16 }}
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
            <UserMessageBody content={content} />
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
            <CopyIconButton
              textToCopy={toDisplayText(content)}
              className="h-6 w-6"
            />
          </MessageAction>
        </MessageActions>
      </div>
    </motion.div>
  );
});
