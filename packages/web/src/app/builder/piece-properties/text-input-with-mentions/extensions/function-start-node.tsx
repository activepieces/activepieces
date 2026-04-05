import { AP_FUNCTIONS, ApFunction } from '@activepieces/shared';
import { InputRule, Node, mergeAttributes } from '@tiptap/core';
import { JSONContent } from '@tiptap/react';

import { FUNCTION_SEP_NODE_TYPE } from './function-sep-node';

export const FUNCTION_START_NODE_TYPE = 'function_start';
export const FUNCTION_END_NODE_TYPE = 'function_end';

const fnNamePattern = AP_FUNCTIONS.map((f) => f.name).join('|');
const inputRuleRegex = new RegExp(`(${fnNamePattern})\\($`);

function buildInputRuleContent(fn: ApFunction, id: string): JSONContent[] {
  const content: JSONContent[] = [
    { type: FUNCTION_START_NODE_TYPE, attrs: { id, functionName: fn.name } },
  ];
  for (let i = 0; i < fn.minArgs; i++) {
    if (i > 0) {
      content.push({ type: FUNCTION_SEP_NODE_TYPE, attrs: { openId: id } });
    }
  }
  content.push({ type: FUNCTION_END_NODE_TYPE, attrs: { openId: id } });
  return content;
}

export const FunctionStartNode = Node.create({
  name: FUNCTION_START_NODE_TYPE,
  group: 'inline',
  inline: true,
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      id: { default: '' },
      functionName: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-function-start]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-function-start': node.attrs.id,
        'data-function-name': node.attrs.functionName,
        class:
          'ap-fn-badge inline-flex items-center bg-primary/15 text-primary rounded-none px-[3px] mx-[1px] text-[12px] font-medium cursor-default select-none whitespace-nowrap',
        contenteditable: 'false',
      }),
      `${node.attrs.functionName}(`,
    ];
  },

  addInputRules() {
    return [
      new InputRule({
        find: inputRuleRegex,
        handler: ({ range, match, chain }) => {
          const fnName = match[1];
          const fn = AP_FUNCTIONS.find((f) => f.name === fnName);
          if (!fn) return;
          const id = crypto.randomUUID();
          const content = buildInputRuleContent(fn, id);
          chain()
            .deleteRange(range)
            .insertContentAt(range.from, content)
            .setTextSelection(range.from + 1)
            .run();
        },
      }),
    ];
  },
});
