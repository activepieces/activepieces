import { Bold } from '@tiptap/extension-bold';
import { HardBreak } from '@tiptap/extension-hard-break';
import { Image } from '@tiptap/extension-image';
import { Italic } from '@tiptap/extension-italic';
import { Strike } from '@tiptap/extension-strike';
import { TableKit } from '@tiptap/extension-table';
import { Underline } from '@tiptap/extension-underline';
import { Focus } from '@tiptap/extensions';
import { Markdown } from '@tiptap/markdown';
import { Editor, EditorContent, useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import React, { useImperativeHandle } from 'react';

import { cn } from '@/lib/utils';

const convertToHtmlWithBlankLines = (text: string): string => {
  const lines = text.split('\n\n');
  return lines
    .map((line) => {
      if (line.trim() === '') {
        return '<p></p>';
      }
      return line;
    })
    .join('');
};
export const MarkdownInput = React.forwardRef<
  Editor | null,
  MarkdownInputProps
>(
  (
    { initialValue, onChange, className, disabled }: MarkdownInputProps,
    ref: React.Ref<Editor | null>,
  ) => {
    const editor = useEditor({
      extensions: [
        StarterKit,
        Focus.configure({
          className: 'has-focus',
          mode: 'all',
        }),
        Markdown,
        Image.configure({
          inline: true,
        }),
        TableKit,
        Strike,
        Bold,
        Italic,
        Underline,
        HardBreak,
      ],
      content: convertToHtmlWithBlankLines(initialValue),
      contentType: 'markdown',
      editable: !disabled,
      onUpdate: ({ editor }) => {
        onChange(editor.getMarkdown());
      },
      editorProps: {
        attributes: {
          class: cn(
            'bg-transparent text-inherit outline-none border-none p-0 m-0',
            className,
          ),
          spellcheck: 'false',
        },
      },
      onBlur: () => {
        window.getSelection()?.removeAllRanges();
      },
      parseOptions: {
        preserveWhitespace: 'full',
      },
    });

    useImperativeHandle(ref, () => editor, [editor]);

    // Stop all events from bubbling to prevent dnd-kit/React Flow interference with selection
    const stopEventPropagation = (e: React.SyntheticEvent) => {
      if (disabled) return;
      e.stopPropagation();
    };

    return (
      //gotta add this nodrag nopan nowheel to prevent dnd-kit and React Flow interference with selection
      <div
        className={disabled ? '' : 'nodrag nopan nowheel'}
        onPointerDown={stopEventPropagation}
        onMouseDown={stopEventPropagation}
        onClick={stopEventPropagation}
        onPointerUp={stopEventPropagation}
        onMouseUp={stopEventPropagation}
      >
        <EditorContent editor={editor} />
      </div>
    );
  },
);

type MarkdownInputProps = {
  initialValue: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
};

MarkdownInput.displayName = 'MarkdownInput';
