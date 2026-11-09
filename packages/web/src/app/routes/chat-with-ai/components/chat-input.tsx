import { isNil } from '@activepieces/core-utils';
import { t } from 'i18next';
import { ArrowUp, Mic, Paperclip, Square, X } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { KbdHint } from '@/components/custom/kbd-hint';
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
import { MOTION } from '@/features/workspace/lib/chat-layout';
import { cn } from '@/lib/utils';

export function ChatInput({
  isStreaming,
  replying = isStreaming,
  replyStopped = false,
  holdQueued = false,
  onSend,
  onStop,
  onInputChange,
  placeholder,
  leftActions,
  rightActions,
  minimalUntilFocus = false,
  onFocusChange,
  sendBlockedReason,
  fill,
  onFillApplied,
  autoFocus,
}: {
  isStreaming: boolean;
  replying?: boolean;
  replyStopped?: boolean;
  holdQueued?: boolean;
  onSend: (text: string, files?: File[]) => void;
  onStop?: () => void;
  onInputChange?: (hasInput: boolean) => void;
  placeholder?: string;
  leftActions?: React.ReactNode;
  rightActions?: React.ReactNode;
  minimalUntilFocus?: boolean;
  onFocusChange?: (focused: boolean) => void;
  sendBlockedReason?: string;
  fill?: ComposerFill | null;
  onFillApplied?: () => void;
  autoFocus?: boolean;
}) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const reduced = useReducedMotion();
  const [interimText, setInterimText] = useState('');
  const [queued, setQueued] = useState<QueuedMessage | null>(null);
  const [wasReplying, setWasReplying] = useState(replying);
  const lastHasInputRef = useRef(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const caretToEndRef = useRef(false);

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

  // A picked suggestion lands in the composer for editing instead of sending.
  const appliedFillRef = useRef<number | null>(null);
  useEffect(() => {
    if (isNil(fill) || appliedFillRef.current === fill.id) return;
    appliedFillRef.current = fill.id;
    caretToEndRef.current = true;
    handleValueChange(fill.text);
    onFillApplied?.();
  }, [fill, handleValueChange, onFillApplied]);

  useEffect(() => {
    if (!caretToEndRef.current) return;
    caretToEndRef.current = false;
    const textarea = shellRef.current?.querySelector('textarea');
    textarea?.focus();
    textarea?.setSelectionRange(value.length, value.length);
  }, [value]);

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

  const restoreQueued = (item: QueuedMessage) => {
    const joined = [item.text, value].filter((part) => part.length > 0);
    handleValueChange(joined.join('\n'));
    setAttachedFiles((prev) => [...item.files, ...prev]);
  };

  if (wasReplying !== replying) {
    setWasReplying(replying);
    if (!replying && !isNil(queued) && (replyStopped || holdQueued)) {
      setQueued(null);
      restoreQueued(queued);
    }
  }

  const sendQueuedRef = useRef(onSend);
  sendQueuedRef.current = onSend;
  const readyToSend = !replying && !replyStopped && !holdQueued;
  useEffect(() => {
    if (!readyToSend || isNil(queued)) return;
    setQueued(null);
    sendQueuedRef.current(
      queued.text,
      queued.files.length > 0 ? queued.files : undefined,
    );
  }, [readyToSend, queued]);

  const cancelQueued = () => {
    if (isNil(queued)) return;
    setQueued(null);
    restoreQueued(queued);
  };

  const handleSubmit = useCallback(() => {
    const text = value.trim();
    if (!isNil(sendBlockedReason) || (!text && attachedFiles.length === 0)) {
      return;
    }
    if (isStreaming) {
      if (!isNil(queued)) return;
      setQueued({ text, files: attachedFiles });
    } else {
      onSend(text, attachedFiles.length > 0 ? attachedFiles : undefined);
    }
    handleValueChange('');
    setAttachedFiles([]);
  }, [
    isStreaming,
    value,
    attachedFiles,
    onSend,
    sendBlockedReason,
    queued,
    handleValueChange,
  ]);

  const handleFilesAdded = useCallback((files: File[]) => {
    setAttachedFiles((prev) => [...prev, ...files]);
  }, []);

  const canSend = value.trim().length > 0 || attachedFiles.length > 0;

  const showToolbar = !minimalUntilFocus || focused || value.trim().length > 0;

  return (
    <div ref={shellRef} className="contents">
      {!isNil(queued) && (
        <div
          role="status"
          className="flex flex-col items-end gap-0.5 px-3 pt-2"
        >
          <p className="line-clamp-3 max-w-[85%] whitespace-pre-wrap break-words rounded-xl bg-gray-3 px-2.5 py-1 text-sm text-gray-11">
            {queued.text}
          </p>
          <div className="flex items-center gap-0.5 text-xs text-gray-11">
            <span className="px-1">{t('Sends when the reply ends.')}</span>
            <Button variant="ghost" size="xs" onClick={cancelQueued}>
              {t('Cancel')}
            </Button>
          </div>
        </div>
      )}
      <FileUpload onFilesAdded={handleFilesAdded} multiple>
        <PromptInput
          isLoading={isStreaming}
          value={value}
          onValueChange={handleValueChange}
          onSubmit={handleSubmit}
          className="border-0 rounded-none shadow-none"
        >
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 px-3">
              <div className="flex flex-wrap gap-2 pt-2 pb-0.5">
                {attachedFiles.map((file) => (
                  <motion.div
                    key={file.name}
                    className="flex items-center gap-2 rounded-xl border bg-gray-3/50 px-3 py-1.5 text-sm"
                    onClick={(e) => e.stopPropagation()}
                    initial={{ opacity: 0, scale: reduced ? 1 : 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: MOTION.base, ease: MOTION.easeOut }}
                  >
                    <Paperclip className="size-3.5 shrink-0 text-gray-11" />
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
                      className="text-gray-11 hover:text-gray-12 rounded-full p-0.5 transition-colors duration-(--dur-micro) ease-[ease]"
                    >
                      <X className="size-3.5" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          {isRecording ? (
            <div className="min-h-[44px] px-3 py-2 text-base sm:text-sm text-gray-12 whitespace-pre-wrap break-words">
              {interimText || (
                <span className="text-gray-11">{t('Listening...')}</span>
              )}
            </div>
          ) : (
            <PromptInputTextarea
              data-chat-composer=""
              autoFocus={autoFocus ?? !minimalUntilFocus}
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
            <PromptInputActions className="flex min-w-0 items-center justify-between">
              <div className="flex shrink-0 items-center gap-1">
                <PromptInputAction tooltip={t('Attach files')}>
                  <FileUploadTrigger asChild>
                    <div className="flex h-9 w-9 shrink-0 sm:h-7 sm:w-7 cursor-pointer items-center justify-center rounded-full text-gray-11 transition-colors duration-(--dur-micro) ease-[ease] hover:bg-gray-3 hover:text-gray-12">
                      <Paperclip className="size-4" />
                    </div>
                  </FileUploadTrigger>
                </PromptInputAction>
                {leftActions}
              </div>
              <div className="flex min-w-0 items-center justify-end gap-1">
                {rightActions}
                {isStreaming && onStop ? (
                  <PromptInputAction
                    tooltip={
                      <span className="flex items-center gap-2">
                        {t('Stop')}
                        <KbdHint>Esc</KbdHint>
                      </span>
                    }
                  >
                    <Button
                      variant="default"
                      size="icon"
                      className="shrink-0 sm:h-7 sm:w-7 rounded-full"
                      aria-label={t('Stop')}
                      onClick={onStop}
                    >
                      <Square className="size-3 fill-current" />
                    </Button>
                  </PromptInputAction>
                ) : isRecording ? (
                  <PromptInputAction tooltip={t('Stop recording')}>
                    <Button
                      variant="outline"
                      className="h-7 shrink-0 gap-1.5 rounded-full px-3"
                      onClick={stopRecording}
                    >
                      <VoiceWaveformBars />
                      <span className="text-xs font-medium">{t('Stop')}</span>
                    </Button>
                  </PromptInputAction>
                ) : canSend ? (
                  <PromptInputAction
                    tooltip={sendBlockedReason ?? t('Send message')}
                  >
                    <Button
                      variant="default"
                      size="icon"
                      className="shrink-0 sm:h-7 sm:w-7 rounded-full"
                      onClick={handleSubmit}
                      disabled={!isNil(sendBlockedReason) || !isNil(queued)}
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                  </PromptInputAction>
                ) : isVoiceSupported ? (
                  <PromptInputAction tooltip={t('Voice input')}>
                    <button
                      type="button"
                      onClick={startRecording}
                      className="flex h-9 w-9 shrink-0 sm:h-7 sm:w-7 cursor-pointer items-center justify-center rounded-full text-gray-11 transition-colors duration-(--dur-micro) ease-[ease] hover:bg-gray-3 hover:text-gray-12"
                    >
                      <Mic className="size-4" />
                    </button>
                  </PromptInputAction>
                ) : (
                  <PromptInputAction tooltip={t('Send message')}>
                    <Button
                      variant="default"
                      size="icon"
                      className="shrink-0 sm:h-7 sm:w-7 rounded-full"
                      onClick={handleSubmit}
                      disabled={true}
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                  </PromptInputAction>
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
    </div>
  );
}

export type ComposerFill = { text: string; id: number };

type QueuedMessage = { text: string; files: File[] };
