import {
  ArrowUp02Icon,
  Attachment01Icon,
  Cancel01Icon,
  Mic01Icon,
  StopIcon,
} from '@hugeicons/core-free-icons';
import { t } from 'i18next';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
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
import { VoiceWaveformBars } from '@/features/chat/components/voice-waveform';
import { useVoiceInput } from '@/features/chat/lib/use-voice-input';
import { cn } from '@/lib/utils';

export function ChatInput({
  isStreaming,
  onSend,
  onStop,
  onInputChange,
  placeholder,
  leftActions,
  rightActions,
  minimalUntilFocus = false,
  onFocusChange,
}: {
  isStreaming: boolean;
  onSend: (text: string, files?: File[]) => void;
  onStop?: () => void;
  onInputChange?: (hasInput: boolean) => void;
  placeholder?: string;
  leftActions?: React.ReactNode;
  rightActions?: React.ReactNode;
  minimalUntilFocus?: boolean;
  onFocusChange?: (focused: boolean) => void;
}) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [interimText, setInterimText] = useState('');
  const lastHasInputRef = useRef(false);

  const handleValueChange = useCallback(
    (v: string) => {
      setValue(v);
      const hasInput = v.trim().length > 0;
      if (hasInput !== lastHasInputRef.current) {
        lastHasInputRef.current = hasInput;
        onInputChange?.(hasInput);
      }
    },
    [onInputChange],
  );

  const handleTranscript = useCallback((text: string) => {
    setValue((prev) => {
      const separator = prev.length > 0 ? ' ' : '';
      return prev + separator + text;
    });
    setInterimText('');
  }, []);

  const handleVoiceError = useCallback((messageKey: string) => {
    toast.error(t(messageKey));
    setInterimText('');
  }, []);

  const {
    isRecording,
    isSupported: isVoiceSupported,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useVoiceInput({
    onTranscript: handleTranscript,
    onInterim: setInterimText,
    onError: handleVoiceError,
  });

  useEffect(() => {
    if (!isRecording) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cancelRecording();
        setInterimText('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, cancelRecording]);

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

  const showToolbar = !minimalUntilFocus || focused || value.trim().length > 0;

  return (
    <FileUpload onFilesAdded={handleFilesAdded} multiple>
      <PromptInput
        isLoading={isStreaming}
        value={value}
        onValueChange={handleValueChange}
        onSubmit={handleSubmit}
        className="border-0 rounded-none shadow-none"
      >
        <AnimatePresence>
          {attachedFiles.length > 0 && (
            <motion.div
              className="flex flex-wrap gap-2 px-3 overflow-hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <div className="flex flex-wrap gap-2 pt-2 pb-0.5">
                {attachedFiles.map((file) => (
                  <motion.div
                    key={file.name}
                    className="flex items-center gap-2 rounded-lg border bg-gray-3/50 px-3 py-1.5 text-sm"
                    onClick={(e) => e.stopPropagation()}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.15 }}
                  >
                    <HugeiconsIcon
                      icon={Attachment01Icon}
                      className="size-3.5 shrink-0 text-gray-11"
                    />
                    <span className="max-w-[150px] truncate text-gray-12/80">
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setAttachedFiles((prev) =>
                          prev.filter((f) => f.name !== file.name),
                        )
                      }
                      className="text-gray-11 hover:text-gray-12 rounded-full p-0.5 transition-colors"
                    >
                      <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {isRecording ? (
          <div className="min-h-[44px] px-3 py-2 text-base sm:text-sm text-gray-12 whitespace-pre-wrap break-words">
            {interimText || (
              <span className="text-gray-11">{t('Listening...')}</span>
            )}
          </div>
        ) : (
          <PromptInputTextarea
            autoFocus={!minimalUntilFocus}
            placeholder={placeholder ?? t('Tell me what you need...')}
            className={cn(
              'text-base sm:text-sm',
              showToolbar ? 'min-h-[44px]' : 'min-h-[24px]',
            )}
            onFocus={() => {
              setFocused(true);
              onFocusChange?.(true);
            }}
            onBlur={() => {
              setFocused(false);
              onFocusChange?.(false);
            }}
          />
        )}
        {showToolbar && (
          <PromptInputActions className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <PromptInputAction tooltip={t('Attach files')}>
                <FileUploadTrigger asChild>
                  <div className="flex h-9 w-9 sm:h-7 sm:w-7 cursor-pointer items-center justify-center rounded-full text-gray-11 transition-colors hover:bg-gray-3 hover:text-gray-12">
                    <HugeiconsIcon icon={Attachment01Icon} className="size-4" />
                  </div>
                </FileUploadTrigger>
              </PromptInputAction>
              {leftActions}
            </div>
            <div className="flex items-center gap-1">
              {rightActions}
              {isStreaming && onStop ? (
                <PromptInputAction tooltip={t('Stop')}>
                  <Button
                    variant="default"
                    size="icon"
                    className="h-9 w-9 sm:h-7 sm:w-7 rounded-full"
                    onClick={onStop}
                  >
                    <HugeiconsIcon
                      icon={StopIcon}
                      className="size-3 fill-current"
                    />
                  </Button>
                </PromptInputAction>
              ) : isRecording ? (
                <PromptInputAction tooltip={t('Stop recording')}>
                  <Button
                    variant="outline"
                    className="h-7 gap-1.5 rounded-full px-3"
                    onClick={stopRecording}
                  >
                    <VoiceWaveformBars />
                    <span className="text-xs font-medium">{t('Stop')}</span>
                  </Button>
                </PromptInputAction>
              ) : canSend ? (
                <PromptInputAction tooltip={t('Send message')}>
                  <Button
                    variant="default"
                    size="icon"
                    className="h-9 w-9 sm:h-7 sm:w-7 rounded-full"
                    onClick={handleSubmit}
                    disabled={isStreaming}
                  >
                    <HugeiconsIcon icon={ArrowUp02Icon} className="size-4" />
                  </Button>
                </PromptInputAction>
              ) : isVoiceSupported ? (
                <PromptInputAction tooltip={t('Voice input')}>
                  <button
                    type="button"
                    onClick={startRecording}
                    className="flex h-9 w-9 sm:h-7 sm:w-7 cursor-pointer items-center justify-center rounded-full text-gray-11 transition-colors hover:bg-gray-3 hover:text-gray-12"
                  >
                    <HugeiconsIcon icon={Mic01Icon} className="size-4" />
                  </button>
                </PromptInputAction>
              ) : (
                <PromptInputAction tooltip={t('Send message')}>
                  <Button
                    variant="default"
                    size="icon"
                    className="h-9 w-9 sm:h-7 sm:w-7 rounded-full"
                    onClick={handleSubmit}
                    disabled={true}
                  >
                    <HugeiconsIcon icon={ArrowUp02Icon} className="size-4" />
                  </Button>
                </PromptInputAction>
              )}
            </div>
          </PromptInputActions>
        )}
      </PromptInput>

      <FileUploadContent>
        <div className="flex min-h-[200px] w-full items-center justify-center backdrop-blur-sm">
          <div className="bg-gray-1/90 m-4 w-full max-w-md rounded-lg border p-8 shadow-lg">
            <div className="mb-4 flex justify-center">
              <HugeiconsIcon
                icon={Attachment01Icon}
                className="text-gray-11 size-8"
              />
            </div>
            <h3 className="mb-2 text-center text-base font-medium">
              {t('Drop files here')}
            </h3>
            <p className="text-gray-11 text-center text-sm">
              {t('Release to add files to your message')}
            </p>
          </div>
        </div>
      </FileUploadContent>
    </FileUpload>
  );
}
