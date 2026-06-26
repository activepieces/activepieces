import { ChatMention } from '@activepieces/shared';
import { t } from 'i18next';
import { ArrowUp, AtSign, Mic, Paperclip, Square, X } from 'lucide-react';
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
} from '@/components/prompt-kit/prompt-input';
import { Button } from '@/components/ui/button';
import { VoiceWaveformBars } from '@/features/chat/components/voice-waveform';
import { useVoiceInput } from '@/features/chat/lib/use-voice-input';

import {
  ChatMentionEditor,
  ChatMentionEditorHandle,
  ChatMentionEditorValue,
} from './mention-composer/chat-mention-editor';
import { mentionSearch } from './mention-composer/use-mention-search';

export function ChatInput({
  isStreaming,
  onSend,
  onStop,
  onInputChange,
  placeholder,
  leftActions,
  rightActions,
}: {
  isStreaming: boolean;
  onSend: (text: string, files?: File[], mentions?: ChatMention[]) => void;
  onStop?: () => void;
  onInputChange?: (hasInput: boolean) => void;
  placeholder?: string;
  leftActions?: React.ReactNode;
  rightActions?: React.ReactNode;
}) {
  const [content, setContent] = useState('');
  const [mentions, setMentions] = useState<ChatMention[]>([]);
  const [isEmpty, setIsEmpty] = useState(true);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [interimText, setInterimText] = useState('');
  const lastHasInputRef = useRef(false);
  const editorRef = useRef<ChatMentionEditorHandle>(null);
  const prefetchMentions = mentionSearch.usePrefetchMentionData();

  useEffect(() => {
    prefetchMentions();
  }, [prefetchMentions]);

  const handleEditorChange = useCallback(
    (value: ChatMentionEditorValue) => {
      setContent(value.content);
      setMentions(value.mentions);
      setIsEmpty(value.isEmpty);
      const hasInput = !value.isEmpty;
      if (hasInput !== lastHasInputRef.current) {
        lastHasInputRef.current = hasInput;
        onInputChange?.(hasInput);
      }
    },
    [onInputChange],
  );

  const handleTranscript = useCallback((text: string) => {
    editorRef.current?.insertText(text);
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
    if (!isStreaming && (!isEmpty || attachedFiles.length > 0)) {
      onSend(
        content.trim(),
        attachedFiles.length > 0 ? attachedFiles : undefined,
        mentions.length > 0 ? mentions : undefined,
      );
      editorRef.current?.clear();
      setAttachedFiles([]);
    }
  }, [isStreaming, isEmpty, content, mentions, attachedFiles, onSend]);

  const handleFilesAdded = useCallback((files: File[]) => {
    setAttachedFiles((prev) => [...prev, ...files]);
  }, []);

  const canSend = !isEmpty || attachedFiles.length > 0;

  return (
    <FileUpload onFilesAdded={handleFilesAdded} multiple>
      <PromptInput
        isLoading={isStreaming}
        onSubmit={handleSubmit}
        onClick={() => editorRef.current?.focus()}
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
                    className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-1.5 text-sm"
                    onClick={(e) => e.stopPropagation()}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.15 }}
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
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {isRecording ? (
          <div className="min-h-[44px] px-3 py-2 text-base sm:text-sm text-foreground whitespace-pre-wrap break-words">
            {interimText || (
              <span className="text-muted-foreground">{t('Listening...')}</span>
            )}
          </div>
        ) : (
          <ChatMentionEditor
            ref={editorRef}
            autoFocus
            placeholder={
              placeholder ?? t('Tell me what you need... (@ to mention)')
            }
            onChange={handleEditorChange}
            onSubmit={handleSubmit}
            className="max-h-60 overflow-y-auto"
          />
        )}
        <PromptInputActions className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <PromptInputAction tooltip={t('Attach files')}>
              <FileUploadTrigger asChild>
                <div className="flex h-9 w-9 sm:h-7 sm:w-7 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  <Paperclip className="size-4" />
                </div>
              </FileUploadTrigger>
            </PromptInputAction>
            <PromptInputAction tooltip={t('Mention a flow, table, or app')}>
              <button
                type="button"
                onMouseEnter={prefetchMentions}
                onClick={() => editorRef.current?.insertText('@')}
                className="flex h-9 w-9 sm:h-7 sm:w-7 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <AtSign className="size-4" />
              </button>
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
              <PromptInputAction tooltip={t('Send message')}>
                <Button
                  variant="default"
                  size="icon"
                  className="h-9 w-9 sm:h-7 sm:w-7 rounded-full"
                  onClick={handleSubmit}
                  disabled={isStreaming}
                >
                  <ArrowUp className="size-4" />
                </Button>
              </PromptInputAction>
            ) : isVoiceSupported ? (
              <PromptInputAction tooltip={t('Voice input')}>
                <button
                  type="button"
                  onClick={startRecording}
                  className="flex h-9 w-9 sm:h-7 sm:w-7 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Mic className="size-4" />
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
                  <ArrowUp className="size-4" />
                </Button>
              </PromptInputAction>
            )}
          </div>
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
