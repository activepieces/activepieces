import { JSONContent } from '@tiptap/react';

import {
  FUNCTION_END_NODE_TYPE,
  FUNCTION_START_NODE_TYPE,
} from '../extensions/function-start-node';

// Converts a TipTap document JSONContent tree to an expression string.
// Function start/end nodes are serialized as `name(` and `)`.
// Mention nodes are serialized as their `serverValue` (e.g. `{{trigger.name}}`).
// Text nodes are serialized as their text content.
export function tiptapNodesToExpression(nodes: JSONContent[]): string {
  return nodes.map(nodeToExpression).join('');
}

function nodeToExpression(node: JSONContent): string {
  switch (node.type) {
    case FUNCTION_START_NODE_TYPE: {
      const attrs = node.attrs as { functionName?: string };
      return `${attrs.functionName ?? ''}(`;
    }
    case FUNCTION_END_NODE_TYPE:
      return ')';
    case 'mention': {
      if (!node.attrs?.label) return '';
      const label = JSON.parse(node.attrs.label as string) as {
        serverValue?: string;
      };
      return label.serverValue ?? '';
    }
    case 'text':
      return node.text ?? '';
    case 'hardBreak':
      return '\n';
    case 'paragraph': {
      return node.content ? tiptapNodesToExpression(node.content) : '';
    }
    default:
      return node.content ? tiptapNodesToExpression(node.content) : '';
  }
}
