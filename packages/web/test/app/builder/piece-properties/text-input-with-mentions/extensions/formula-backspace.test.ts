// @vitest-environment jsdom
import { formulaEvaluator } from '@activepieces/core-formula';
import { Editor } from '@tiptap/core';
import { Document } from '@tiptap/extension-document';
import { Mention } from '@tiptap/extension-mention';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Text } from '@tiptap/extension-text';
import { JSONContent } from '@tiptap/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  FunctionArgSeparatorNode,
  FunctionEndNode,
  FunctionStartNode,
  FUNCTION_END_NODE_TYPE,
  FUNCTION_SEP_NODE_TYPE,
  FUNCTION_START_NODE_TYPE,
} from '@/app/builder/piece-properties/text-input-with-mentions/extensions/bracket-nodes';
import { getFormulaBackspaceTransaction } from '@/app/builder/piece-properties/text-input-with-mentions/extensions/formula-backspace';
import { textMentionUtils } from '@/app/builder/piece-properties/text-input-with-mentions/text-input-utils';

const ZWS_CHAR = '\u200B';
const FN_ID = 'fn-1';
const NESTED_FN_ID = 'fn-2';
const ORPHAN_FN_ID = 'fn-orphan';

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
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    value: () => undefined,
    configurable: true,
  });
});

afterEach(() => {
  editor?.destroy();
  editor = null;
});

function functionStart(id: string, functionName: string): JSONContent {
  return { type: FUNCTION_START_NODE_TYPE, attrs: { id, functionName } };
}

function functionEnd(openId: string): JSONContent {
  return { type: FUNCTION_END_NODE_TYPE, attrs: { openId } };
}

function functionSep(openId: string): JSONContent {
  return { type: FUNCTION_SEP_NODE_TYPE, attrs: { openId } };
}

function text(value: string): JSONContent {
  return { type: 'text', text: value };
}

function posAfterFirstFunctionStart(currentEditor: Editor): number {
  let pos = -1;
  currentEditor.state.doc.descendants((node, nodePos) => {
    if (pos < 0 && node.type.name === FUNCTION_START_NODE_TYPE) {
      pos = nodePos + node.nodeSize;
    }
  });
  return pos;
}

function listBadges(currentEditor: Editor): string[] {
  const badges: string[] = [];
  currentEditor.state.doc.descendants((node) => {
    if (node.type.name === FUNCTION_START_NODE_TYPE) {
      badges.push(`${FUNCTION_START_NODE_TYPE}:${String(node.attrs.id)}`);
    }
    if (node.type.name === FUNCTION_END_NODE_TYPE) {
      badges.push(`${FUNCTION_END_NODE_TYPE}:${String(node.attrs.openId)}`);
    }
  });
  return badges;
}

function countNodes(currentEditor: Editor, typeName: string): number {
  let count = 0;
  currentEditor.state.doc.descendants((node) => {
    if (node.type.name === typeName) count++;
  });
  return count;
}

function backspaceJustInsideBracket(content: JSONContent[]) {
  const currentEditor = new Editor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Mention.configure({ suggestion: { char: '' } }),
      FunctionStartNode,
      FunctionArgSeparatorNode,
      FunctionEndNode,
    ],
    content: { type: 'doc', content: [{ type: 'paragraph', content }] },
  });
  editor = currentEditor;

  const cursor = posAfterFirstFunctionStart(currentEditor);
  currentEditor.commands.setTextSelection(cursor);
  expect(currentEditor.state.selection.from).toBe(cursor);

  const jsonBeforeKeypress = currentEditor.getJSON();
  const transaction = getFormulaBackspaceTransaction({
    state: currentEditor.state,
  });
  if (transaction) {
    currentEditor.view.dispatch(transaction);
  }

  return {
    handled: transaction !== null,
    startBadges: countNodes(currentEditor, FUNCTION_START_NODE_TYPE),
    endBadges: countNodes(currentEditor, FUNCTION_END_NODE_TYPE),
    mentions: countNodes(currentEditor, 'mention'),
    badges: listBadges(currentEditor),
    visibleText: currentEditor.state.doc.textContent.split(ZWS_CHAR).join(''),
    serialize: () =>
      textMentionUtils.convertTiptapJsonToText(currentEditor.getJSON()),
    serializeBeforeKeypress: () =>
      textMentionUtils.convertTiptapJsonToText(jsonBeforeKeypress),
  };
}

