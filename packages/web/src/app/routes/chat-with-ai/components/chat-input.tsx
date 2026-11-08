import { isNil } from '@activepieces/core-utils';
import { t } from 'i18next';
import {
  AlertTriangle,
  ArrowUp,
  Mic,
  Paperclip,
  Square,
  X,
} from 'lucide-react';
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
import { useVoiceInput } from '@/features/chat/lib/use-voice-input';
import { cn } from '@/lib/utils';

import { composerStore } from '../lib/composer-store';
import { composerUtils } from '../lib/composer-utils';

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
  draftKey,
  banner,
  frameClassName,
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
  draftKey?: string;
  banner?: React.ReactNode;
  frameClassName?: string;
}) {
  const [value, setValue] = useState(() =>
    isNil(draftKey) ? '' : composerUtils.readDraft(draftKey),
  );
  const [focused, setFocused] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [interimText, setInterimText] = useState('');
  const [queued, setQueued] = useState<QueuedMessage | null>(null);
  const [flaggedText, setFlaggedText] = useState<string | null>(null);
  const lastHasInputRef = useRef(false);
  const valueRef = useRef(value);
  valueRef.current = value;
  const queuedRef = useRef(queued);
  queuedRef.current = queued;
  const draftKeyRef = useRef(draftKey);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sentFromNewChatRef = useRef(false);
  const wasReplyingRef = useRef(replying);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const focusComposer = useCallback(
    () => frameRef.current?.querySelector('textarea')?.focus(),
    [],
  );

  const reportInput = useCallback(
    (v: string) => {
      const hasInput = v.trim().length > 0;
      if (hasInput !== lastHasInputRef.current) {
        lastHasInputRef.current = hasInput;
        onInputChange?.(hasInput);
      }
    },
    [onInputChange],
  );

  const saveDraftSoon = useCallback((text: string) => {
    const key = draftKeyRef.current;
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    if (isNil(key)) return;
    draftTimerRef.current = setTimeout(() => {
      draftTimerRef.current = null;
      composerUtils.writeDraft({ key, text });
    }, DRAFT_DEBOUNCE_MS);
  }, []);

  const replaceValue = useCallback(
    (v: string) => {
      setValue(v);
      reportInput(v);
      saveDraftSoon(v);
    },
    [reportInput, saveDraftSoon],
  );

  const handleValueChange = useCallback(
    (v: string) => {
      replaceValue(v);
      setFlaggedText((flagged) =>
        flagged !== null && composerUtils.findSecrets(v).length > 0
          ? flagged
          : null,
      );
    },
    [replaceValue],
  );

  useEffect(() => {
    const previous = draftKeyRef.current;
    if (previous === draftKey) return;
    draftKeyRef.current = draftKey;
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = null;
    const adopt =
      sentFromNewChatRef.current &&
      composerUtils.isNewChatKey(previous) &&
      !isNil(draftKey);
    sentFromNewChatRef.current = false;
    if (adopt) {
      if (!isNil(previous)) {
        composerUtils.writeDraft({ key: previous, text: '' });
      }
      if (!isNil(draftKey)) {
        composerUtils.writeDraft({ key: draftKey, text: valueRef.current });
      }
      return;
    }
    if (!isNil(previous)) {
      composerUtils.writeDraft({
        key: previous,
        text: composerUtils.joinQueued({
          queued: queuedRef.current?.text ?? '',
          next: valueRef.current,
        }),
      });
    }
    setQueued(null);
    setFlaggedText(null);
    setAttachedFiles([]);
    const next = isNil(draftKey) ? '' : composerUtils.readDraft(draftKey);
    setValue(next);
    reportInput(next);
  }, [draftKey, reportInput]);

  useEffect(
    () => () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    },
    [],
  );

  const restoreToComposer = useCallback(
    (item: QueuedMessage) => {
      replaceValue(
        composerUtils.joinQueued({ queued: item.text, next: valueRef.current }),
      );
      setAttachedFiles((prev) => [...item.files, ...prev]);
      focusComposer();
    },
    [replaceValue, focusComposer],
  );

  useEffect(() => {
    const ended = wasReplyingRef.current && !replying;
    wasReplyingRef.current = replying;
    const item = queuedRef.current;
    if (!ended || isNil(item)) return;
    setQueued(null);
    if (replyStopped || holdQueued) {
      restoreToComposer(item);
      return;
    }
    onSend(item.text, item.files.length > 0 ? item.files : undefined);
  }, [replying, replyStopped, holdQueued, onSend, restoreToComposer]);

  const pendingFill = composerStore.usePendingFill(draftKey);
  useEffect(() => {
    if (isNil(pendingFill) || isNil(draftKey)) return;
    const item = composerStore.take(draftKey);
    if (isNil(item)) return;
    const text =
      item.mode === 'restore'
        ? composerUtils.joinQueued({
            queued: item.text,
            next: valueRef.current,
          })
        : item.text;
    replaceValue(text);
    setFlaggedText(null);
    if (item.files.length > 0) {
      setAttachedFiles((prev) => [...item.files, ...prev]);
    }
    requestAnimationFrame(() => {
      const textarea = frameRef.current?.querySelector('textarea');
      textarea?.focus();
      textarea?.setSelectionRange(text.length, text.length);
    });
  }, [pendingFill, draftKey, replaceValue]);

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

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isRecording, cancelRecording]);

  const submit = useCallback(
    ({ force }: { force: boolean }) => {
      const text = value.trim();
      if (!isNil(sendBlockedReason) || (!text && attachedFiles.length === 0)) {
        return;
      }
      if (
        !force &&
        flaggedText !== text &&
        composerUtils.findSecrets(text).length > 0
      ) {
        setFlaggedText(text);
        return;
      }
      setFlaggedText(null);
      if (isStreaming) {
        setQueued((prev) => ({
          text: composerUtils.joinQueued({
            queued: prev?.text ?? '',
            next: text,
          }),
          files: [...(prev?.files ?? []), ...attachedFiles],
        }));
      } else {
        sentFromNewChatRef.current = composerUtils.isNewChatKey(
          draftKeyRef.current,
        );
        onSend(text, attachedFiles.length > 0 ? attachedFiles : undefined);
      }
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
      draftTimerRef.current = null;
      if (!isNil(draftKeyRef.current)) {
        composerUtils.writeDraft({ key: draftKeyRef.current, text: '' });
      }
      setValue('');
      reportInput('');
      setAttachedFiles([]);
    },
    [
      value,
      attachedFiles,
      sendBlockedReason,
      flaggedText,
      isStreaming,
      onSend,
      reportInput,
    ],
  );

  const handleSubmit = useCallback(() => submit({ force: false }), [submit]);

  const sendNow = () => {
    const item = queuedRef.current;
    if (isNil(item)) return;
    setQueued(null);
    onStop?.();
    onSend(item.text, item.files.length > 0 ? item.files : undefined);
    focusComposer();
  };

  const unqueue = () => {
    const item = queuedRef.current;
    if (isNil(item)) return;
    setQueued(null);
    restoreToComposer(item);
  };

  const removeSecret = () => {
    setFlaggedText(null);
    replaceValue(composerUtils.removeSecrets(value));
    focusComposer();
  };

  const handleFilesAdded = useCallback((files: File[]) => {
    setAttachedFiles((prev) => [...prev, ...files]);
  }, []);

  const canSend = value.trim().length > 0 || attachedFiles.length > 0;

  const showToolbar = !minimalUntilFocus || focused || value.trim().length > 0;

  const notice: Notice = !isNil(flaggedText)
    ? 'secret'
    : !isNil(queued)
    ? 'queued'
    : !isNil(banner)
    ? 'banner'
    : 'none';

  return (
    <div className="flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {notice === 'queued' && !isNil(queued) && (
          <QueuedBubble
            key="queued"
            message={queued}
            onSendNow={sendNow}
            onRemove={unqueue}
          />
        )}
      </AnimatePresence>
      <div ref={frameRef} className={frameClassName}>
        {notice === 'secret' && (
          <SecretWarning
            onSendAnyway={() => {
              submit({ force: true });
              focusComposer();
            }}
            onRemove={removeSecret}
          />
        )}
        {notice === 'banner' && banner}
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
                        className="flex items-center gap-2 rounded-xl border bg-gray-3/50 px-3 py-1.5 text-sm"
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.15 }}
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
                          className="text-gray-11 hover:text-gray-12 rounded-full p-0.5 transition-colors"
                        >
                          <X className="size-3.5" />
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
              <PromptInputActions className="flex min-w-0 items-center justify-between gap-2">
                <div className="flex shrink-0 items-center gap-1">
                  <PromptInputAction tooltip={t('Attach files')}>
                    <FileUploadTrigger asChild>
                      <div className="flex h-9 w-9 sm:h-7 sm:w-7 cursor-pointer items-center justify-center rounded-full text-gray-11 transition-colors hover:bg-gray-3 hover:text-gray-12">
                        <Paperclip className="size-4" />
                      </div>
                    </FileUploadTrigger>
                  </PromptInputAction>
                  {leftActions}
                </div>
                <div className="flex min-w-0 items-center gap-1 [&>*:last-child]:shrink-0">
                  {rightActions}
                  {isStreaming && onStop ? (
                    <PromptInputAction
                      tooltip={
                        <span className="flex items-center gap-2">
                          {t('Stop')}
                          <kbd className="font-sans text-xs text-gray-9">
                            Esc
                          </kbd>
                        </span>
                      }
                    >
                      <Button
                        variant="default"
                        size="icon"
                        className="sm:h-7 sm:w-7 rounded-full"
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
                        className="h-7 gap-1.5 rounded-full px-3"
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
                        className="sm:h-7 sm:w-7 rounded-full"
                        aria-label={t('Send message')}
                        onClick={handleSubmit}
                        disabled={!isNil(sendBlockedReason)}
                      >
                        <ArrowUp className="size-4" />
                      </Button>
                    </PromptInputAction>
                  ) : isVoiceSupported ? (
                    <PromptInputAction tooltip={t('Voice input')}>
                      <button
                        type="button"
                        onClick={startRecording}
                        className="flex h-9 w-9 sm:h-7 sm:w-7 cursor-pointer items-center justify-center rounded-full text-gray-11 transition-colors hover:bg-gray-3 hover:text-gray-12"
                      >
                        <Mic className="size-4" />
                      </button>
                    </PromptInputAction>
                  ) : (
                    <PromptInputAction tooltip={t('Send message')}>
                      <Button
                        variant="default"
                        size="icon"
                        className="sm:h-7 sm:w-7 rounded-full"
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
    </div>
  );
}

