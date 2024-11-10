import { Static, Type } from '@sinclair/typebox';
import { BotIcon, CircleX, RotateCcw } from 'lucide-react';
import React from 'react';

import {
  ChatBubble,
  ChatBubbleAction,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from '@/components/ui/chat/chat-bubble';
import { ChatMessageList } from '@/components/ui/chat/chat-message-list';
import { cn } from '@/lib/utils';
import {
  ApErrorParams,
  ChatUIResponse,
  ErrorCode,
  FileResponseInterface,
} from '@activepieces/shared';

import { MultiMediaMessage } from './chat-message';
export const Messages = Type.Array(
  Type.Object({
    role: Type.Union([Type.Literal('user'), Type.Literal('bot')]),
    textContent: Type.Optional(Type.String()),
    files: Type.Optional(Type.Array(FileResponseInterface)),
  }),
);
export type Messages = Static<typeof Messages>;

interface MessagesListProps {
  messagesRef: React.RefObject<HTMLDivElement>;
  messages: Messages;
  chatUI: ChatUIResponse | null | undefined;
  sendingError: ApErrorParams | null;
  isSending: boolean;
  flowId: string;
  sendMessage: (arg0: { isRetrying: boolean }) => void;
  setSelectedImage: (image: string | null) => void;
}

const formatError = (
  projectId: string | undefined | null,
  flowId: string,
  error: ApErrorParams,
) => {
  switch (error.code) {
    case ErrorCode.NO_CHAT_RESPONSE:
      return projectId ? (
        <span>
          No response from the chatbot. Ensure that{' '}
          <strong>Respond on UI</strong> is in{' '}
          <a
            href={`/projects/${projectId}/flows/${flowId}`}
            className="text-primary underline"
            target="_blank"
            rel="noreferrer"
          >
            your flow
          </a>
          .
        </span>
      ) : (
        <span>
          The chatbot is not responding. It seems there might be an issue with
          how this chat was set up. Please contact the person who shared this
          chat link with you for assistance.
        </span>
      );
    case ErrorCode.FLOW_NOT_FOUND:
      return (
        <span>The chat flow you are trying to access no longer exists.</span>
      );
    case ErrorCode.VALIDATION:
      return <span>{`Validation error: ${error.params.message}`}</span>;
    default:
      return <span>Something went wrong. Please try again.</span>;
  }
};

const ErrorBubble = ({
  chatUI,
  flowId,
  sendingError,
  sendMessage,
}: {
  chatUI: ChatUIResponse | null | undefined;
  flowId: string;
  sendingError: ApErrorParams;
  sendMessage: (arg0: { isRetrying: boolean }) => void;
}) => (
  <ChatBubble variant="received" className="pb-8">
    <div className="relative">
      <ChatBubbleAvatar
        src={chatUI?.platformLogoUrl}
        fallback={<BotIcon className="size-5" />}
      />
      <div className="absolute -bottom-[2px] -right-[2px]">
        <CircleX className="size-4 text-destructive" strokeWidth={3} />
      </div>
    </div>
    <ChatBubbleMessage className="text-destructive">
      {formatError(chatUI?.projectId, flowId, sendingError)}
    </ChatBubbleMessage>
    <div className="flex gap-1">
      <ChatBubbleAction
        variant="outline"
        className="size-5 mt-2"
        icon={<RotateCcw className="size-3" />}
        onClick={() => {
          sendMessage({ isRetrying: true });
        }}
      />
    </div>
  </ChatBubble>
);
ErrorBubble.displayName = 'ErrorBubble';

const SendingBubble = ({
  chatUI,
}: {
  chatUI: ChatUIResponse | null | undefined;
}) => (
  <ChatBubble variant="received" className="pb-8">
    <ChatBubbleAvatar
      src={chatUI?.platformLogoUrl}
      fallback={<BotIcon className="size-5" />}
    />
    <ChatBubbleMessage isLoading />
  </ChatBubble>
);
SendingBubble.displayName = 'SendingBubble';

export const MessagesList = React.memo(
  ({
    messagesRef,
    messages,
    chatUI,
    sendingError,
    isSending,
    flowId,
    sendMessage,
    setSelectedImage,
  }: MessagesListProps) => {
    return (
      <ChatMessageList ref={messagesRef} className="w-full max-w-3xl">
        {messages.map((message, index) => {
          const isLastMessage = index === messages.length - 1;
          return (
            <ChatBubble
              id={isLastMessage ? 'last-message' : undefined}
              key={index}
              variant={message.role === 'user' ? 'sent' : 'received'}
              className={cn('flex items-start', isLastMessage ? 'pb-8' : '')}
            >
              {message.role === 'bot' && (
                <ChatBubbleAvatar
                  src={chatUI?.platformLogoUrl}
                  fallback={<BotIcon className="size-5" />}
                />
              )}
              <ChatBubbleMessage
                className={cn(
                  'flex flex-col gap-2',
                  message.role === 'bot' ? 'w-full' : '',
                )}
              >
                <MultiMediaMessage
                  textContent={message.textContent}
                  attachments={message.files}
                  role={message.role}
                  setSelectedImage={setSelectedImage}
                />
              </ChatBubbleMessage>
            </ChatBubble>
          );
        })}
        {sendingError && !isSending && (
          <ErrorBubble
            chatUI={chatUI}
            flowId={flowId}
            sendingError={sendingError}
            sendMessage={sendMessage}
          />
        )}
        {isSending && <SendingBubble chatUI={chatUI} />}
      </ChatMessageList>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.messages.length === nextProps.messages.length &&
      prevProps.sendingError === nextProps.sendingError &&
      prevProps.isSending === nextProps.isSending
    );
  },
);
MessagesList.displayName = 'MessagesList';
