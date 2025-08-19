import { ArrowUpIcon, Paperclip } from 'lucide-react';
import * as React from 'react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { FileInputPreview } from '@/components/ui/chat/chat-input/file-input-preview';
import { ResizableTextareaProps, Textarea } from '@/components/ui/textarea';
import { cn, useElementSize } from '@/lib/utils';
import { isNil } from '@activepieces/shared';

export interface ChatMessage {
  textContent: string;
  files: File[];
}

interface ChatInputProps extends Omit<ResizableTextareaProps, 'onSubmit'> {
  onSendMessage: (message: ChatMessage) => void;
  disabled?: boolean;
  placeholder?: string;
}

const ChatInput = React.forwardRef<HTMLTextAreaElement, ChatInputProps>(
  (
    {
      className,
      onSendMessage,
      disabled = false,
      placeholder = 'Type your message here...',
      ...props
    },
    ref,
  ) => {
    const [input, setInput] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const filesPreviewContainerRef = useRef<HTMLDivElement | null>(null);
    const filesPreviewContainerSize = useElementSize(filesPreviewContainerRef);

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

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if ((!input && files.length === 0) || disabled) return;

      onSendMessage({
        textContent: input,
        files: files,
      });

      // Clear input fields
      setInput('');
      setFiles([]);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!disabled && (input || files.length > 0)) {
          handleSubmit(e as unknown as React.FormEvent);
        }
      }
    };

    return (
      <div
        className="w-full"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const selectedFiles = Array.from(e.dataTransfer.files);
          handleFileChange(selectedFiles);
        }}
      >
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="rounded-lg border shadow-sm">
            {files.length > 0 && (
              <div
                className="px-4 py-3 w-full transition-all overflow-hidden"
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
            )}
            <Textarea
              autoComplete="off"
              ref={ref}
              autoFocus
              minRows={1}
              maxRows={6}
              name="message"
              className={cn(
                'px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 w-full resize-none border-0 shadow-none focus-visible:ring-0',
                className,
              )}
              value={input}
              onKeyDown={handleKeyDown}
              onChange={(e) => setInput(e.target.value)}
              onPaste={(e) => {
                const selectedFiles = Array.from(e.clipboardData.items)
                  .filter((item) => item.kind === 'file')
                  .map((item) => item.getAsFile())
                  .filter((item) => !isNil(item));
                handleFileChange(selectedFiles);
              }}
              placeholder={placeholder}
              disabled={disabled}
              {...props}
            />
            <div className="flex justify-end items-center gap-4 px-4 py-2">
              <label htmlFor="file-upload" className="cursor-pointer">
                <Paperclip className="w-4 h-4 text-muted-foreground hover:text-foreground" />
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
              <Button
                disabled={(!input && files.length === 0) || disabled}
                type="submit"
                size="icon"
                variant="default"
              >
                <ArrowUpIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </form>
      </div>
    );
  },
);

ChatInput.displayName = 'ChatInput';

export { ChatInput };
