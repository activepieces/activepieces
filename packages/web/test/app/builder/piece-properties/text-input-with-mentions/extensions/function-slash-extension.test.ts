// @vitest-environment jsdom
import { Editor } from '@tiptap/core';
import { Document } from '@tiptap/extension-document';
import { HardBreak } from '@tiptap/extension-hard-break';
import { Mention } from '@tiptap/extension-mention';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Text } from '@tiptap/extension-text';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  FunctionSlashExtension,
  SlashCommandState,
  setSlashCommandHandler,
} from '@/app/builder/piece-properties/text-input-with-mentions/extensions/function-slash-extension';

const ZWS_CHAR = '\u200B';
const HARD_BREAK_PART = '__hard_break__';
const MENTION_PART = '__mention__';

const INITIAL_STATE: SlashCommandState = {
  open: false,
  query: '',
  position: { top: 0, left: 0 },
  from: 0,
};

let editor: Editor | null = null;

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
});

function typeIntoEditor(parts: string[]): SlashCommandState {
  let slashState: SlashCommandState = INITIAL_STATE;

  editor = new Editor({
    extensions: [
      Document,
      Paragraph,
      Text,
      HardBreak,
      Mention.configure({ suggestion: { char: '' } }),
      FunctionSlashExtension,
    ],
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

  for (const part of parts) {
    if (part === HARD_BREAK_PART) {
      editor.commands.setHardBreak();
      continue;
    }
    if (part === MENTION_PART) {
      editor.commands.insertContent({
        type: 'mention',
        attrs: { id: 'step_1', label: 'step_1' },
      });
      continue;
    }
    editor.commands.insertContent({ type: 'text', text: part });
  }

  return slashState;
}

describe('FunctionSlashExtension slash trigger (GIT-1701 regression)', () => {
  it('stays closed for a slash inside a URL', () => {
    expect(typeIntoEditor(['https://example.com/api/se']).open).toBe(false);
  });

  it('stays closed for the double slash of a scheme', () => {
    expect(typeIntoEditor(['https://']).open).toBe(false);
  });

  it('stays closed for a slash glued to the preceding word', () => {
    expect(typeIntoEditor(['api/se']).open).toBe(false);
  });

  it('stays closed for a slash right after a step mention', () => {
    expect(typeIntoEditor([MENTION_PART, '/api']).open).toBe(false);
  });

  it('opens for a slash at the start of the field', () => {
    const state = typeIntoEditor(['/up']);
    expect(state.open).toBe(true);
    expect(state.query).toBe('up');
  });

  it('opens for a slash after whitespace', () => {
    const state = typeIntoEditor(['do /up']);
    expect(state.open).toBe(true);
    expect(state.query).toBe('up');
  });

  it('opens for a slash after the zero-width cursor anchor of a function', () => {
    expect(typeIntoEditor([`${ZWS_CHAR}/up`]).open).toBe(true);
  });

  it('opens for a slash after a hard break', () => {
    expect(typeIntoEditor(['line', HARD_BREAK_PART, '/up']).open).toBe(true);
  });
});
