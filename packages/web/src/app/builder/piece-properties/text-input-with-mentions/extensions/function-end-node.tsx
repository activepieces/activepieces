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
          'ap-fn-badge inline-flex items-center bg-[#ede9fe] border border-[#a78bfa] text-[#5b21b6] rounded-[4px] px-[6px] py-[2px] mx-[2px] my-[2px] text-[12px] font-medium cursor-default select-none whitespace-nowrap',
        contenteditable: 'false',
      }),
      ')',
    ];
  },
});
