import { ApFunction } from '@activepieces/shared';
import { Extension } from '@tiptap/core';
import { JSONContent } from '@tiptap/react';

import { FUNCTION_SEP_NODE_TYPE } from './function-sep-node';
import {
  FUNCTION_END_NODE_TYPE,
  FUNCTION_START_NODE_TYPE,
} from './function-start-node';

export type SlashCommandState = {
  open: boolean;
  query: string;
  position: { top: number; left: number };
  from: number;
};

export type SlashCommandHandler = {
  getState: () => SlashCommandState;
  setState: (s: SlashCommandState) => void;
};

let _handler: SlashCommandHandler | null = null;

export const registerSlashCommandHandler = (h: SlashCommandHandler) => {
  _handler = h;
};

export const unregisterSlashCommandHandler = () => {
  _handler = null;
};

export function insertFunctionAtPos(
  editor: import('@tiptap/core').Editor,
  fn: ApFunction,
  from: number,
  query: string,
) {
  const deleteLen = 1 + query.length;
  const startPos = Math.max(0, from);

  const ZWS = '\u200B';
  const id = crypto.randomUUID();
  const content: JSONContent[] = [
    { type: FUNCTION_START_NODE_TYPE, attrs: { id, functionName: fn.name } },
    { type: 'text', text: ZWS },
  ];
  for (let i = 0; i < fn.minArgs; i++) {
    if (i > 0) {
      content.push({ type: FUNCTION_SEP_NODE_TYPE, attrs: { openId: id } });
      content.push({ type: 'text', text: ZWS });
    }
  }
  content.push({ type: FUNCTION_END_NODE_TYPE, attrs: { openId: id } });

  editor
    .chain()
    .focus()
    .deleteRange({ from: startPos, to: startPos + deleteLen })
    .insertContentAt(startPos, content)
    .run();

  editor.commands.setTextSelection(startPos + 2);
}

function closeHandler(handler: SlashCommandHandler) {
  handler.setState({
    open: false,
    query: '',
    position: { top: 0, left: 0 },
    from: 0,
  });
}

export const FunctionSlashExtension = Extension.create({
  name: 'functionSlash',

  addKeyboardShortcuts() {
    return {};
  },

  onUpdate() {
    const { state } = this.editor;
    const { selection } = state;
    const pos = selection.from;

    const textBefore = state.doc.textBetween(Math.max(0, pos - 30), pos, '\n');

    if (!_handler) return;

    const slashIdx = textBefore.lastIndexOf('/');
    if (slashIdx === -1) {
      if (_handler.getState().open) {
        closeHandler(_handler);
      }
      return;
    }

    const query = textBefore.slice(slashIdx + 1);
    if (query.includes(' ') || query.includes('\n')) {
      if (_handler.getState().open) {
        closeHandler(_handler);
      }
      return;
    }

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
  },
});
