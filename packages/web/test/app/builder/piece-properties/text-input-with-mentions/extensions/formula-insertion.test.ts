// @vitest-environment jsdom
import { AP_FUNCTIONS } from '@activepieces/core-formula';
import { Editor } from '@tiptap/core';
import { Document } from '@tiptap/extension-document';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Text } from '@tiptap/extension-text';
import { beforeAll, describe, expect, it } from 'vitest';

import {
  FunctionArgSeparatorNode,
  FunctionEndNode,
  FunctionStartNode,
} from '@/app/builder/piece-properties/text-input-with-mentions/extensions/bracket-nodes';
import {
  FunctionSlashExtension,
  insertFunctionAtPos,
} from '@/app/builder/piece-properties/text-input-with-mentions/extensions/function-slash-extension';
import { textMentionUtils } from '@/app/builder/piece-properties/text-input-with-mentions/text-input-utils';

beforeAll(() => {
  const r = {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
  };
  Object.defineProperty(Range.prototype, 'getClientRects', {
    value: () => [],
    configurable: true,
  });
  Object.defineProperty(Range.prototype, 'getBoundingClientRect', {
    value: () => r,
    configurable: true,
  });
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    value: () => undefined,
    configurable: true,
  });
});

const makeEditor = () =>
  new Editor({
    extensions: [
      Document,
      Paragraph,
      Text,
      FunctionStartNode,
      FunctionArgSeparatorNode,
      FunctionEndNode,
      FunctionSlashExtension,
    ],
    content: { type: 'doc', content: [{ type: 'paragraph' }] },
  });

function typeText(editor: Editor, input: string) {
  const view = editor.view;
  for (const ch of input) {
    const { from, to } = view.state.selection;
    const insertFallback = () => view.state.tr.insertText(ch, from, to);
    const handled = view.someProp('handleTextInput', (f) =>
      f(view, from, to, ch, insertFallback),
    );
    if (!handled) view.dispatch(insertFallback());
  }
}

describe('typing never auto-inserts a formula', () => {
  it.each([
    'SELECT count(x) FROM t',
    'trim(a)',
    'x -> trim(x)',
    'SELECT max(a), sum(b) FROM t',
    'string_split(a)',
    'uppercase(name)',
  ])('typed %j stays plain', (input) => {
    const editor = makeEditor();
    typeText(editor, input);
    const out = textMentionUtils.convertTiptapJsonToText(editor.getJSON());
    editor.destroy();
    expect(out).toBe(input);
  });
});

describe('the slash menu still inserts a formula', () => {
  it('inserts a wrapped formula via insertFunctionAtPos', () => {
    const editor = makeEditor();
    typeText(editor, '/');
    const fn = AP_FUNCTIONS.find((f) => f.name === 'uppercase');
    insertFunctionAtPos({ editor, fn: fn!, from: 1, query: '' });
    const out = textMentionUtils.convertTiptapJsonToText(editor.getJSON());
    editor.destroy();
    expect(out).toBe('ap-formula-v1::{uppercase()}::ap-formula-v1');
  });

  it('inserts after existing plain text', () => {
    const editor = makeEditor();
    typeText(editor, 'hello /');
    const fn = AP_FUNCTIONS.find((f) => f.name === 'trim');
    insertFunctionAtPos({ editor, fn: fn!, from: 7, query: '' });
    const out = textMentionUtils.convertTiptapJsonToText(editor.getJSON());
    editor.destroy();
    expect(out).toBe('hello ap-formula-v1::{trim()}::ap-formula-v1');
  });
});
