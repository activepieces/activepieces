import { Editor, Extension, Range } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
import { ReactRenderer } from '@tiptap/react';
import Suggestion from '@tiptap/suggestion';

import { emojiData } from './emoji-data';
import {
  EmojiSuggestionList,
  EmojiSuggestionListHandle,
  EmojiSuggestionListProps,
} from './emoji-suggestion-list';

const POPUP_GAP = 8;
const POPUP_WIDTH = 252;

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

function buildEmojiSuggestionExtension({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
  return Extension.create({
    name: 'emojiSuggestion',
    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          char: ':',
          pluginKey: new PluginKey('emojiSuggestion'),
          items: () => [],
          render: () => {
            let renderer: ReactRenderer<
              EmojiSuggestionListHandle,
              EmojiSuggestionListProps
            > | null = null;
            let container: HTMLDivElement | null = null;
            let editor: Editor | null = null;
            let range: Range | null = null;

            const onCommand = (emoji: string) => {
              if (editor && range) {
                insertEmoji(editor, range, emoji);
              }
            };

            const teardown = () => {
              renderer?.destroy();
              container?.remove();
              renderer = null;
              container = null;
              onOpenChange(false);
            };

            const showOrUpdate = (props: {
              query: string;
              clientRect?: (() => DOMRect | null) | null;
            }) => {
              const q = props.query.trim();
              if (q.length > 0 && emojiData.search(q).length === 0) {
                teardown();
                return;
              }
              if (!renderer) {
                renderer = new ReactRenderer(EmojiSuggestionList, {
                  props: { query: props.query, onCommand },
                  editor: editor!,
                });
                container = document.createElement('div');
                container.style.position = 'fixed';
                container.style.zIndex = '60';
                document.body.appendChild(container);
                container.appendChild(renderer.element);
                onOpenChange(true);
              } else {
                renderer.updateProps({ query: props.query, onCommand });
              }
              if (container) {
                positionContainer(container, props.clientRect);
              }
            };

            return {
              onStart: (props) => {
                editor = props.editor;
                range = props.range;
                showOrUpdate(props);
              },
              onUpdate: (props) => {
                editor = props.editor;
                range = props.range;
                showOrUpdate(props);
              },
              onKeyDown: (props) => {
                if (props.event.key === 'Escape') {
                  return false;
                }
                if (!renderer) {
                  return false;
                }
                return renderer.ref?.onKeyDown(props.event) ?? false;
              },
              onExit: () => {
                teardown();
                editor = null;
                range = null;
              },
            };
          },
        }),
      ];
    },
  });
}

function insertEmoji(editor: Editor, range: Range, emoji: string) {
  editor.chain().focus().insertContentAt(range, emoji).run();
}

export const emojiSuggestion = {
  buildEmojiSuggestionExtension,
};
