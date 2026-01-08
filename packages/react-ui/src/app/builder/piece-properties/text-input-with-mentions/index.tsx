import { MentionNodeAttrs, Mention } from '@tiptap/extension-mention';
import { Placeholder } from '@tiptap/extension-placeholder';
import {
  useEditor,
  EditorContent,
  useEditorState,
  Editor,
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import './tip-tap.css';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { stepsHooks } from '@/features/pieces/lib/steps-hooks';
import { cn } from '@/lib/utils';
import { flowStructureUtil, isNil } from '@activepieces/shared';

import { useBuilderStateContext } from '../../builder-hooks';

import { textMentionUtils } from './text-input-utils';

function MenuBar({ editor }: { editor: Editor }) {
  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      return {
        isBold: ctx.editor.isActive('bold') ?? false,
        isItalic: ctx.editor.isActive('italic') ?? false,
        isHeading1: ctx.editor.isActive('heading', { level: 1 }) ?? false,
        isHeading2: ctx.editor.isActive('heading', { level: 2 }) ?? false,
        isBulletList: ctx.editor.isActive('bulletList') ?? false,
        isOrderedList: ctx.editor.isActive('orderedList') ?? false,
      };
    },
  });

  return (
    <div className="flex items-center gap-1 border-b p-2">
      <Button
        variant={editorState.isBold ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className="h-8 w-8 p-0"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant={editorState.isItalic ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className="h-8 w-8 p-0"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Separator orientation="vertical" className="h-6 mx-1" />
      <Button
        variant={editorState.isHeading1 ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className="h-8 w-8 p-0"
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        variant={editorState.isHeading2 ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className="h-8 w-8 p-0"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Separator orientation="vertical" className="h-6 mx-1" />
      <Button
        variant={editorState.isBulletList ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className="h-8 w-8 p-0"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant={editorState.isOrderedList ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className="h-8 w-8 p-0"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
    </div>
  );
}

type TextInputWithMentionsProps = {
  className?: string;
  initialValue?: unknown;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  inputAsEditor?: boolean;
};

const extensions = (placeholder?: string) => {
  return [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3, 4, 5, 6],
      },
    }),
    Placeholder.configure({
      placeholder,
    }),
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

function convertToText(value: unknown): string {
  if (isNil(value)) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  return JSON.stringify(value);
}

export const TextInputWithMentions = ({
  className,
  initialValue,
  onChange,
  disabled,
  placeholder,
  inputAsEditor = false,
}: TextInputWithMentionsProps) => {
  const steps = useBuilderStateContext((state) =>
    flowStructureUtil.getAllSteps(state.flowVersion.trigger),
  );
  const stepsMetadata = stepsHooks
    .useStepsMetadata(steps)
    .map(({ data: metadata }, index) => {
      if (metadata) {
        return {
          ...metadata,
          stepDisplayName: steps[index].displayName,
        };
      }
      return undefined;
    });

  const setInsertMentionHandler = useBuilderStateContext(
    (state) => state.setInsertMentionHandler,
  );

  const insertMention = (propertyPath: string) => {
    const mentionNode = textMentionUtils.createMentionNodeFromText(
      `{{${propertyPath}}}`,
      steps,
      stepsMetadata,
    );
    editor?.chain().focus().insertContent(mentionNode).run();
  };

  const editor = useEditor({
    editable: !disabled,
    extensions: extensions(placeholder),
    content: {
      type: 'doc',
      content: textMentionUtils.convertTextToTipTapJsonContent(
        convertToText(initialValue),
        steps,
        stepsMetadata,
      ),
    },
    editorProps: {
      attributes: {
        class: cn(
          className ??
            'w-full bg-background px-3 min-h-9 py-2 text-sm rounded-sm ring-offset-background  min-h-24 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
          textMentionUtils.inputWithMentionsCssClass,
          {
            'cursor-not-allowed opacity-50': disabled,
          },
        ),
      },
    },
    onUpdate: ({ editor }) => {
      const editorContent = editor.getJSON();
      const textResult =
        textMentionUtils.convertTiptapJsonToText(editorContent);
      if (onChange) {
        onChange(textResult);
      }
    },
    onFocus: () => {
      setInsertMentionHandler(insertMention);
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="border rounded-sm">
        {inputAsEditor && <MenuBar editor={editor} />}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
