import { Node, mergeAttributes } from '@tiptap/core';

export const FUNCTION_SEP_NODE_TYPE = 'function_sep';

export const FunctionArgSeparatorNode = Node.create({
  name: FUNCTION_SEP_NODE_TYPE,
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      openId: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-function-sep]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-function-sep': node.attrs.openId,
        class:
          'ap-fn-badge inline-flex items-center bg-primary/15 text-primary rounded-none px-[3px] mx-[1px] text-[12px] font-medium cursor-default select-none whitespace-nowrap',
        contenteditable: 'false',
      }),
      ',',
    ];
  },
});
