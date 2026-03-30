import { ApFunction } from '@activepieces/shared';
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

// External ref — set by the React component that renders the popover.
let _handler: SlashCommandHandler | null = null;

export const registerSlashCommandHandler = (h: SlashCommandHandler) => {
  _handler = h;
};

export const unregisterSlashCommandHandler = () => {
  _handler = null;
};

// Called by the popover when the user selects a function
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

export const FunctionSlashExtension = Extension.create({
  name: 'functionSlash',

  addKeyboardShortcuts() {
    return {
      // Intercept keystrokes to update the search query while popover is open
      // The "/" key itself is handled via the onUpdate below
    };
  },

  onUpdate() {
    if (!_handler) return;

    const { state } = this.editor;
    const { selection } = state;
    const pos = selection.from;

    // Check the characters before the cursor to detect "/" pattern
    const textBefore = state.doc.textBetween(Math.max(0, pos - 30), pos, '\n');

    // Find the last "/" that hasn't been cancelled
    const slashIdx = textBefore.lastIndexOf('/');
    if (slashIdx === -1) {
      if (_handler.getState().open) {
        _handler.setState({
          open: false,
          query: '',
          position: { top: 0, left: 0 },
          from: 0,
        });
      }
      return;
    }

    const query = textBefore.slice(slashIdx + 1);

    // If query contains a space, it means the user moved on — close
    if (query.includes(' ') || query.includes('\n')) {
      if (_handler.getState().open) {
        _handler.setState({
          open: false,
          query: '',
          position: { top: 0, left: 0 },
          from: 0,
        });
      }
      return;
    }

    // Calculate the "/" position in the actual document
    const slashDocPos = pos - query.length - 1;

    // Get DOM coordinates for the "/" position
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
  },
});
