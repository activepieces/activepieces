import { useMutation, useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { ArrowUpIcon, Paperclip } from 'lucide-react';
import { nanoid } from 'nanoid';
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSearchParam } from 'react-use';

import { LoadingScreen } from '@/app/components/loading-screen';
import { FileInputPreview } from '@/app/routes/chat/file-input-preview';
import { Button } from '@/components/ui/button';
import { ChatInput } from '@/components/ui/chat/chat-input';
import { humanInputApi } from '@/features/human-input/lib/human-input-api';
import { cn, useElementSize } from '@/lib/utils';
import {
  ApErrorParams,
  ChatUIResponse,
  ErrorCode,
  isNil,
  USE_DRAFT_QUERY_PARAM_NAME,
  HumanInputFormResultTypes,
} from '@activepieces/shared';

import NotFoundPage from '../404-page';

import { ImageDialog } from './chat-message/image-dialog';
import { Messages, MessagesList } from './messages-list';

export function ChatPage() {
  const filesPreviewContainerRef = useRef<HTMLDivElement | null>(null);
  const filesPreviewContainerSize = useElementSize(filesPreviewContainerRef);
  const { flowId } = useParams();
  const useDraft = useSearchParam(USE_DRAFT_QUERY_PARAM_NAME) === 'true';
  const messagesRef = useRef<HTMLDivElement>(null);

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

      // Get input and files based on whether we're retrying
      const savedInput = isRetrying ? previousInputRef.current : input;
      const savedFiles = isRetrying ? previousFilesRef.current : files;

      // Save current values for potential retry
      previousInputRef.current = savedInput;
      previousFilesRef.current = savedFiles;

      // Clear input fields
      setInput('');
      setFiles([]);

      // Only add messages to UI if not retrying
      if (!isRetrying) {
        // Convert files to message format
        setMessages([
          ...messages,
          {
            role: 'user',
            textContent: savedInput,
            files: savedFiles.map((file) => ({
              url: URL.createObjectURL(file),
              mimeType: file.type,
            })),
          },
        ]);
      }

      scrollToBottom();

      // Send message to API
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
        return;
      }

      if ('type' in result) {
        setSendingError(null);

        switch (result.type) {
          case HumanInputFormResultTypes.FILE: {
            if ('url' in result.value) {
              setMessages([
                ...messages,
                {
                  role: 'bot',
                  files: [
                    {
                      url: result.value.url,
                      mimeType: result.value.mimeType,
                    },
                  ],
                },
              ]);
            }
            break;
          }

          case HumanInputFormResultTypes.MARKDOWN: {
            const validFiles = (result.files ?? []).filter(
              (file) => 'url' in file && 'mimeType' in file,
            );

            setMessages([
              ...messages,
              {
                role: 'bot',
                textContent: result.value,
                files: validFiles.length > 0 ? validFiles : undefined,
              },
            ]);
            break;
          }
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

  const handleFileChange = (selectedFiles: File[]) => {
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

  if (!flowId || isLoadingError) {
    return (
      <NotFoundPage
        title="Hmm... this chat isn't here"
        description="The chat you're looking for isn't here or maybe hasn't been published by the owner yet"
      />
    );
  }

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
      <div
        className="w-full px-4 max-w-3xl"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const selectedFiles = Array.from(e.dataTransfer.files);
          handleFileChange(selectedFiles);
        }}
      >
        <form onSubmit={onSubmit}>
          <div className="flex flex-col items-center justify-between pe-2 pt-0 rounded-3xl bg-muted transition-all ">
            <div
              className={cn('transition-all   overflow-hidden', {
                'px-4 py-3 w-full ': files.length > 0,
              })}
              style={{
                height: `${filesPreviewContainerSize.height}px`,
              }}
            >
              <div
                ref={filesPreviewContainerRef}
                className="flex items-start gap-3 flex-wrap"
              >
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
                  onChange={(e) => {
                    handleFileChange(
                      (e.target.files && Array.from(e.target.files)) || [],
                    );
                  }}
                  className="hidden"
                />
              </div>
              <ChatInput
                autoFocus
                minRows={1}
                maxRows={4}
                onPaste={(e) => {
                  const selectedFiles = Array.from(e.clipboardData.items)
                    .filter((item) => item.kind === 'file')
                    .map((item) => item.getAsFile())
                    .filter((item) => !isNil(item));
                  handleFileChange(selectedFiles);
                }}
                value={input}
                onKeyDown={onKeyDown}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message here..."
              />
              <Button
                disabled={(!input && files.length === 0) || isSending}
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
