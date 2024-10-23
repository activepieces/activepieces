import { useMutation, useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ArrowUpIcon, BotIcon } from 'lucide-react';
import { nanoid } from 'nanoid';
import React, { useEffect, useRef, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { ChatBubbleAvatar } from '@/components/ui/chat/chat-bubble';
import { ChatInput } from '@/components/ui/chat/chat-input';
import { LoadingSpinner } from '@/components/ui/spinner';
import {
  FormResultTypes,
  humanInputApi,
} from '@/features/human-input/lib/human-input-api';
import { cn } from '@/lib/utils';
import {
  ApErrorParams,
  ChatUIResponse,
  ErrorCode,
  isNil,
} from '@activepieces/shared';

import { ImageDialog } from './image-dialog';
import { Messages, MessagesList } from './messages-list';

export function ChatPage() {
  const { flowId } = useParams();
  const messagesRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const {
    data: chatUI,
    isLoading,
    isError: isLoadingError,
  } = useQuery<ChatUIResponse | null, Error>({
    queryKey: ['chat', flowId],
    queryFn: () => humanInputApi.getChatUI(flowId!, false),
    enabled: !isNil(flowId),
    staleTime: Infinity,
    retry: false,
  });

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
  };

  // @ts-expect-error: Adding scrollToBottom to window object for debugging purposes
  window.chat = {
    scrollToBottom,
  };

  const chatId = useRef<string>(nanoid());
  const [messages, setMessages] = useState<Messages>([]);
  const [input, setInput] = useState('');
  const previousInputRef = useRef('');
  const [sendingError, setSendingError] = useState<ApErrorParams | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  const botName =
    chatUI?.props.botName ?? `${chatUI?.platformName ?? 'Activepieces'} Bot`;

  const { mutate: sendMessage, isPending: isSending } = useMutation({
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
      if (!result) {
        setSendingError({
          code: ErrorCode.NO_CHAT_RESPONSE,
          params: {},
        });
      } else if ('type' in result) {
        switch (result.type) {
          case FormResultTypes.FILE:
            if ('url' in result.value) {
              const isImage = result.value.mimeType?.startsWith('image/');
              setSendingError(null);
              setMessages([
                ...messages,
                {
                  role: 'bot',
                  content: result.value.url,
                  type: isImage ? 'image' : 'file',
                  mimeType: result.value.mimeType,
                },
              ]);
            }
            break;
          case FormResultTypes.MARKDOWN:
            setSendingError(null);
            setMessages([
              ...messages,
              { role: 'bot', content: result.value, type: 'text' },
            ]);
        }
      }
      scrollToBottom();
    },
    onError: (error: AxiosError) => {
      setSendingError(error.response?.data as ApErrorParams);
      scrollToBottom();
    },
  });

  useEffect(scrollToBottom, [messages, isSending]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendMessage({ isRetrying: false });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isSending && input) {
        onSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
      }
    }
  };

  if (!flowId || isLoadingError) return <Navigate to="/404" />;

  if (isLoading) return <LoadingSpinner />;

  const toggleImageDialog = (imageUrl: string | null) => {
    setImageDialogOpen(!!imageUrl);
    setSelectedImage(imageUrl);
  };

  return (
    <main
      className={cn(
        'flex w-full max-w-3xl flex-col items-center mx-auto py-6',
        messages.length > 0 ? 'h-screen' : 'h-[calc(50vh)]',
      )}
    >
      <MessagesList
        messagesRef={messagesRef}
        messages={messages}
        chatUI={chatUI}
        sendingError={sendingError}
        isSending={isSending}
        flowId={flowId}
        sendMessage={sendMessage}
        setSelectedImage={toggleImageDialog}
      />
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center justify-center py-8 ps-4 font-bold">
            <div className="flex flex-col items-center gap-1">
              <ChatBubbleAvatar
                src={chatUI?.platformLogoUrl}
                fallback={<BotIcon className="size-5" />}
              />
              <div className="flex items-center gap-1 justify-center">
                <p className="animate-typing overflow-hidden whitespace-nowrap pr-1 hidden lg:block lg:text-xl text-foreground leading-8">
                  Hi I&apos;m {botName} 👋 What can I help you with today?
                </p>
                <p className="animate-typing-sm overflow-hidden whitespace-nowrap pr-1 lg:hidden text-xl text-foreground leading-8">
                  Hi I&apos;m {botName} 👋
                </p>
                <span className="w-4 h-4 rounded-full animate-blink" />
              </div>
            </div>
          </div>
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
              disabled={!input || isSending}
              type="submit"
              size="icon"
              className="rounded-full min-w-10 min-h-10"
            >
              <ArrowUpIcon className="w-5 h-5 size-5" />
            </Button>
          </div>
        </form>
      </div>
      <ImageDialog
        open={imageDialogOpen}
        onOpenChange={(open) => {
          setImageDialogOpen(open);
          if (!open) setSelectedImage(null);
        }}
        imageUrl={selectedImage}
      />
    </main>
  );
}
