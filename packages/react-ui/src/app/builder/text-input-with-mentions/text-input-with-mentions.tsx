import { flowHelper } from '@activepieces/shared';
import Document from '@tiptap/extension-document';
import HardBreak from '@tiptap/extension-hard-break';
import History from '@tiptap/extension-history';
import Mention, { MentionNodeAttrs } from '@tiptap/extension-mention';
import Paragraph from '@tiptap/extension-paragraph';
import Placeholder from '@tiptap/extension-placeholder';
import Text from '@tiptap/extension-text';
import { useEditor, EditorContent } from '@tiptap/react';

import './tip-tap.css';
import { piecesHooks } from '../../../features/pieces/lib/pieces-hook';
import { useBuilderStateContext } from '../builder-hooks';

import { textMentionUtils } from './text-input-utils';

type TextInputWithMentionsProps = {
  className?: string;
  originalValue?: string;
  onChange: (value: string) => void;
  placeholder?: string;
};
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

export const TextInputWithMentions = ({
  className,
  originalValue,
  onChange,
  placeholder,
}: TextInputWithMentionsProps) => {
  const flowVersion = useBuilderStateContext((state) => state.flowVersion);
  const steps = flowHelper.getAllSteps(flowVersion.trigger);
  const stepsMetadata = piecesHooks
    .useStepsMetadata(steps)
    .map((res) => res.data);

  const setInsertMentionHandler = useBuilderStateContext(
    (state) => state.setInsertMentionHandler,
  );

  const insertMention = (propertyPath: string) => {
    const jsonContent = textMentionUtils.convertTextToTipTapJsonContent(
      `{{${propertyPath}}}`,
      steps,
      stepsMetadata,
    );
    editor?.chain().focus().insertContent(jsonContent.content).run();
  };

  const content = [
    textMentionUtils.convertTextToTipTapJsonContent(
      originalValue ?? '',
      steps,
      stepsMetadata,
    ),
  ];
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
          ' w-full  rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
      },
    },
    onUpdate: ({ editor }) => {
      const content = editor.getJSON();
      const textResult = textMentionUtils.convertTiptapJsonToText(content);
      if (onChange) {
        onChange(textResult);
      }
    },
    onFocus: () => {
      setInsertMentionHandler(insertMention);
    },
  });

  return <EditorContent editor={editor} />;
};