describe('formula backspace just inside the opening bracket (GIT-1704)', () => {
  it('deletes the whole pair when the formula is empty', () => {
    const result = backspaceJustInsideBracket([
      functionStart(FN_ID, 'uppercase'),
      text(ZWS_CHAR),
      functionEnd(FN_ID),
    ]);

    expect(result.handled).toBe(true);
    expect(result.startBadges).toBe(0);
    expect(result.endBadges).toBe(0);
    expect(result.visibleText).toBe('');
  });

  it('deletes the whole pair when only the separator skeleton is left', () => {
    const result = backspaceJustInsideBracket([
      functionStart(FN_ID, 'concat'),
      text(ZWS_CHAR),
      functionSep(FN_ID),
      text(ZWS_CHAR),
      functionEnd(FN_ID),
    ]);

    expect(result.handled).toBe(true);
    expect(result.startBadges).toBe(0);
    expect(result.endBadges).toBe(0);
    expect(result.visibleText).toBe('');
  });

  it('keeps a typed argument instead of discarding it with the formula', () => {
    const result = backspaceJustInsideBracket([
      functionStart(FN_ID, 'uppercase'),
      text(`${ZWS_CHAR}something`),
      functionEnd(FN_ID),
    ]);

    expect(result.visibleText).toBe('something');
    expect(result.startBadges).toBe(0);
    expect(result.endBadges).toBe(0);
  });

  it('keeps a step mention argument', () => {
    const result = backspaceJustInsideBracket([
      functionStart(FN_ID, 'uppercase'),
      text(ZWS_CHAR),
      { type: 'mention', attrs: { id: 'step_1', label: 'step_1' } },
      functionEnd(FN_ID),
    ]);

    expect(result.mentions).toBe(1);
    expect(result.startBadges).toBe(0);
    expect(result.endBadges).toBe(0);
  });

  it('keeps a nested formula argument whole', () => {
    const result = backspaceJustInsideBracket([
      functionStart(FN_ID, 'uppercase'),
      text(ZWS_CHAR),
      functionStart(NESTED_FN_ID, 'trim'),
      text(`${ZWS_CHAR}value`),
      functionEnd(NESTED_FN_ID),
      functionEnd(FN_ID),
    ]);

    expect(result.startBadges).toBe(1);
    expect(result.endBadges).toBe(1);
    expect(result.visibleText).toBe('value');
  });

  it('keeps text typed after the formula', () => {
    const result = backspaceJustInsideBracket([
      functionStart(FN_ID, 'uppercase'),
      text(`${ZWS_CHAR}arg`),
      functionEnd(FN_ID),
      text(' tail'),
    ]);

    expect(result.visibleText).toBe('arg tail');
    expect(result.endBadges).toBe(0);
  });

  it('keeps surrounding text when deleting an empty pair', () => {
    const result = backspaceJustInsideBracket([
      text('before '),
      functionStart(FN_ID, 'uppercase'),
      text(ZWS_CHAR),
      functionEnd(FN_ID),
      text(' after'),
    ]);

    expect(result.handled).toBe(true);
    expect(result.startBadges).toBe(0);
    expect(result.visibleText).toBe('before  after');
  });

  it('unwraps only its own pair when a formula id is duplicated by a paste', () => {
    const result = backspaceJustInsideBracket([
      functionStart(FN_ID, 'uppercase'),
      text(`${ZWS_CHAR}first`),
      functionEnd(FN_ID),
      text(' '),
      functionStart(FN_ID, 'uppercase'),
      text(`${ZWS_CHAR}second`),
      functionEnd(FN_ID),
    ]);

    expect(result.badges).toEqual([
      `${FUNCTION_START_NODE_TYPE}:${FN_ID}`,
      `${FUNCTION_END_NODE_TYPE}:${FN_ID}`,
    ]);
    expect(result.visibleText).toBe('first second');
  });

  it('leaves the inner pair matched when unwrapping around a nested formula', () => {
    const result = backspaceJustInsideBracket([
      functionStart(FN_ID, 'uppercase'),
      text(ZWS_CHAR),
      functionStart(NESTED_FN_ID, 'trim'),
      text(`${ZWS_CHAR}inner`),
      functionEnd(NESTED_FN_ID),
      text(' tail'),
      functionEnd(FN_ID),
    ]);

    expect(result.badges).toEqual([
      `${FUNCTION_START_NODE_TYPE}:${NESTED_FN_ID}`,
      `${FUNCTION_END_NODE_TYPE}:${NESTED_FN_ID}`,
    ]);
    expect(result.visibleText).toBe('inner tail');
  });

  it('unwraps the outer pair when a formula is pasted inside itself', () => {
    const result = backspaceJustInsideBracket([
      functionStart(FN_ID, 'uppercase'),
      text(ZWS_CHAR),
      functionStart(FN_ID, 'uppercase'),
      text(`${ZWS_CHAR}inner`),
      functionEnd(FN_ID),
      text(' tail'),
      functionEnd(FN_ID),
    ]);

    expect(result.badges).toEqual([
      `${FUNCTION_START_NODE_TYPE}:${FN_ID}`,
      `${FUNCTION_END_NODE_TYPE}:${FN_ID}`,
    ]);
    expect(result.visibleText).toBe('inner tail');
  });

  it('pairs with the closer the serializer pairs with when an orphan closer is nested', () => {
    const result = backspaceJustInsideBracket([
      functionStart(FN_ID, 'uppercase'),
      text(`${ZWS_CHAR}arg`),
      functionEnd(ORPHAN_FN_ID),
      functionEnd(FN_ID),
    ]);

    expect(result.startBadges).toBe(0);
    expect(result.endBadges).toBe(1);
    expect(result.serialize()).toBe('arg)');
  });

  it('does not introduce the wrapper loss an orphan closer already causes', () => {
    const result = backspaceJustInsideBracket([
      functionStart(FN_ID, 'uppercase'),
      text(`${ZWS_CHAR}arg`),
      functionEnd(ORPHAN_FN_ID),
      functionEnd(FN_ID),
      text(' '),
      functionStart(NESTED_FN_ID, 'trim'),
      text(`${ZWS_CHAR}later`),
      functionEnd(NESTED_FN_ID),
    ]);

    expect(result.serializeBeforeKeypress()).toContain('trim(later)');
    expect(result.serializeBeforeKeypress()).not.toContain(
      `${formulaEvaluator.PREFIX}trim(`,
    );
    expect(result.serialize()).toContain('trim(later)');
    expect(result.serialize()).not.toContain(`${formulaEvaluator.PREFIX}trim(`);
  });

  it('deletes only the badge of an unclosed formula', () => {
    const result = backspaceJustInsideBracket([
      functionStart(FN_ID, 'uppercase'),
      text(`${ZWS_CHAR}something`),
    ]);

    expect(result.handled).toBe(true);
    expect(result.startBadges).toBe(0);
    expect(result.visibleText).toBe('something');
  });
});
