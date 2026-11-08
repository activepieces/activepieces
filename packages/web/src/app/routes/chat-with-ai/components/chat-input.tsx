import { isNil } from '@activepieces/core-utils';
import { t } from 'i18next';
import { ArrowUp, Mic, Paperclip, Square } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

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
import {
  useVoiceInput,
  VoiceInputError,
} from '@/features/chat/lib/use-voice-input';
import { cn } from '@/lib/utils';

import { ChatFileChip } from './chat-ui/chat-file-chip';
import { previewUtils } from './previews/preview-utils';

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
  sendBlockedReason,
  showSendWhenEmpty = false,
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
  sendBlockedReason?: string;
  showSendWhenEmpty?: boolean;
}) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
  const attachmentsRef = useRef<ComposerAttachment[]>([]);
  attachmentsRef.current = attachments;
  const nextAttachmentIdRef = useRef(0);
  const attachedFiles = attachments.map((attachment) => attachment.file);
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

  const handleVoiceError = useCallback((error: VoiceInputError) => {
    toast.error(voiceErrorMessage(error));
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

  useEffect(
    () => () => {
      attachmentsRef.current.forEach(revokePreview);
    },
    [],
  );

  const removeAttachment = useCallback((id: number) => {
    attachmentsRef.current.filter((a) => a.id === id).forEach(revokePreview);
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleSubmit = useCallback(() => {
    if (
      isNil(sendBlockedReason) &&
      !isStreaming &&
      (value.trim() || attachedFiles.length > 0)
    ) {
      onSend(
        value.trim(),
        attachedFiles.length > 0 ? attachedFiles : undefined,
      );
      setValue('');
      attachments.forEach(revokePreview);
      setAttachments([]);
    }
  }, [
    isStreaming,
    value,
    attachedFiles,
    attachments,
    onSend,
    sendBlockedReason,
  ]);

  const handleFilesAdded = useCallback((files: File[]) => {
    const added = files.map((file) => {
      nextAttachmentIdRef.current += 1;
      return {
        id: nextAttachmentIdRef.current,
        file,
        previewUrl: file.type.startsWith('image/')
          ? URL.createObjectURL(file)
          : undefined,
      };
    });
    setAttachments((prev) => [...prev, ...added]);
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
          {attachments.length > 0 && (
            <motion.div
              className="flex flex-wrap gap-2 px-3 overflow-hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <div className="flex flex-wrap gap-2 pt-2 pb-0.5">
                {attachments.map((attachment) => (
                  <motion.div
                    key={attachment.id}
                    className="max-w-full"
                    onClick={(e) => e.stopPropagation()}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.15 }}
                  >
                    <ChatFileChip
                      name={attachment.file.name}
                      type={
                        previewUtils.readableFileType({
                          mediaType: attachment.file.type,
                          fileName: attachment.file.name,
                        }) ?? t('File')
                      }
                      size={attachment.file.size}
                      thumbnailUrl={attachment.previewUrl}
                      onRemove={() => removeAttachment(attachment.id)}
                    />
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
                  <button
                    type="button"
                    aria-label={t('Attach files')}
                    className="flex h-9 w-9 sm:h-7 sm:w-7 cursor-pointer items-center justify-center rounded-full text-gray-11 outline-none transition-colors hover:bg-gray-3 hover:text-gray-12 focus-visible:ring-2 focus-visible:ring-gray-8"
                  >
                    <Paperclip className="size-4" />
                  </button>
                </FileUploadTrigger>
              </PromptInputAction>
              {leftActions}
            </div>
            <div className="flex items-center gap-1">
              {rightActions}
              {isStreaming && onStop ? (
                <PromptInputAction tooltip={t('Stop')}>
                  <Button
                    size="xs"
                    className="h-7 gap-1.5 rounded-full bg-gray-12 px-3 text-xs font-medium text-gray-1 hover:bg-gray-12/90"
                    onClick={onStop}
                  >
                    <Square className="size-2.5 fill-current" />
                    {t('Stop')}
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
              ) : (
                <>
                  {isVoiceSupported && (
                    <PromptInputAction tooltip={t('Voice input')}>
                      <button
                        type="button"
                        aria-label={t('Voice input')}
                        onClick={startRecording}
                        className="flex h-9 w-9 sm:h-7 sm:w-7 cursor-pointer items-center justify-center rounded-full text-gray-11 transition-colors hover:bg-gray-3 hover:text-gray-12"
                      >
                        <Mic className="size-4" />
                      </button>
                    </PromptInputAction>
                  )}
                  {(canSend || showSendWhenEmpty || !isVoiceSupported) && (
                    <PromptInputAction
                      tooltip={sendBlockedReason ?? t('Send message')}
                    >
                      <Button
                        variant="default"
                        size="icon"
                        aria-label={t('Send message')}
                        className="sm:h-7 sm:w-7 rounded-full"
                        onClick={handleSubmit}
                        disabled={
                          !canSend || isStreaming || !isNil(sendBlockedReason)
                        }
                      >
                        <ArrowUp className="size-4" />
                      </Button>
                    </PromptInputAction>
                  )}
                </>
              )}
            </div>
          </PromptInputActions>
        )}
      </PromptInput>

      <FileUploadContent>
        <div className="flex min-h-[200px] w-full items-center justify-center backdrop-blur-sm">
          <div className="bg-gray-1/90 m-4 w-full max-w-md rounded-xl border p-8 shadow-lg">
            <div className="mb-4 flex justify-center">
              <Paperclip className="text-gray-11 size-8" />
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

function voiceErrorMessage(error: VoiceInputError): string {
  switch (error) {
    case 'unsupported':
      return t('Voice input is not available in this browser.');
    case 'not-allowed':
      return t('Could not access microphone. Check browser permissions.');
    case 'network':
      return t('Voice input failed due to a network error.');
    case 'audio-capture':
      return t('No microphone detected. Check your audio device.');
    case 'unknown':
      return t('Voice input encountered an error.');
  }
}

function revokePreview(attachment: ComposerAttachment) {
  if (attachment.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
}

type ComposerAttachment = {
  id: number;
  file: File;
  previewUrl?: string;
};
