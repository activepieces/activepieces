import { AP_FUNCTIONS, ApFunction } from '@activepieces/shared';
import { Extension } from '@tiptap/core';
import { JSONContent } from '@tiptap/react';

import {
  FUNCTION_END_NODE_TYPE,
  FUNCTION_START_NODE_TYPE,
} from './function-start-node';

export type SlashCommandState = {
  open: boolean;
  query: string;
  position: { top: number; left: number };
  from: number; // position of the "/" char in the doc
};

export type SlashCommandHandler = {
  getState: () => SlashCommandState;
  setState: (s: SlashCommandState) => void;
};

// External ref — set by the React component that renders the slash popover.
let _handler: SlashCommandHandler | null = null;

// External ref — set by the React component that renders the inline autocomplete popover.
let _inlineHandler: SlashCommandHandler | null = null;

// Regex to detect a word prefix before cursor (for inline autocomplete).
// Must be at least 2 chars and not be preceded by "/" (that's the slash command).
const INLINE_PREFIX_REGEX = /\b([a-z_][a-z0-9_]{1,})$/i;

export const registerSlashCommandHandler = (h: SlashCommandHandler) => {
  _handler = h;
};

export const unregisterSlashCommandHandler = () => {
  _handler = null;
};

export const registerInlineAutocompleteHandler = (h: SlashCommandHandler) => {
  _inlineHandler = h;
};

export const unregisterInlineAutocompleteHandler = () => {
  _inlineHandler = null;
};

// Called by the popover when the user selects a function (slash-triggered)
export function insertFunctionAtPos(
  editor: import('@tiptap/core').Editor,
  fn: ApFunction,
  from: number,
  query: string,
) {
  // Delete the "/" + query text that triggered the popover
  const deleteLen = 1 + query.length; // "/" + typed chars
  const startPos = Math.max(0, from);

  const id = crypto.randomUUID();
  const sepText = new Array(Math.max(1, fn.minArgs)).fill('').join(', ');
  const content: JSONContent[] = [
    { type: FUNCTION_START_NODE_TYPE, attrs: { id, functionName: fn.name } },
  ];
  if (sepText) {
    content.push({ type: 'text', text: sepText });
  }
  content.push({ type: FUNCTION_END_NODE_TYPE, attrs: { openId: id } });

  editor
    .chain()
    .focus()
    .deleteRange({ from: startPos, to: startPos + deleteLen })
    .insertContentAt(startPos, content)
    .run();

  // Place cursor between the two nodes (right after the start node)
  editor.commands.setTextSelection(startPos + 1);
}

// Called by the inline popover when the user selects a function.
// Replaces the typed prefix (no "/") with the function node pair.
export function insertFunctionInline(
  editor: import('@tiptap/core').Editor,
  fn: ApFunction,
  from: number,
  queryLength: number,
) {
  const startPos = Math.max(0, from);

  const id = crypto.randomUUID();
  const sepText = new Array(Math.max(1, fn.minArgs)).fill('').join(', ');
  const content: JSONContent[] = [
    { type: FUNCTION_START_NODE_TYPE, attrs: { id, functionName: fn.name } },
  ];
  if (sepText) {
    content.push({ type: 'text', text: sepText });
  }
  content.push({ type: FUNCTION_END_NODE_TYPE, attrs: { openId: id } });

  editor
    .chain()
    .focus()
    .deleteRange({ from: startPos, to: startPos + queryLength })
    .insertContentAt(startPos, content)
    .run();

  // Place cursor between the two nodes (right after the start node)
  editor.commands.setTextSelection(startPos + 1);
}

function closeHandler(handler: SlashCommandHandler) {
  handler.setState({
    open: false,
    query: '',
    position: { top: 0, left: 0 },
    from: 0,
  });
}

function matchesAnyFunction(prefix: string): boolean {
  const lower = prefix.toLowerCase();
  return AP_FUNCTIONS.some((f) => f.name.toLowerCase().startsWith(lower));
}

export const FunctionSlashExtension = Extension.create({
  name: 'functionSlash',

  addKeyboardShortcuts() {
    return {
      // Intercept keystrokes to update the search query while popover is open
      // The "/" key itself is handled via the onUpdate below
    };
  },

  onUpdate() {
    const { state } = this.editor;
    const { selection } = state;
    const pos = selection.from;

    // Check the characters before the cursor to detect "/" pattern
    const textBefore = state.doc.textBetween(Math.max(0, pos - 30), pos, '\n');

    // ── Slash command detection ────────────────────────────────────────────
    if (_handler) {
      const slashIdx = textBefore.lastIndexOf('/');
      if (slashIdx === -1) {
        if (_handler.getState().open) {
          closeHandler(_handler);
        }
      } else {
        const query = textBefore.slice(slashIdx + 1);
        if (query.includes(' ') || query.includes('\n')) {
          if (_handler.getState().open) {
            closeHandler(_handler);
          }
        } else {
          const slashDocPos = pos - query.length - 1;
          const coords = this.editor.view.coordsAtPos(slashDocPos);
          const scrollTop = window.scrollY;
          const scrollLeft = window.scrollX;

          _handler.setState({
            open: true,
            query,
            position: {
              top: coords.bottom + scrollTop + 4,
              left: coords.left + scrollLeft,
            },
            from: slashDocPos,
          });

          // Slash is active — skip inline detection
          if (_inlineHandler && _inlineHandler.getState().open) {
            closeHandler(_inlineHandler);
          }
          return;
        }
      }
    }

    // ── Inline autocomplete detection (only when slash is NOT active) ──────
    if (!_inlineHandler) return;

    const inlineMatch = INLINE_PREFIX_REGEX.exec(textBefore);
    if (!inlineMatch) {
      if (_inlineHandler.getState().open) {
        closeHandler(_inlineHandler);
      }
      return;
    }

    const prefix = inlineMatch[1];

    // Check the character immediately before the matched prefix to ensure
    // it's not a "/" (that would be the slash command flow, not inline)
    const matchStart = textBefore.length - prefix.length;
    const charBeforePrefix = matchStart > 0 ? textBefore[matchStart - 1] : '';
    if (charBeforePrefix === '/') {
      if (_inlineHandler.getState().open) {
        closeHandler(_inlineHandler);
      }
      return;
    }

    if (!matchesAnyFunction(prefix)) {
      if (_inlineHandler.getState().open) {
        closeHandler(_inlineHandler);
      }
      return;
    }

    // Calculate the position where the prefix starts in the doc
    const prefixDocPos = pos - prefix.length;
    const coords = this.editor.view.coordsAtPos(prefixDocPos);
    const scrollTop = window.scrollY;
    const scrollLeft = window.scrollX;

    _inlineHandler.setState({
      open: true,
      query: prefix,
      position: {
        top: coords.bottom + scrollTop + 4,
        left: coords.left + scrollLeft,
      },
      from: prefixDocPos,
    });
  },
});
