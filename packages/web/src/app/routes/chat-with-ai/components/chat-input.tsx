import { t } from 'i18next';
import { ArrowUp, Paperclip, Square, X } from 'lucide-react';
import { useCallback, useState } from 'react';

import {
  FileUpload,
  FileUploadContent,
  FileUploadTrigger,
} from '@/components/prompt-kit/file-upload';
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from '@/components/prompt-kit/prompt-input';
import { Button } from '@/components/ui/button';

export function ChatInput({
  isStreaming,
  onSend,
  onStop,
  placeholder,
  leftActions,
  activeProject,
}: {
  isStreaming: boolean;
  onSend: (text: string, files?: File[]) => void;
  onStop?: () => void;
  placeholder?: string;
  leftActions?: React.ReactNode;
  activeProject?: { name: string; color: string; textColor: string };
}) {
  const [value, setValue] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const handleSubmit = useCallback(() => {
    if (!isStreaming && (value.trim() || attachedFiles.length > 0)) {
      onSend(
        value.trim(),
        attachedFiles.length > 0 ? attachedFiles : undefined,
      );
      setValue('');
      setAttachedFiles([]);
    }
  }, [isStreaming, value, attachedFiles, onSend]);

  const handleFilesAdded = useCallback((files: File[]) => {
    setAttachedFiles((prev) => [...prev, ...files]);
  }, []);

  const canSend = value.trim().length > 0 || attachedFiles.length > 0;

  return (
    <FileUpload onFilesAdded={handleFilesAdded} multiple>
      <PromptInput
        isLoading={isStreaming}
        value={value}
        onValueChange={setValue}
        onSubmit={handleSubmit}
        className="relative z-10 rounded-2xl border shadow-none transition-colors border-foreground/20 hover:border-foreground/40 focus-within:border-foreground/40"
        style={activeProject ? { borderColor: activeProject.color } : undefined}
      >
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3 pt-2">
            {attachedFiles.map((file) => (
              <div
                key={file.name}
                className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-1.5 text-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="max-w-[150px] truncate text-foreground/80">
                  {file.name}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setAttachedFiles((prev) =>
                      prev.filter((f) => f.name !== file.name),
                    )
                  }
                  className="text-muted-foreground hover:text-foreground rounded-full p-0.5 transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <PromptInputTextarea
          placeholder={placeholder ?? t('Tell me what you need...')}
          className="min-h-[44px] text-sm"
        />
        <PromptInputActions className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <PromptInputAction tooltip={t('Attach files')}>
              <FileUploadTrigger asChild>
                <div className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  <Paperclip className="size-4" />
                </div>
              </FileUploadTrigger>
            </PromptInputAction>
            {leftActions}
          </div>
          {isStreaming && onStop ? (
            <PromptInputAction tooltip={t('Stop')}>
              <Button
                variant="default"
                size="icon"
                className="h-7 w-7 rounded-full"
                onClick={onStop}
              >
                <Square className="size-3 fill-current" />
              </Button>
            </PromptInputAction>
          ) : (
            <PromptInputAction tooltip={t('Send message')}>
              <Button
                variant="default"
                size="icon"
                className="h-7 w-7 rounded-full"
                onClick={handleSubmit}
                disabled={!canSend || isStreaming}
              >
                <ArrowUp className="size-4" />
              </Button>
            </PromptInputAction>
          )}
        </PromptInputActions>
      </PromptInput>

      <FileUploadContent>
        <div className="flex min-h-[200px] w-full items-center justify-center backdrop-blur-sm">
          <div className="bg-background/90 m-4 w-full max-w-md rounded-lg border p-8 shadow-lg">
            <div className="mb-4 flex justify-center">
              <Paperclip className="text-muted-foreground size-8" />
            </div>
            <h3 className="mb-2 text-center text-base font-medium">
              {t('Drop files here')}
            </h3>
            <p className="text-muted-foreground text-center text-sm">
              {t('Release to add files to your message')}
            </p>
          </div>
        </div>
      </FileUploadContent>
    </FileUpload>
  );
}
