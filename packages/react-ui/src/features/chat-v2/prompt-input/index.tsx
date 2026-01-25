import { ArrowUp, Paperclip } from 'lucide-react';
import React, { useState, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { chatHooks, uploadFile } from '@/features/chat-v2/lib/chat-hooks';
import { useChatSessionStore } from '@/features/chat-v2/store';
import { cn } from '@/lib/utils';
import { isNil } from '@activepieces/shared';

import { FileInputPreview, UploadingFile } from './file-input-preview';
import { AIModelSelector } from './model-selector';

interface PromptInputProps {
  placeholder?: string;
}

export const PromptInput = ({ placeholder }: PromptInputProps) => {
  const [message, setMessage] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { session, setSession } = useChatSessionStore();
  const { mutate: sendMessage, isPending: isStreaming } =
    chatHooks.useSendMessage(setSession);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setMessage(newValue);
  };

  const handleFileChange = (selectedFiles: File[]) => {
    if (selectedFiles.length > 0) {
      for (const file of selectedFiles) {
        const id = crypto.randomUUID();
        const newUploadingFile: UploadingFile = {
          id,
          file,
          status: 'uploading',
        };

        setUploadingFiles((prev) => [...prev, newUploadingFile]);

        uploadFile(file)
          .then((url) => {
            setUploadingFiles((prev) =>
              prev.map((f) =>
                f.id === id ? { ...f, status: 'completed', url } : f,
              ),
            );
          })
          .catch(() => {
            setUploadingFiles((prev) =>
              prev.map((f) => (f.id === id ? { ...f, status: 'error' } : f)),
            );
          });
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (id: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const isUploadingFiles = uploadingFiles.some((f) => f.status === 'uploading');
  const hasCompletedFiles = uploadingFiles.some(
    (f) => f.status === 'completed',
  );

  const handleSend = () => {
    if (
      (message.trim() || hasCompletedFiles) &&
      !isStreaming &&
      !isUploadingFiles
    ) {
      sendMessage({
        message,
        uploadingFiles: uploadingFiles.filter((f) => f.status === 'completed'),
        currentSession: isNil(session) ? null : session,
      });
      setMessage('');
      setUploadingFiles([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedFiles = Array.from(e.clipboardData.items)
      .filter((item) => item.kind === 'file')
      .map((item) => item.getAsFile())
      .filter((file): file is File => !isNil(file));
    if (pastedFiles.length > 0) {
      handleFileChange(pastedFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFileChange(droppedFiles);
  };

  const canSend =
    (message.trim() || hasCompletedFiles) && !isStreaming && !isUploadingFiles;

  return (
    <div
      className="flex flex-col w-full"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="relative">
        <div
          className={`min-h-[155px] w-full p-px rounded-lg border border-input-border`}
        >
          <div
            className={cn(
              'relative rounded-md bg-background w-full h-full flex flex-col justify-between',
            )}
          >
            {uploadingFiles.length > 0 && (
              <div className="px-3 pt-3 pb-1">
                <div className="flex items-start gap-3 flex-wrap">
                  {uploadingFiles.map((uploadingFile) => (
                    <FileInputPreview
                      key={uploadingFile.id}
                      uploadingFile={uploadingFile}
                      onRemove={removeFile}
                    />
                  ))}
                </div>
              </div>
            )}
            <div className="p-2 pb-0 grow flex flex-col">
              <Textarea
                ref={internalRef}
                className="w-full bg-background border-none resize-none overflow-hidden grow"
                placeholder={placeholder}
                minRows={uploadingFiles.length > 0 ? 3 : 10}
                maxRows={4}
                value={message}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
              />
            </div>
            <div className="flex justify-between mx-2 mb-3">
              <div className="flex justify-start items-center gap-x-1">
                <label
                  htmlFor="chat-file-upload"
                  className="cursor-pointer p-2 hover:bg-muted rounded-md transition-colors"
                >
                  <Paperclip className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </label>
                <input
                  ref={fileInputRef}
                  id="chat-file-upload"
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
              <div className="flex justify-center items-center gap-x-2">
                <AIModelSelector />
                <Button
                  variant="default"
                  size="icon"
                  onClick={handleSend}
                  loading={isStreaming}
                  disabled={!canSend}
                >
                  <ArrowUp className="w-5 h-5 stroke-[3px]" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
