import { ActionType, flowHelper, TriggerType } from '@activepieces/shared';
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

import { textMentionUtils } from '@/lib/text-input-utils';

const defaultClassName =
  ' w-full  rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50';
type TextInputWithMentionsProps = {
  className?: string;
  originalValue?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  extraClasses?: string;
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
  extraClasses,
}: TextInputWithMentionsProps) => {
  const flowVersion = useBuilderStateContext((state) => state.flowVersion);
  const piecesMetadata = piecesHooks.useStepsMetadata(
    flowHelper.getAllSteps(flowVersion.trigger),
  );
  const setInsertMentionHandler = useBuilderStateContext(
    (state) => state.setInsertMentionHandler,
  );

  const getStepMetadataFromPath = (path: string) => {
    const itemPathWithoutInterpolationDenotation = path.slice(
      2,
      path.length - 2,
    );
    const stepName = textMentionUtils.keysWithinPath(
      itemPathWithoutInterpolationDenotation,
    )[0];
    const step = flowHelper.getStep(flowVersion, stepName);
    if (step) {
      const dfsIndex = flowHelper.findStepDfsIndex(
        flowVersion.trigger,
        step.name,
      );

      const data = piecesMetadata.find((res) => {
        if (
          (step.type === ActionType.PIECE || step.type === TriggerType.PIECE) &&
          res.data?.type === step.type
        ) {
          return res.data?.pieceName === step.settings.pieceName;
        }
        return res.data?.type === step.type;
      })?.data;

      if (data) {
        return {
          ...data,
          dfsIndex,
        };
      }
    }
    return undefined;
  };

  const insertMention = (propertyPath: string) => {
    const jsonContent = textMentionUtils.convertTextToTipTapJsonContent({
      propertyPath: `{{${propertyPath}}}`,
      stepMetadataFinder: getStepMetadataFromPath,
    });
    editor?.chain().focus().insertContent(jsonContent.content).run();
  };
  const content = [
    textMentionUtils.convertTextToTipTapJsonContent({
      propertyPath: originalValue ?? '',
      stepMetadataFinder: getStepMetadataFromPath,
    }),
  ];
  const editor = useEditor({
    extensions: extensions(placeholder),
    content: {
      type: 'doc',
      content,
    },
    editorProps: {
      attributes: {
        class: className ?? defaultClassName + ' ' + extraClasses,
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
