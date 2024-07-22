import Document from '@tiptap/extension-document';
import Mention, { MentionNodeAttrs } from '@tiptap/extension-mention';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { useEditor, EditorContent } from '@tiptap/react';
import History from '@tiptap/extension-history'
import HardBreak from '@tiptap/extension-hard-break'
import { fromTextToTipTapJsonContent, fromTiptapJsonContentToText, generateMentionHtmlElement } from '../../../lib/text-input-utils';


const extensions = [
  Document,
  History,
  HardBreak,
  Paragraph.configure({
    HTMLAttributes: {
      class: 'text-base leading-[30px]',
    }
  }),
  Text,
  Mention.configure({
    suggestion: {
      char: ''
    },
    deleteTriggerWithBackspace: true,
    renderHTML({ node }) {
      const mentionAttrs: MentionNodeAttrs = node.attrs as unknown as MentionNodeAttrs;
      return generateMentionHtmlElement(mentionAttrs);
    },
  }),
];

const defaultClassName = ' w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50';
export const TextInputWithMentions = ({ className, originalValue, onChange }: { className?: string, originalValue?: string, onChange?: (value: string) => void }) => {
  //TODO: get previous steps metadata from the flow
  const content = [fromTextToTipTapJsonContent(originalValue??'', [])];
  const editor = useEditor({
    extensions,
    content: {
      type: 'doc',
      content,
    },
    editorProps: {
      attributes: {
        class: className??defaultClassName,
      },
    },
    onUpdate: ({ editor }) => {
      const content = editor.getJSON();
      const textResult = fromTiptapJsonContentToText(content);
      if (onChange) {
        onChange(textResult);
      }
      else {
        console.log({ textResult });
      }
    }
  });

  return (
    <>
      <EditorContent editor={editor} />
      {JSON.stringify(editor?.getJSON(), null, 2)}
    </>
  );
};
