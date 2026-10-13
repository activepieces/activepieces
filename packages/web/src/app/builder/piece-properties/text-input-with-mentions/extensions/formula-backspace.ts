import { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { EditorState, Transaction } from '@tiptap/pm/state';

import {
  FUNCTION_END_NODE_TYPE,
  FUNCTION_SEP_NODE_TYPE,
  FUNCTION_START_NODE_TYPE,
} from './bracket-nodes';

const ZWS_CHAR = '\u200B';

export function getFormulaBackspaceTransaction({
  state,
}: {
  state: EditorState;
}): Transaction | null {
  const { from, to } = state.selection;
  if (from !== to) return null;

  const nodeBefore = state.doc.resolve(from).nodeBefore;
  if (!nodeBefore || nodeBefore.type.name !== FUNCTION_START_NODE_TYPE) {
    return null;
  }

  const startPos = from - nodeBefore.nodeSize;
  const endPos = findFunctionEndPos({ doc: state.doc, from });

  if (endPos < from) return state.tr.delete(startPos, from);

  if (isFormulaBodyEmpty({ doc: state.doc, from, to: endPos })) {
    return state.tr.delete(startPos, endPos + 1);
  }

  return state.tr.delete(endPos, endPos + 1).delete(startPos, from);
}

function findFunctionEndPos({
  doc,
  from,
}: {
  doc: ProseMirrorNode;
  from: number;
}): number {
  let endPos = -1;
  let openDepth = 0;
  doc.nodesBetween(from, doc.resolve(from).end(), (node, pos) => {
    if (endPos >= 0) return false;
    if (node.type.name === FUNCTION_START_NODE_TYPE) {
      openDepth++;
    } else if (node.type.name === FUNCTION_END_NODE_TYPE) {
      if (openDepth === 0) endPos = pos;
      else openDepth--;
    }
    return endPos < 0;
  });
  return endPos;
}

function isFormulaBodyEmpty({
  doc,
  from,
  to,
}: {
  doc: ProseMirrorNode;
  from: number;
  to: number;
}): boolean {
  const bodyNodes: ProseMirrorNode[] = [];
  doc.nodesBetween(from, to, (node) => {
    if (!node.isInline) return true;
    bodyNodes.push(node);
    return false;
  });

  return bodyNodes.every(
    (node) =>
      node.type.name === FUNCTION_SEP_NODE_TYPE ||
      (node.isText && (node.text ?? '').split(ZWS_CHAR).join('') === ''),
  );
}
