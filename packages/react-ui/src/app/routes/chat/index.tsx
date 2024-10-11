'use client';

import { useMutation } from '@tanstack/react-query';
import { ArrowUpIcon, BotIcon, CopyIcon } from 'lucide-react';
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
import { chatApi } from '@/features/chat/lib/chat-api';
import { cn } from '@/lib/utils';
import { Chat } from '@activepieces/shared';

export function ChatPage() {
  const { flowId } = useParams();
  const messagesRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const scrollToBottom = () => {
    messagesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  const { messages, handleSubmit, isLoading, input, setInput } = useChat({
    onSendMessage: async () => {
      setInput('');
      scrollToBottom();
    },
  });

  useEffect(scrollToBottom, [messages, isLoading]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit();
    scrollToBottom();
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
            className="flex items-center"
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
                  className="size-5"
                  icon={<CopyIcon className="size-3" />}
                  onClick={() => navigator.clipboard.writeText(message.content)}
                />
              </div>
            )}
          </ChatBubble>
        ))}
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

const useChat = ({
  onSendMessage,
}: {
  onSendMessage: (input: string) => Promise<void>;
}) => {
  const { flowId } = useParams();
  const [chatId, setChatId] = useState<string | null>(null);
  const [chat, setChat] = useState<Chat | null>(null);
  const [input, setInput] = useState('');

  const { mutate: sendMessage, isPending: isLoading } = useMutation({
    mutationKey: ['sendMessage', flowId, chatId],
    mutationFn: async () => {
      if (!flowId || !chatId) return null;
      onSendMessage(input);
      setChat(
        chat
          ? {
              ...chat,
              messages: [...chat.messages, { role: 'user', content: input }],
            }
          : {
              id: chatId,
              messages: [{ role: 'user', content: input }],
            },
      );
      return chatApi.sendMessage(flowId, chatId, input);
    },
    onSuccess: setChat,
  });

  useEffect(() => {
    setChatId(nanoid());
  }, []);

  return {
    messages: chat?.messages ?? [],
    handleSubmit: sendMessage,
    isLoading,
    input,
    setInput,
  };
};
