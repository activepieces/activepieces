import { Editor, Range } from '@tiptap/core';
import { MentionOptions } from '@tiptap/extension-mention';
import { ReactRenderer } from '@tiptap/react';

import {
  MentionCommandAttrs,
  MentionPicker,
  MentionPickerHandle,
  MentionPickerProps,
} from './mention-picker';

const POPUP_GAP = 8;
const POPUP_WIDTH = 520;

function positionContainer(
  container: HTMLElement,
  clientRect: (() => DOMRect | null) | null | undefined,
) {
  const rect = clientRect?.();
  if (!rect) {
    return;
  }
  const left = Math.max(
    8,
    Math.min(rect.left, window.innerWidth - POPUP_WIDTH - 8),
  );
  container.style.left = `${left}px`;
  container.style.bottom = `${window.innerHeight - rect.top + POPUP_GAP}px`;
}

function insertMention(
  editor: Editor,
  range: Range,
  attrs: MentionCommandAttrs,
) {
  editor
    .chain()
    .focus()
    .insertContentAt(range, [
      { type: 'mention', attrs },
      { type: 'text', text: ' ' },
    ])
    .run();
}

function createMentionSuggestion({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}): MentionOptions['suggestion'] {
  return {
    char: '@',
    items: () => [],
    render: () => {
      let renderer: ReactRenderer<
        MentionPickerHandle,
        MentionPickerProps
      > | null = null;
      let container: HTMLDivElement | null = null;
      let editor: Editor | null = null;
      let range: Range | null = null;

      const onCommand = (attrs: MentionCommandAttrs) => {
        if (editor && range) {
          insertMention(editor, range, attrs);
        }
      };

      return {
        onStart: (props) => {
          onOpenChange(true);
          editor = props.editor;
          range = props.range;
          renderer = new ReactRenderer(MentionPicker, {
            props: { query: props.query, onCommand },
            editor: props.editor,
          });
          container = document.createElement('div');
          container.style.position = 'fixed';
          container.style.zIndex = '60';
          document.body.appendChild(container);
          container.appendChild(renderer.element);
          positionContainer(container, props.clientRect);
        },
        onUpdate: (props) => {
          editor = props.editor;
          range = props.range;
          renderer?.updateProps({ query: props.query, onCommand });
          if (container) {
            positionContainer(container, props.clientRect);
          }
        },
        onKeyDown: (props) => {
          if (props.event.key === 'Escape') {
            return false;
          }
          return renderer?.ref?.onKeyDown(props.event) ?? false;
        },
        onExit: () => {
          onOpenChange(false);
          renderer?.destroy();
          container?.remove();
          renderer = null;
          container = null;
          editor = null;
          range = null;
        },
      };
    },
  };
}

export const mentionSuggestion = {
  createMentionSuggestion,
};
