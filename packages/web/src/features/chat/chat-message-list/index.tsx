import {
  ApErrorParams,
  ChatUIResponse,
  FileResponseInterface,
  isNil,
} from '@activepieces/shared';
import { BotIcon } from 'lucide-react';
import React from 'react';
import { z } from 'zod';

import { cn } from '@/lib/utils';

import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from '../chat-bubble';
import { ChatMessage } from '../chat-input';
import { MultiMediaMessage } from '../chat-message';

import { ErrorBubble } from './error-bubble';

export const Messages = z.array(
  z.object({
    role: z.union([z.literal('user'), z.literal('bot')]),
    textContent: z.string().optional(),
    files: z.array(FileResponseInterface).optional(),
  }),
);
export type Messages = z.infer<typeof Messages>;

interface ChatMessageListProps extends React.HTMLAttributes<HTMLDivElement> {
  messagesRef?: React.RefObject<HTMLDivElement | null>;
  messages?: Messages;
  chatUI?: ChatUIResponse | null | undefined;
  sendingError?: ApErrorParams | null;
  isSending?: boolean;
  flowId?: string;
  sendMessage?: (arg0: { isRetrying: boolean; message: ChatMessage }) => void;
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
        <div className="h-full w-full max-w-3xl flex items-center justify-center overflow-y-auto">
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
                sendMessage={(arg0) => {
                  if (!isNil(arg0.message)) {
                    sendMessage({
                      isRetrying: false,
                      message: arg0.message!,
                    });
                  }
                }}
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
