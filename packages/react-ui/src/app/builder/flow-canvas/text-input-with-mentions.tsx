import { ActionType, flowHelper, TriggerType } from '@activepieces/shared';
import Document from '@tiptap/extension-document';
import HardBreak from '@tiptap/extension-hard-break';
import History from '@tiptap/extension-history';
import Mention, { MentionNodeAttrs } from '@tiptap/extension-mention';
import Paragraph from '@tiptap/extension-paragraph';
import Placeholder from '@tiptap/extension-placeholder';
import Text from '@tiptap/extension-text';
import { useEditor, EditorContent } from '@tiptap/react';

import { piecesHooks } from '../../../features/pieces/lib/pieces-hook';
import {
  fromTextToTipTapJsonContent,
  fromTiptapJsonContentToText,
  generateMentionHtmlElement,
  keysWithinPath,
} from '../../../lib/text-input-utils';
import './tip-tap.css';
import { useBuilderStateContext } from '../builder-hooks';
import { StepOutputStructureUtil } from '../step-output-utils';

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
        return generateMentionHtmlElement(mentionAttrs);
      },
    }),
  ];
};

const defaultClassName =
  ' w-full  rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50';
export const TextInputWithMentions = ({
  className,
  originalValue,
  onChange,
  placeholder,
  extraClasses,
}: {
  className?: string;
  originalValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  extraClasses?: string;
}) => {
  const flowVersion = useBuilderStateContext((state) => state.flowVersion);
  const steps = flowHelper
    .getAllSteps(flowVersion.trigger)
    .map((step) => ({ step }));
  const piecesMetadata = piecesHooks
    .usePiecesMetadata(steps)
    .filter((res) => res.data !== undefined)
    .map((res) => res.data)
    .map((res) => {
      const stepNamesThatUseThisMetadata = steps
        .filter(({ step }) => {
          if (
            step.type === ActionType.PIECE ||
            step.type === TriggerType.PIECE
          ) {
            return (
              step.settings.pieceName === res.pieceName &&
              step.settings.pieceVersion === res.pieceVersion
            );
          }
          return (
            (step.type === ActionType.CODE ||
              step.type === ActionType.BRANCH ||
              step.type === TriggerType.EMPTY ||
              step.type === ActionType.LOOP_ON_ITEMS) &&
            step.type === res.type
          );
        })
        .map(({ step }) => step.name);
      return { ...res, stepNamesThatUseThisMetadata };
    });

  const setInsertMentionHandler = useBuilderStateContext(
    (state) => state.setInsertMentionHandler,
  );

  const getStepMetadataFromPath = (path: string) => {
    const itemPathWithoutInterpolationDenotation = path.slice(
      2,
      path.length - 2,
    );
    const stepName = keysWithinPath(itemPathWithoutInterpolationDenotation)[0];
    const step = flowHelper.getStep(flowVersion, stepName);
    if (step) {
      const dfsIndex = StepOutputStructureUtil.findStepIndex(
        flowVersion.trigger,
        stepName,
      );
      const data = piecesMetadata.find((res) =>
        res.stepNamesThatUseThisMetadata.includes(stepName),
      );
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
    const jsonContent = fromTextToTipTapJsonContent({
      propertyPath: `{{${propertyPath}}}`,
      stepMetadataFinder: getStepMetadataFromPath,
    });
    editor?.chain().focus().insertContent(jsonContent.content).run();
  };
  const content = [
    fromTextToTipTapJsonContent({
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
      const textResult = fromTiptapJsonContentToText(content);
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
