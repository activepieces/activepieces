import Document from '@tiptap/extension-document';
import HardBreak from '@tiptap/extension-hard-break';
import History from '@tiptap/extension-history';
import Mention, { MentionNodeAttrs } from '@tiptap/extension-mention';
import Paragraph from '@tiptap/extension-paragraph';
import Placeholder from '@tiptap/extension-placeholder';
import Text from '@tiptap/extension-text';
import { useEditor, EditorContent } from '@tiptap/react';
import { useCallback } from 'react';

import './tip-tap.css';
import { textMentionUtils } from '@/lib/text-input-utils';

const extensions = (placeholder?: string) => {
  return [
    Document,
    History,
    HardBreak,
    Placeholder.configure({
      placeholder,
    }),
    Paragraph.configure({
      HTMLAttributes: {},
    }),
    Text,
    Mention.configure({
      suggestion: {
        char: '',
      },
      deleteTriggerWithBackspace: true,
      renderHTML({ node }) {
        const mentionAttrs: MentionNodeAttrs =
          node.attrs as unknown as MentionNodeAttrs;
        return textMentionUtils.generateMentionHtmlElement(mentionAttrs);
      },
    }),
  ];
};

type TextInputWithMentionsProps = {
  className?: string;
  originalValue?: string;
  onChange: (value: string) => void;
  placeholder?: string;
};
export const TextInputWithMentions = ({
  className,
  originalValue,
  onChange,
  placeholder,
}: TextInputWithMentionsProps) => {
  //TODO: get previous steps metadata from the flow
  const content = [
    textMentionUtils.convertTextToTipTapJsonContent(originalValue ?? '', []),
  ];

  useCallback((mentionText: string) => {
    const jsonContent = textMentionUtils.convertTextToTipTapJsonContent(
      mentionText,
      [],
    );
    editor?.chain().focus().insertContent(jsonContent.content).run();
  }, []);

  const editor = useEditor({
    extensions: extensions(placeholder),
    content: {
      type: 'doc',
      content,
    },
    editorProps: {
      attributes: {
        class:
          className ??
          'w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
      },
    },
    onUpdate: ({ editor }) => {
      const content = editor.getJSON();
      const textResult = textMentionUtils.convertTiptapJsonToText(content);
      onChange(textResult);
    },
  });

  return <EditorContent editor={editor} />;
};
