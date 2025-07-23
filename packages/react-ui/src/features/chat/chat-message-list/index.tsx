import { Static, Type } from '@sinclair/typebox';
import { BotIcon } from 'lucide-react';
import React from 'react';

import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from '@/components/ui/chat/chat-bubble';
import { ChatMessage } from '@/components/ui/chat/chat-input';
import { cn } from '@/lib/utils';
import {
  ApErrorParams,
  ChatUIResponse,
  FileResponseInterface,
} from '@activepieces/shared';

import { MultiMediaMessage } from '../chat-message';

import { ErrorBubble } from './error-bubble';

export const Messages = Type.Array(
  Type.Object({
    role: Type.Union([Type.Literal('user'), Type.Literal('bot')]),
    textContent: Type.Optional(Type.String()),
    files: Type.Optional(Type.Array(FileResponseInterface)),
  }),
);
export type Messages = Static<typeof Messages>;

interface ChatMessageListProps extends React.HTMLAttributes<HTMLDivElement> {
  messagesRef?: React.RefObject<HTMLDivElement>;
  messages?: Messages;
  chatUI?: ChatUIResponse | null | undefined;
  sendingError?: ApErrorParams | null;
  isSending?: boolean;
  flowId?: string;
  sendMessage?: (arg0: { isRetrying: boolean; message?: ChatMessage }) => void;
  setSelectedImage?: (image: string | null) => void;
}

const ChatMessageList = React.forwardRef<HTMLDivElement, ChatMessageListProps>(
  (
    {
      className,
      children,
      messagesRef,
      messages,
      chatUI,
      sendingError,
      isSending,
      flowId,
      sendMessage,
      setSelectedImage,
      ...props
    },
    ref,
  ) => {
    if (messages && messages.length > 0) {
      return (
        <div className="h-full w-full flex items-center justify-center overflow-y-auto">
          <div
            className={cn('flex flex-col w-full h-full p-4 gap-2', className)}
            ref={messagesRef || ref}
            {...props}
          >
            {messages.map((message, index) => {
              const isLastMessage = index === messages.length - 1;
              return (
                <ChatBubble
                  id={isLastMessage ? 'last-message' : undefined}
                  key={index}
                  variant={message.role === 'user' ? 'sent' : 'received'}
                  className={cn(
                    'flex items-start',
                    isLastMessage ? 'pb-8' : '',
                  )}
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
                      setSelectedImage={setSelectedImage || (() => {})}
                    />
                  </ChatBubbleMessage>
                </ChatBubble>
              );
            })}
            {sendingError && !isSending && flowId && sendMessage && (
              <ErrorBubble
                chatUI={chatUI}
                flowId={flowId}
                sendingError={sendingError}
                sendMessage={sendMessage}
              />
            )}
            {isSending && (
              <ChatBubble variant="received" className="pb-8">
                <ChatBubbleAvatar
                  src={chatUI?.platformLogoUrl}
                  fallback={<BotIcon className="size-5" />}
                />
                <ChatBubbleMessage isLoading />
              </ChatBubble>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="h-full w-full flex items-center justify-center overflow-y-auto">
        <div
          className={cn('flex flex-col w-full h-full p-4 gap-2', className)}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      </div>
    );
  },
);

ChatMessageList.displayName = 'ChatMessageList';

export { ChatMessageList };
