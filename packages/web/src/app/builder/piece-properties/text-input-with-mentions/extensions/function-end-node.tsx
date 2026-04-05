import { Node, mergeAttributes } from '@tiptap/core';

import { FUNCTION_END_NODE_TYPE } from './function-start-node';

export const FunctionEndNode = Node.create({
  name: FUNCTION_END_NODE_TYPE,
  group: 'inline',
  inline: true,
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      openId: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-function-end]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-function-end': node.attrs.openId,
        class:
          'ap-fn-badge inline-flex items-center bg-primary/15 text-primary rounded-none px-[3px] mx-[1px] text-[12px] font-medium cursor-default select-none whitespace-nowrap',
        contenteditable: 'false',
      }),
      ')',
    ];
  },
});
