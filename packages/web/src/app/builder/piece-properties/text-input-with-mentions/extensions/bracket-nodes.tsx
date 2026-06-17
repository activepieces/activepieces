import { AP_FUNCTIONS, ApFunction } from '@activepieces/shared';
import { InputRule, Node, mergeAttributes } from '@tiptap/core';
import { JSONContent } from '@tiptap/react';

export const FUNCTION_START_NODE_TYPE = 'function_start';
export const FUNCTION_END_NODE_TYPE = 'function_end';
export const FUNCTION_SEP_NODE_TYPE = 'function_sep';

const BADGE_CLASS =
  'ap-fn-badge inline-flex items-center bg-primary/15 text-primary rounded-sm px-[3px] py-[2px] mx-[6px] text-[12px] font-medium cursor-default select-none whitespace-nowrap';

const ZWS = '​';

const fnNamePattern = AP_FUNCTIONS.map((f) => f.name).join('|');
const inputRuleRegex = new RegExp(`(${fnNamePattern})\\($`);

function buildInputRuleContent(fn: ApFunction, id: string): JSONContent[] {
  const content: JSONContent[] = [
    { type: FUNCTION_START_NODE_TYPE, attrs: { id, functionName: fn.name } },
    { type: 'text', text: ZWS },
  ];
  for (let i = 0; i < fn.minArgs; i++) {
    if (i > 0) {
      content.push({ type: FUNCTION_SEP_NODE_TYPE, attrs: { openId: id } });
      content.push({ type: 'text', text: ZWS });
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
      broken: { default: false },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-function-start]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const broken = node.attrs.broken === true;
    const fnName = node.attrs.functionName as string;
    const deprecated = AP_FUNCTIONS.find((f) => f.name === fnName)?.deprecated;
    const classes = [BADGE_CLASS];
    if (broken) classes.push('ap-fn-broken');
    if (deprecated) classes.push('ap-fn-deprecated');
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-function-start': node.attrs.id,
        'data-function-name': fnName,
        class: classes.join(' '),
        contenteditable: 'false',
        ...(deprecated?.replacement
          ? { title: `Deprecated — use ${deprecated.replacement} instead` }
          : {}),
      }),
      `${fnName}(`,
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
            .setTextSelection(range.from + 2)
            .run();
        },
      }),
    ];
  },
});

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
        class: BADGE_CLASS,
        contenteditable: 'false',
      }),
      ';',
    ];
  },
});

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
        class: BADGE_CLASS,
        contenteditable: 'false',
      }),
      ')',
    ];
  },
});
