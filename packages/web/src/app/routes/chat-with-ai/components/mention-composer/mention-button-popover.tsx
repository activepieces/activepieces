import { t } from 'i18next';
import { AtSign, Search } from 'lucide-react';
import { useRef, useState } from 'react';

import { PromptInputAction } from '@/components/prompt-kit/prompt-input';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';

import { ChatMentionEditorHandle } from './chat-mention-editor';
import {
  MentionCommandAttrs,
  MentionPicker,
  MentionPickerHandle,
} from './mention-picker';
import { mentionSearch } from './use-mention-search';

export function MentionButtonPopover({
  editorRef,
}: {
  editorRef: React.RefObject<ChatMentionEditorHandle | null>;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const pickerRef = useRef<MentionPickerHandle>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prefetchMentions = mentionSearch.usePrefetchMentionData();

  const handleCommand = (attrs: MentionCommandAttrs) => {
    editorRef.current?.insertMentionAtCaret(attrs);
    setOpen(false);
    setQuery('');
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setQuery('');
      editorRef.current?.focus();
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PromptInputAction tooltip={t('Mention a flow, table, or app')}>
        <PopoverAnchor asChild>
          <button
            type="button"
            onMouseEnter={prefetchMentions}
            onClick={() => setOpen((value) => !value)}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:h-7 sm:w-7"
          >
            <AtSign className="size-4" />
          </button>
        </PopoverAnchor>
      </PromptInputAction>
      <PopoverContent
        align="start"
        side="top"
        sideOffset={8}
        className="w-[520px] max-w-[94vw] overflow-hidden rounded-2xl p-0"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          inputRef.current?.focus();
        }}
        onFocusOutside={(e) => e.preventDefault()}
      >
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('Search flows, tables, apps')}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                return;
              }
              const handled = pickerRef.current?.onKeyDown(e.nativeEvent);
              if (handled) {
                e.preventDefault();
              }
            }}
          />
        </div>
        <MentionPicker
          ref={pickerRef}
          query={query}
          onCommand={handleCommand}
          embedded
        />
      </PopoverContent>
    </Popover>
  );
}
