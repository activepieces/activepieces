import { ApFunction } from '@activepieces/core-formula';
import { isNil } from '@activepieces/core-utils';
import { Editor, Extension } from '@tiptap/core';
import { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { JSONContent } from '@tiptap/react';

import {
  FUNCTION_END_NODE_TYPE,
  FUNCTION_SEP_NODE_TYPE,
  FUNCTION_START_NODE_TYPE,
} from './bracket-nodes';

const ZWS_CHAR = '\u200B';
const HARD_BREAK_NODE_TYPE = 'hardBreak';
const SLASH_ALLOWED_PREFIX_REGEX = /[\s\u200B]/;

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

const handlerMap = new WeakMap<Editor, SlashCommandHandler>();

export const setSlashCommandHandler = ({
  editor,
  handler,
}: SetSlashCommandHandlerParams) => {
  if (handler === null) {
    handlerMap.delete(editor);
  } else {
    handlerMap.set(editor, handler);
  }
};

export function insertFunctionAtPos({
  editor,
  fn,
  from,
  query,
}: InsertFunctionAtPosParams) {
  const deleteLen = 1 + query.length;
  const startPos = Math.max(0, from);

  const id = crypto.randomUUID();
  const content: JSONContent[] = [
    { type: FUNCTION_START_NODE_TYPE, attrs: { id, functionName: fn.name } },
    { type: 'text', text: ZWS_CHAR },
  ];
  for (let i = 0; i < fn.minArgs; i++) {
    if (i > 0) {
      content.push({ type: FUNCTION_SEP_NODE_TYPE, attrs: { openId: id } });
      content.push({ type: 'text', text: ZWS_CHAR });
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

function isSlashAtWordStart({
  doc,
  slashPos,
}: IsSlashAtWordStartParams): boolean {
  const $slash = doc.resolve(slashPos);
  if ($slash.parentOffset === 0) {
    return true;
  }

  const nodeBefore = $slash.nodeBefore;
  if (isNil(nodeBefore)) {
    return true;
  }
  if (!nodeBefore.isText) {
    return nodeBefore.type.name === HARD_BREAK_NODE_TYPE;
  }

  return SLASH_ALLOWED_PREFIX_REGEX.test((nodeBefore.text ?? '').slice(-1));
}

function closeIfOpen(handler: SlashCommandHandler) {
  if (handler.getState().open) {
    closeHandler(handler);
  }
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

  onBlur() {
    const handler = handlerMap.get(this.editor);
    if (!handler) return;

    if (handler.getState().open) {
      closeHandler(handler);
    }
  },

  onUpdate() {
    const handler = handlerMap.get(this.editor);
    if (!handler) return;

    const { state } = this.editor;
    const { selection } = state;
    const pos = selection.from;

    const textBefore = state.doc.textBetween(Math.max(0, pos - 30), pos, '\n');

    const slashIdx = textBefore.lastIndexOf('/');
    if (slashIdx === -1) {
      closeIfOpen(handler);
      return;
    }

    const query = textBefore.slice(slashIdx + 1);
    if (query.includes(' ') || query.includes('\n')) {
      closeIfOpen(handler);
      return;
    }

    const slashDocPos = pos - query.length - 1;
    if (!isSlashAtWordStart({ doc: state.doc, slashPos: slashDocPos })) {
      closeIfOpen(handler);
      return;
    }

    const coords = this.editor.view.coordsAtPos(slashDocPos);
    const scrollTop = window.scrollY;
    const scrollLeft = window.scrollX;

    handler.setState({
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

export type SetSlashCommandHandlerParams = {
  editor: Editor;
  handler: SlashCommandHandler | null;
};

export type InsertFunctionAtPosParams = {
  editor: Editor;
  fn: ApFunction;
  from: number;
  query: string;
};

type IsSlashAtWordStartParams = {
  doc: ProseMirrorNode;
  slashPos: number;
};
