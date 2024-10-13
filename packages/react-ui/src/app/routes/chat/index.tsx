import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import {
  ArrowUpIcon,
  BotIcon,
  CircleX,
  CopyIcon,
  RotateCcw,
} from 'lucide-react';
import { nanoid } from 'nanoid';
import { useEffect, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import { Navigate, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  ChatBubble,
  ChatBubbleAction,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from '@/components/ui/chat/chat-bubble';
import { ChatInput } from '@/components/ui/chat/chat-input';
import { ChatMessageList } from '@/components/ui/chat/chat-message-list';
import { humanInputApi } from '@/features/human-input/lib/human-input-api';
import { cn } from '@/lib/utils';
import { ApErrorParams, ErrorCode } from '@activepieces/shared';

const Messages = Type.Array(
  Type.Object({
    role: Type.Union([Type.Literal('user'), Type.Literal('bot')]),
    content: Type.String(),
  }),
);
type Messages = Static<typeof Messages>;

export function ChatPage() {
  const { flowId } = useParams();
  const messagesRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const scrollToBottom = () => {
    messagesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  const chatId = useRef<string>(nanoid());
  const [messages, setMessages] = useState<Messages>([]);
  const [input, setInput] = useState('');
  const previousInputRef = useRef('');
  const [error, setError] = useState<ApErrorParams | null>(null);

  const { mutate: sendMessage, isPending: isLoading } = useMutation({
    mutationFn: async ({ isRetrying }: { isRetrying: boolean }) => {
      if (!flowId || !chatId) return null;
      const savedInput = isRetrying ? previousInputRef.current : input;
      previousInputRef.current = savedInput;
      setInput('');
      if (!isRetrying) {
        setMessages([...messages, { role: 'user', content: savedInput }]);
      }
      scrollToBottom();
      return humanInputApi.sendMessage({
        flowId,
        chatId: chatId.current,
        message: savedInput,
      });
    },
    onSuccess: (result) => {
      setError(null);
      if (result && 'value' in result) {
        setMessages([
          ...messages,
          { role: 'bot', content: result.value as string },
        ]);
      }
      scrollToBottom();
    },
    onError: (error: AxiosError) => {
      setError(error.response?.data as ApErrorParams);
      scrollToBottom();
    },
  });

  useEffect(scrollToBottom, [messages, isLoading]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendMessage({ isRetrying: false });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input) {
        onSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
      }
    }
  };

  if (!flowId) return <Navigate to="/404" />;

  return (
    <main
      className={cn(
        'flex w-full max-w-3xl flex-col items-center mx-auto py-6',
        messages.length > 0 ? 'h-screen' : 'h-[calc(50vh)]',
      )}
    >
      <ChatMessageList ref={messagesRef}>
        {messages.map((message, index) => (
          <ChatBubble
            key={index}
            variant={message.role === 'user' ? 'sent' : 'received'}
            className="flex items-start"
          >
            {message.role === 'bot' && (
              <ChatBubbleAvatar
                src=""
                fallback={<BotIcon className="size-5" />}
              />
            )}
            <ChatBubbleMessage className="flex gap-2">
              <Markdown className="bg-inherit">{message.content}</Markdown>
            </ChatBubbleMessage>
            {message.role === 'bot' && (
              <div className="flex gap-1">
                <ChatBubbleAction
                  variant="outline"
                  className="size-5 mt-2"
                  icon={<CopyIcon className="size-3" />}
                  onClick={() => navigator.clipboard.writeText(message.content)}
                />
              </div>
            )}
          </ChatBubble>
        ))}
        {error && !isLoading && (
          <ChatBubble variant="received">
            <div className="relative">
              <ChatBubbleAvatar
                src=""
                fallback={<BotIcon className="size-5" />}
              />
              <div className="absolute -bottom-[2px] -right-[2px]">
                <CircleX className="size-4 text-destructive" strokeWidth={3} />
              </div>
            </div>
            <ChatBubbleMessage className="text-destructive">
              {formatError(error)}
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
        )}
        {isLoading && (
          <ChatBubble variant="received">
            <ChatBubbleAvatar
              src=""
              fallback={<BotIcon className="size-5" />}
            />
            <ChatBubbleMessage isLoading />
          </ChatBubble>
        )}
      </ChatMessageList>
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-lg text-gray-500">
            What can I help you with today?
          </p>
        </div>
      )}
      <div className="w-full px-4">
        <form
          ref={formRef}
          onSubmit={onSubmit}
          className="relative rounded-full border bg-background"
        >
          <div className="flex items-center justify-between pe-1 pt-0">
            <ChatInput
              autoFocus
              value={input}
              onKeyDown={onKeyDown}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message here..."
            />
            <Button
              disabled={!input || isLoading}
              type="submit"
              size="icon"
              className="rounded-full"
            >
              <ArrowUpIcon className="w-5 h-5" />
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}

const formatError = (error: ApErrorParams) => {
  switch (error.code) {
    case ErrorCode.FLOW_NOT_FOUND:
      return 'The chat flow you are trying to access no longer exists.';
    case ErrorCode.VALIDATION:
      return `Validation error: ${error.params.message}`;
    default:
      return 'Something went wrong. Please try again.';
  }
};
