import { t } from 'i18next';
import { Check, Copy, Table } from 'lucide-react';

import { useCopyToClipboard } from '@/components/custom/clipboard/use-copy-to-clipboard';

import { LogoStack } from './logo-stack';

export function PromptCard({ prompt }: { prompt: Prompt }) {
  const { isCopied, copy } = useCopyToClipboard();
  return (
    <button
      type="button"
      onClick={() => copy(promptText(prompt))}
      className="group flex w-full items-start gap-4 rounded-[14px] border bg-panel py-4.5 pl-5 pr-4.5 text-left transition-[border-color,scale] duration-100 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-gray-8 active:scale-[0.995] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-9"
    >
      <span className="sr-only">{t('Copy prompt:')} </span>
      <span className="min-w-0 flex-1 text-base/7 text-gray-12">
        {splitOnSlots(prompt.text).map((part, index) => {
          const slot = part.slot ? prompt.slots[part.slot] : undefined;
          return slot ? (
            <SlotPill key={index} slot={slot} />
          ) : (
            <span key={index}>{part.text}</span>
          );
        })}
      </span>
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md text-gray-9 transition-colors duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:bg-gray-3 group-hover:text-gray-12">
        {isCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
      </span>
    </button>
  );
}

function SlotPill({ slot }: { slot: PromptSlot }) {
  if (slot.kind === 'table') {
    return (
      <span className="mx-0.5 inline-flex h-6.5 items-center gap-1.5 rounded-full border border-accent-5 bg-accent-3 pl-0.75 pr-2.5 align-middle text-sm/5 font-medium text-accent-11">
        <span className="flex size-4.5 items-center justify-center rounded-full bg-panel">
          <Table className="size-2.5" strokeWidth={2.6} />
        </span>
        {slot.label}
      </span>
    );
  }
  return (
    <span className="mx-0.5 inline-flex h-6.5 items-center gap-1.5 rounded-full border bg-panel pl-0.75 pr-2.5 align-middle text-sm/5 font-medium text-gray-12">
      <LogoStack logos={slot.logos} size="sm" />
      {slot.label}
    </span>
  );
}

function splitOnSlots(text: string): { text: string; slot?: string }[] {
  return text
    .split(SLOT_PATTERN)
    .filter((part) => part.length > 0)
    .map((part) => {
      const match = part.match(SLOT_NAME);
      return match ? { text: part, slot: match[1] } : { text: part };
    });
}

function promptText(prompt: Prompt): string {
  return prompt.text.replace(
    SLOT_NAME_GLOBAL,
    (marker, name: string) => prompt.slots[name]?.label ?? marker,
  );
}

const SLOT_PATTERN = /(\{\w+\})/;
const SLOT_NAME = /^\{(\w+)\}$/;
const SLOT_NAME_GLOBAL = /\{(\w+)\}/g;

export type PromptSlot =
  | { kind: 'apps'; label: string; logos: string[] }
  | { kind: 'table'; label: string };

export type Prompt = {
  text: string;
  slots: Record<string, PromptSlot>;
};