function QueuedBubble({
  message,
  onSendNow,
  onRemove,
}: {
  message: QueuedMessage;
  onSendNow: () => void;
  onRemove: () => void;
}) {
  return (
    <motion.div
      role="status"
      className="flex flex-col items-end gap-0.5"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.15 }}
    >
      <div className="max-w-[85%] rounded-xl rounded-br-md bg-gray-3 px-2.5 py-1 text-sm text-gray-11">
        <p className="line-clamp-3 whitespace-pre-wrap break-words">
          {message.text}
        </p>
        {message.files.length > 0 && (
          <p className="mt-1 flex items-center gap-1 text-xs">
            <Paperclip className="size-3" />
            {t('{count, plural, =1 {1 file} other {# files}}', {
              count: message.files.length,
            })}
          </p>
        )}
      </div>
      <div className="flex items-center gap-0.5 text-xs text-gray-11">
        <span className="px-1">{t('Queued')}</span>
        <Button
          variant="ghost"
          size="xs"
          className="text-gray-11 hover:text-gray-12"
          onClick={onSendNow}
        >
          {t('Send now')}
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          className="text-gray-11 hover:text-gray-12"
          aria-label={t('Remove from queue')}
          onClick={onRemove}
        >
          <X className="size-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}

function SecretWarning({
  onSendAnyway,
  onRemove,
}: {
  onSendAnyway: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex items-center gap-1.5 bg-warning-3 py-1 pr-1.5 pl-3 text-sm text-warning-11"
    >
      <AlertTriangle className="size-3.5 shrink-0" />
      <span className="min-w-0 flex-1 leading-tight">
        {t('This looks like a secret')}
      </span>
      <Button
        variant="ghost"
        size="xs"
        className="shrink-0 px-1.5 text-warning-11 hover:text-warning-11"
        onClick={onSendAnyway}
      >
        {t('Send anyway')}
      </Button>
      <Button
        variant="ghost"
        size="xs"
        className="shrink-0 px-1.5 text-warning-11 hover:text-warning-11"
        onClick={onRemove}
      >
        {t('Remove')}
      </Button>
    </div>
  );
}

const DRAFT_DEBOUNCE_MS = 300;

type QueuedMessage = { text: string; files: File[] };
type Notice = 'secret' | 'queued' | 'banner' | 'none';
