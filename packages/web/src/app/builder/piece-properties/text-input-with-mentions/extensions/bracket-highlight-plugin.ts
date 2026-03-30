import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

import {
  FUNCTION_END_NODE_TYPE,
  FUNCTION_START_NODE_TYPE,
} from './function-start-node';

const bracketHighlightKey = new PluginKey<DecorationSet>('bracketHighlight');

// Builds a DecorationSet that highlights the full range of a function pair,
// or returns empty if the openId is not found in the document.
function buildDecorations(
  doc: ReturnType<
    typeof import('@tiptap/pm/state').EditorState.prototype.doc.copy
  >,
  openId: string,
): DecorationSet {
  let startFrom: number | null = null;
  let startTo: number | null = null;
  let endFrom: number | null = null;
  let endTo: number | null = null;

  doc.descendants((node, pos) => {
    if (
      node.type.name === FUNCTION_START_NODE_TYPE &&
      node.attrs.id === openId
    ) {
      startFrom = pos;
      startTo = pos + node.nodeSize;
    }
    if (
      node.type.name === FUNCTION_END_NODE_TYPE &&
      node.attrs.openId === openId
    ) {
      endFrom = pos;
      endTo = pos + node.nodeSize;
    }
  });

  if (
    startFrom == null ||
    startTo == null ||
    endFrom == null ||
    endTo == null
  ) {
    return DecorationSet.empty;
  }

  return DecorationSet.create(doc, [
    Decoration.inline(startFrom, startTo, {
      class: 'ap-fn-bracket-highlight',
    }),
    Decoration.inline(startTo, endFrom, {
      class: 'ap-fn-inner-highlight',
    }),
    Decoration.inline(endFrom, endTo, {
      class: 'ap-fn-bracket-highlight',
    }),
  ]);
}

export const BracketHighlightExtension = Extension.create({
  name: 'bracketHighlight',

  addProseMirrorPlugins() {
    return [
      new Plugin<DecorationSet>({
        key: bracketHighlightKey,

        state: {
          init: () => DecorationSet.empty,
          apply(tr, oldDecoSet) {
            const meta = tr.getMeta(bracketHighlightKey) as
              | { openId: string | null }
              | undefined;

            if (meta === undefined) {
              // No hover event — just map existing decorations through the transaction
              return oldDecoSet.map(tr.mapping, tr.doc);
            }

            if (!meta.openId) {
              return DecorationSet.empty;
            }

            return buildDecorations(tr.doc, meta.openId);
          },
        },

        props: {
          decorations(state) {
            return bracketHighlightKey.getState(state);
          },

          handleDOMEvents: {
            mouseover(view, event) {
              const target = event.target as HTMLElement;
              const startEl = target.closest('[data-function-start]');
              const endEl = target.closest('[data-function-end]');

              const openId =
                (startEl?.getAttribute('data-function-start') ??
                  endEl?.getAttribute('data-function-end')) ||
                null;

              const current = bracketHighlightKey.getState(view.state);
              // Avoid re-dispatching if same openId (prevents loops)
              const alreadyHighlighted =
                openId !== null &&
                current !== DecorationSet.empty &&
                current !== undefined;
              if (alreadyHighlighted && !startEl && !endEl) return false;

              const tr = view.state.tr.setMeta(bracketHighlightKey, { openId });
              view.dispatch(tr);
              return false;
            },

            mouseleave(view) {
              const current = bracketHighlightKey.getState(view.state);
              if (current === DecorationSet.empty) return false;
              const tr = view.state.tr.setMeta(bracketHighlightKey, {
                openId: null,
              });
              view.dispatch(tr);
              return false;
            },
          },
        },
      }),
    ];
  },

  addGlobalAttributes() {
    // Inject the CSS needed for highlight classes so we don't need a separate CSS file
    return [];
  },
});
