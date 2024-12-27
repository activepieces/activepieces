import Code from '@tiptap/extension-code';
import { markInputRule, markPasteRule, mergeAttributes } from '@tiptap/react';


const inputRegex = /{{(.*?)}}$/
const pasteRegex = /{{(.*?)}}/g
export const CustomCodeExtension = Code.extend({
  renderHTML({ HTMLAttributes }) {
    return ['code', mergeAttributes(HTMLAttributes), 0];
  },
  addInputRules() {
    return [
      markInputRule({
        find: inputRegex,
        type: this.type,
      }),
    ]
  },
  addPasteRules() {
    return [
      markPasteRule({
        find: pasteRegex,
        type: this.type,
      }),
    ]
  },
});
