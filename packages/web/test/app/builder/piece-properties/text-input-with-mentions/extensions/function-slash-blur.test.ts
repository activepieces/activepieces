// @vitest-environment jsdom
import { Editor } from '@tiptap/core';
import { Document } from '@tiptap/extension-document';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Text } from '@tiptap/extension-text';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  FunctionSlashExtension,
  SlashCommandState,
  setSlashCommandHandler,
} from '@/app/builder/piece-properties/text-input-with-mentions/extensions/function-slash-extension';

const INITIAL_STATE: SlashCommandState = {
  open: false,
  query: '',
  position: { top: 0, left: 0 },
  from: 0,
};

let editor: Editor | null = null;
let container: HTMLDivElement | null = null;

beforeAll(() => {
  const emptyRect = {
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
    value: () => emptyRect,
    configurable: true,
  });
});

afterEach(() => {
  editor?.destroy();
  editor = null;
  container?.remove();
  container = null;
});

describe('FunctionSlashExtension blur handling (GIT-1702 regression)', () => {
  it('closes an open picker when the editor loses focus', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    let slashState: SlashCommandState = INITIAL_STATE;

    editor = new Editor({
      element: container,
      extensions: [Document, Paragraph, Text, FunctionSlashExtension],
      content: { type: 'doc', content: [{ type: 'paragraph' }] },
    });

    setSlashCommandHandler({
      editor,
      handler: {
        getState: () => slashState,
        setState: (next) => {
          slashState = next;
        },
      },
    });

    editor.commands.insertContent({ type: 'text', text: '/up' });
    expect(slashState.open).toBe(true);

    editor.view.dom.dispatchEvent(new FocusEvent('blur'));

    expect(slashState.open).toBe(false);
    expect(slashState.query).toBe('');
  });
});
