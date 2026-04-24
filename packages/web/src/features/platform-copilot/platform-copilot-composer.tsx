import { t } from 'i18next';
import { ArrowUp, Square } from 'lucide-react';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import { cn } from '@/lib/utils';

const PLACEHOLDER_KEYS = [
  'Ask anything about Activepieces...',
  'Curious how flows run at scale?',
  'Want to see the actual code?',
  'How does Activepieces compare to n8n?',
  'Need help picking a plan?',
] as const;

type Props = {
  onSend: (message: string) => void;
  onStop: () => void;
  streaming: boolean;
};

export type CopilotComposerHandle = {
  focus: () => void;
};

export const CopilotComposer = forwardRef<CopilotComposerHandle, Props>(
  function CopilotComposer({ onSend, onStop, streaming }, ref) {
    const [value, setValue] = useState('');
    const [placeholderIdx, setPlaceholderIdx] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(
      ref,
      () => ({
        focus: () => textareaRef.current?.focus(),
      }),
      [],
    );

    useEffect(() => {
      if (streaming || value) return;
      const interval = setInterval(() => {
        setPlaceholderIdx((i) => (i + 1) % PLACEHOLDER_KEYS.length);
      }, 4000);
      return () => clearInterval(interval);
    }, [streaming, value]);

    const canSend = value.trim().length > 0 && !streaming;

    const handleSend = () => {
      if (!canSend) return;
      onSend(value.trim());
      setValue('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };

    return (
      <div className="space-y-2">
        <div className="relative rounded-2xl border border-border/60 bg-background/60 backdrop-blur transition-colors focus-within:border-primary/40 focus-within:bg-background">
          <textarea
            ref={textareaRef}
            rows={2}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t(PLACEHOLDER_KEYS[placeholderIdx])}
            disabled={streaming}
            aria-label={t('Ask Activepieces AI')}
            className="w-full resize-none border-none bg-transparent px-5 py-4 pr-16 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground outline-none min-h-[72px]"
          />
          <button
            type="button"
            onClick={streaming ? onStop : handleSend}
            disabled={!streaming && !canSend}
            aria-label={streaming ? t('Stop generating') : t('Send message')}
            className={cn(
              'absolute right-2.5 bottom-2.5 flex size-10 items-center justify-center rounded-full shadow-sm transition-all duration-200',
              'bg-primary text-primary-foreground',
              'hover:-translate-y-0.5 hover:scale-[1.04] active:scale-95',
              'disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:translate-y-0 disabled:hover:scale-100',
            )}
          >
            {streaming ? (
              <Square className="size-3.5 fill-current" />
            ) : (
              <ArrowUp className="size-[18px]" strokeWidth={2.4} />
            )}
          </button>
        </div>
        {streaming && (
          <div className="flex items-center gap-1.5 px-2 text-[12px] text-muted-foreground">
            <span className="inline-flex gap-1">
              <span className="size-1 rounded-full bg-primary animate-pulse" />
              <span className="size-1 rounded-full bg-primary animate-pulse [animation-delay:150ms]" />
              <span className="size-1 rounded-full bg-primary animate-pulse [animation-delay:300ms]" />
            </span>
            {t('Activepieces AI is thinking')}
          </div>
        )}
      </div>
    );
  },
);
