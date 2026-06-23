import { t } from 'i18next';
import { X } from 'lucide-react';
import React, { useRef, useState } from 'react';

import { cn } from '@/lib/utils';

import { TextInputWithMentions } from './text-input-with-mentions';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isMention = (value: string): boolean => value.includes('{{');

const isValidChip = (value: string): boolean =>
  isMention(value) || EMAIL_REGEX.test(value.trim());

const splitPasted = (text: string): string[] =>
  text
    .split(/[,;\n]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

const chipInnerClass =
  'border-0 bg-transparent p-0 min-h-0 h-auto leading-tight text-sm outline-none focus-visible:ring-0 focus-visible:ring-offset-0';

const composeInnerClass =
  'border-0 bg-transparent px-0 py-0.5 min-h-6 h-auto leading-tight text-sm outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0';

// Render a data-selector mention as inline, baseline-aligned brand-colored
// text instead of a bordered badge, so it sits flush with any literal text
// typed after it (e.g. "{{step.email}}.com") and reads as a dynamic value.
const chipWrapperClass = cn(
  'w-auto',
  '[&_.ProseMirror]:!cursor-pointer [&_.ProseMirror]:!opacity-100 [&_.ProseMirror]:pointer-events-none',
  '[&_[data-type=mention]]:!inline [&_[data-type=mention]]:!align-baseline [&_[data-type=mention]]:!my-0 [&_[data-type=mention]]:!mx-0 [&_[data-type=mention]]:!border-0 [&_[data-type=mention]]:!bg-transparent [&_[data-type=mention]]:!px-0 [&_[data-type=mention]]:!py-0 [&_[data-type=mention]]:!rounded-none [&_[data-type=mention]]:!text-primary [&_[data-type=mention]]:!font-medium',
  '[&_[data-type=mention]>*]:!hidden',
);

function MentionChipsInput({
  value,
  onChange,
  disabled,
  placeholder,
}: MentionChipsInputProps) {
  const chips = (Array.isArray(value) ? value : []).filter(
    (chip) => typeof chip === 'string' && chip.trim().length > 0,
  );
  const [draft, setDraft] = useState('');
  const [composeInitial, setComposeInitial] = useState('');
  const [composeKey, setComposeKey] = useState(0);
  const [autoFocusCompose, setAutoFocusCompose] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const resetCompose = () => {
    setDraft('');
    setComposeInitial('');
    setComposeKey((key) => key + 1);
  };

  const commitChips = (newChips: string[], refocus = true) => {
    const cleaned = newChips.map((chip) => chip.trim()).filter(Boolean);
    if (cleaned.length === 0) {
      return;
    }
    onChange([...chips, ...cleaned]);
    setAutoFocusCompose(refocus);
    resetCompose();
  };

  const removeChip = (index: number) => {
    onChange(chips.filter((_, i) => i !== index));
  };

  const editChip = (index: number) => {
    if (disabled) {
      return;
    }
    const chip = chips[index];
    onChange(chips.filter((_, i) => i !== index));
    setDraft(chip);
    setComposeInitial(chip);
    setAutoFocusCompose(true);
    setComposeKey((key) => key + 1);
  };

  const handleKeyDownCapture = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) {
      return;
    }
    if (
      event.key === 'Backspace' &&
      draft.trim().length === 0 &&
      chips.length > 0
    ) {
      event.preventDefault();
      event.stopPropagation();
      removeChip(chips.length - 1);
      return;
    }
    const shouldCommit =
      event.key === 'Enter' || (event.key === ',' && !isMention(draft));
    if (!shouldCommit) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    commitChips([draft]);
  };

  const handlePasteCapture = (event: React.ClipboardEvent<HTMLDivElement>) => {
    if (disabled) {
      return;
    }
    const pasted = event.clipboardData.getData('text');
    const parts = splitPasted(pasted);
    if (parts.length <= 1) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    commitChips([draft, ...parts]);
  };

  // Commit a pending draft when focus leaves the field entirely, so a typed or
  // edited address isn't silently lost. Deferred so focus can settle: editing
  // and committing re-mount the editor (re-focusing inside the widget), and we
  // only treat focus that lands OUTSIDE the widget as "done editing".
  const handleComposeBlur = () => {
    if (disabled) {
      return;
    }
    window.setTimeout(() => {
      const root = rootRef.current;
      if (!root || root.contains(document.activeElement)) {
        return;
      }
      if (draft.trim().length === 0) {
        return;
      }
      commitChips([draft], false);
    }, 0);
  };

  return (
    <div ref={rootRef} className="flex min-h-7 flex-wrap items-center gap-1.5">
      {chips.map((chip, index) => {
        const invalid = !isValidChip(chip);
        return (
          <div
            key={`chip-${index}-${chip}`}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-invalid={invalid}
            title={
              invalid
                ? t('Not a valid email address')
                : disabled
                ? undefined
                : t('Click to edit')
            }
            onClick={() => editChip(index)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                editChip(index);
              }
            }}
            className={cn(
              'inline-flex max-w-full items-center gap-1 rounded-full bg-muted py-0.5 pl-2.5 pr-1 text-sm outline-none transition-colors',
              disabled
                ? 'cursor-default'
                : 'cursor-pointer hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring/50',
              {
                'bg-destructive/10 text-destructive hover:bg-destructive/15':
                  invalid,
              },
            )}
          >
            <TextInputWithMentions
              key={`chip-editor-${index}-${chip}`}
              initialValue={chip}
              onChange={() => {
                /* chips are read-only; click to edit, × to remove */
              }}
              disabled
              className={chipInnerClass}
              wrapperClassName={chipWrapperClass}
            />
            {!disabled && (
              <button
                type="button"
                aria-label={t('Remove')}
                className={cn(
                  'shrink-0 rounded-full p-1 text-muted-foreground/70 outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50',
                  { 'text-destructive/70 hover:text-destructive': invalid },
                )}
                onClick={(event) => {
                  event.stopPropagation();
                  removeChip(index);
                }}
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        );
      })}

      {!disabled && (
        <div
          className="min-w-[140px] flex-1 rounded-sm focus-within:ring-2 focus-within:ring-ring/50"
          onKeyDownCapture={handleKeyDownCapture}
          onPasteCapture={handlePasteCapture}
          onBlur={handleComposeBlur}
        >
          <TextInputWithMentions
            key={`compose-${composeKey}`}
            initialValue={composeInitial}
            onChange={setDraft}
            autoFocus={autoFocusCompose}
            className={composeInnerClass}
            wrapperClassName="w-full"
            placeholder={
              chips.length > 0
                ? t('Add another')
                : placeholder ?? t('Type an email and press Enter')
            }
          />
        </div>
      )}
    </div>
  );
}

MentionChipsInput.displayName = 'MentionChipsInput';

export { MentionChipsInput };

type MentionChipsInputProps = {
  value: string[] | undefined;
  onChange: (value: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
};
