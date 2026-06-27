import { ChatMentionType } from '@activepieces/shared';
import { Mention, MentionOptions } from '@tiptap/extension-mention';
import { Blocks, Table2 } from 'lucide-react';
import { ComponentType, createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { VerticalFlowIcon } from '@/components/icons/vertical-flow';

import { mentionSerialization, MentionDraft } from './mention-serialization';

function iconMarkup(type: ChatMentionType): string {
  const icon: ComponentType<{ className?: string; size?: number }> =
    type === ChatMentionType.FLOW
      ? VerticalFlowIcon
      : type === ChatMentionType.TABLE
      ? Table2
      : Blocks;
  return renderToStaticMarkup(
    createElement(icon, { size: 13, className: 'shrink-0' }),
  );
}

function buildChipElement(attrs: Record<string, unknown>): HTMLElement {
  const type = attrs.mentionType;
  const label = typeof attrs.label === 'string' ? attrs.label : '';
  const logoUrl = typeof attrs.logoUrl === 'string' ? attrs.logoUrl : undefined;

  const chip = document.createElement('span');
  chip.className =
    'ap-chat-mention inline-flex items-center gap-1 rounded-[5px] bg-foreground/[0.07] px-1.5 py-px text-[0.92em] font-medium text-foreground align-baseline whitespace-nowrap';
  chip.contentEditable = 'false';
  chip.dataset.mentionType = typeof type === 'string' ? type : '';
  chip.dataset.entityId =
    typeof attrs.entityId === 'string' ? attrs.entityId : '';

  if (type === ChatMentionType.APP && logoUrl) {
    const img = document.createElement('img');
    img.src = logoUrl;
    img.className = 'size-3.5 shrink-0 rounded-sm object-contain';
    img.alt = '';
    chip.appendChild(img);
  } else if (isMentionType(type)) {
    const iconWrap = document.createElement('span');
    iconWrap.className = 'inline-flex shrink-0 text-muted-foreground';
    iconWrap.innerHTML = iconMarkup(type);
    chip.appendChild(iconWrap);
  }

  chip.appendChild(document.createTextNode(label));
  return chip;
}

function isMentionType(value: unknown): value is ChatMentionType {
  return (
    value === ChatMentionType.FLOW ||
    value === ChatMentionType.TABLE ||
    value === ChatMentionType.APP
  );
}

function buildChatMentionExtension(suggestion: MentionOptions['suggestion']) {
  return Mention.extend({
    addAttributes() {
      return {
        mentionType: { default: null },
        entityId: { default: null },
        label: { default: null },
        logoUrl: { default: null },
      };
    },
    renderHTML({ node }) {
      return buildChipElement(node.attrs);
    },
    renderText({ node }) {
      const draft = nodeAttrsToDraft(node.attrs);
      return draft ? mentionSerialization.serializeToken(draft) : '';
    },
  }).configure({
    deleteTriggerWithBackspace: true,
    suggestion,
  });
}

function nodeAttrsToDraft(attrs: Record<string, unknown>): MentionDraft | null {
  const type = attrs.mentionType;
  const id = attrs.entityId;
  const label = attrs.label;
  if (
    !isMentionType(type) ||
    typeof id !== 'string' ||
    typeof label !== 'string'
  ) {
    return null;
  }
  const logoUrl = typeof attrs.logoUrl === 'string' ? attrs.logoUrl : undefined;
  return { type, id, label, logoUrl };
}

export const mentionExtension = {
  buildChatMentionExtension,
};
