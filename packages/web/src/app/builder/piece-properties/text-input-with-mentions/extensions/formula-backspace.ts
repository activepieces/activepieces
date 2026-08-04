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
  const endPos = findFunctionEndPos({
    doc: state.doc,
    openId: nodeBefore.attrs.id,
  });

  if (endPos < from) return state.tr.delete(startPos, from);

  if (isFormulaBodyEmpty({ doc: state.doc, from, to: endPos })) {
    return state.tr.delete(startPos, endPos + 1);
  }

  return state.tr.delete(endPos, endPos + 1).delete(startPos, from);
}

function findFunctionEndPos({
  doc,
  openId,
}: {
  doc: ProseMirrorNode;
  openId: unknown;
}): number {
  let endPos = -1;
  doc.descendants((node, pos) => {
    if (
      node.type.name === FUNCTION_END_NODE_TYPE &&
      node.attrs.openId === openId
    ) {
      endPos = pos;
    }
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
