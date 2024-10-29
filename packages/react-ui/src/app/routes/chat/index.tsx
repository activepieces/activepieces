import { useMutation, useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ArrowUpIcon, Paperclip } from 'lucide-react';
import { nanoid } from 'nanoid';
import React, { useEffect, useRef, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useSearchParam } from 'react-use';

import { LoadingScreen } from '@/app/components/loading-screen';
import { FileInputPreview } from '@/app/routes/chat/file-input-preview';
import { Button } from '@/components/ui/button';
import { ChatInput } from '@/components/ui/chat/chat-input';
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
  USE_DRAFT_QUERY_PARAM_NAME,
} from '@activepieces/shared';

import { ImageDialog } from './image-dialog';
import { Messages, MessagesList } from './messages-list';

export function ChatPage() {
  const { flowId } = useParams();
  const useDraft = useSearchParam(USE_DRAFT_QUERY_PARAM_NAME) === 'true';
  const messagesRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const {
    data: chatUI,
    isLoading,
    isError: isLoadingError,
  } = useQuery<ChatUIResponse | null, Error>({
    queryKey: ['chat', flowId],
    queryFn: () => humanInputApi.getChatUI(flowId!, useDraft),
    enabled: !isNil(flowId),
    staleTime: Infinity,
    retry: false,
  });

  const scrollToBottom = () => {
    setTimeout(() => {
      const lastMessage = document.getElementById('last-message');
      if (lastMessage) {
        lastMessage.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const chatId = useRef<string>(nanoid());
  const [messages, setMessages] = useState<Messages>([]);
  const [input, setInput] = useState('');
  const previousInputRef = useRef('');
  const [sendingError, setSendingError] = useState<ApErrorParams | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  const [files, setFiles] = useState<File[]>([]);
  const previousFilesRef = useRef<File[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const botName =
    chatUI?.props.botName ?? `${chatUI?.platformName ?? 'Activepieces'} Bot`;

  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: async ({ isRetrying }: { isRetrying: boolean }) => {
      if (!flowId || !chatId) return null;
      const savedInput = isRetrying ? previousInputRef.current : input;
      const savedFiles = isRetrying ? previousFilesRef.current : files;
      previousInputRef.current = savedInput;
      previousFilesRef.current = savedFiles;
      setInput('');
      setFiles([]);
      if (!isRetrying) {
        const fileMessages: Messages = savedFiles.map((file) => {
          const isImage = file.type.startsWith('image/');
          return {
            role: 'user' as const,
            content: URL.createObjectURL(file),
            type: isImage ? ('image' as const) : ('file' as const),
            mimeType: file.type,
            fileName: file.name,
          };
        });
        setMessages([
          ...messages,
          ...fileMessages,
          { role: 'user', content: savedInput },
        ]);
      }
      scrollToBottom();
      return humanInputApi.sendMessage({
        flowId,
        chatId: chatId.current,
        message: savedInput,
        files: savedFiles,
        useDraft,
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
              { role: 'bot', content: result.value, type: 'text' as const },
              ...(result.files ?? []).map((file) => {
                const isImage =
                  'mimeType' in file
                    ? file.mimeType?.startsWith('image/')
                    : false;
                return {
                  role: 'bot' as const,
                  content: 'url' in file ? file.url : file.base64Url,
                  type: isImage ? ('image' as const) : ('file' as const),
                  mimeType: 'mimeType' in file ? file.mimeType : undefined,
                  fileName: 'fileName' in file ? file.fileName : undefined,
                };
              }),
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files && Array.from(event.target.files);
    if (selectedFiles) {
      setFiles((prevFiles) => {
        const newFiles = [...prevFiles, ...selectedFiles];
        return newFiles;
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  if (!flowId || isLoadingError) return <Navigate to="/404" />;

  if (isLoading) return <LoadingScreen />;

  const toggleImageDialog = (imageUrl: string | null) => {
    setImageDialogOpen(!!imageUrl);
    setSelectedImage(imageUrl);
  };

  return (
    <main
      className={cn(
        'flex w-full flex-col items-center justify-center pb-6',
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
              <div className="flex items-center justify-center p-3 rounded-full">
                <img
                  src={chatUI?.platformLogoUrl}
                  alt="Bot Avatar"
                  className="w-10 h-10"
                />
              </div>
              <div className="flex items-center gap-1 justify-center">
                <p className="animate-typing overflow-hidden whitespace-nowrap pr-1 hidden lg:block lg:text-xl text-foreground leading-8">
                  Hi I&apos;m {botName} 👋 What can I help you with today?
                </p>
                <p className="animate-typing-sm overflow-hidden whitespace-nowrap pr-1 lg:hidden text-xl text-foreground leading-8">
                  Hi I&apos;m {botName} 👋
                </p>
                <span className="w-4 h-4 rounded-full bg-foreground animate-[fade_0.15s_ease-out_forwards_0.7s_reverse]" />
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="w-full px-4 max-w-3xl">
        <form ref={formRef} onSubmit={onSubmit}>
          <div className="flex flex-col items-center justify-between pe-2 pt-0 rounded-3xl bg-muted">
            {files.length > 0 && (
              <div className="px-4 py-3 w-full">
                <div className="flex items-start gap-3 overflow-x-auto">
                  {files.map((file, index) => (
                    <FileInputPreview
                      key={`${file.name}-${index}`}
                      file={file}
                      index={index}
                      onRemove={removeFile}
                    />
                  ))}
                </div>
              </div>
            )}
            <div className="flex-grow flex items-center w-full">
              <div className="flex items-center ps-2">
                <label htmlFor="file-upload" className="cursor-pointer p-2">
                  <Paperclip className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                </label>
                <input
                  ref={fileInputRef}
                  id="file-upload"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
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
                className="rounded-full min-w-8 min-h-8 h-8 w-8"
              >
                <ArrowUpIcon className="w-4 h-4 size-4" />
              </Button>
            </div>
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
