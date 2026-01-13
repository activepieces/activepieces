import { Bold } from '@tiptap/extension-bold';
import Document from '@tiptap/extension-document';
import { Image } from '@tiptap/extension-image';
import { Italic } from '@tiptap/extension-italic';
import { BulletList, ListItem, OrderedList } from '@tiptap/extension-list';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Strike } from '@tiptap/extension-strike';
import { TableKit } from '@tiptap/extension-table';
import Text from '@tiptap/extension-text';
import { Underline } from '@tiptap/extension-underline';
import { Focus, UndoRedo } from '@tiptap/extensions';
import { Markdown } from '@tiptap/markdown';
import { Editor, EditorContent, useEditor } from '@tiptap/react';
import React, { useImperativeHandle } from 'react';

import { cn } from '@/lib/utils';

export const MarkdownInput = React.forwardRef<
  Editor | null,
  MarkdownInputProps
>(
  (
    {
      initialValue,
      onChange,
      className,
      disabled,
      placeholder,
      placeholderClassName,
      onlyEditableOnDoubleClick,
    }: MarkdownInputProps,
    ref: React.Ref<Editor | null>,
  ) => {
    const editor = useEditor({
      extensions: [
        Document,
        BulletList,
        OrderedList,
        Text,
        ListItem,
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
        EmptyLineParagraphExtension,
        UndoRedo.configure({
          depth: 10,
        }),
      ],
      content: initialValue,
      contentType: 'markdown',
      editable: !disabled && !onlyEditableOnDoubleClick,
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
        if (onlyEditableOnDoubleClick) {
          editor.setEditable(false);
        }
      },
      parseOptions: {
        preserveWhitespace: 'full',
      },
    });
    useImperativeHandle(ref, () => editor, [editor]);

    // Stop all events from bubbling to prevent dnd-kit/React Flow interference with selection
    const stopEventPropagation = (e: React.SyntheticEvent) => {
      if (disabled || !editor.isEditable) return;
      e.stopPropagation();
    };

    return (
      //gotta add this nodrag nopan to prevent dnd-kit and React Flow interference with selection
      <div
        className={cn('relative h-full nowheel', {
          'nodrag nopan': !editor.isEditable,
        })}
        onPointerDown={stopEventPropagation}
        onMouseDown={stopEventPropagation}
        onClick={stopEventPropagation}
        onPointerUp={stopEventPropagation}
        onMouseUp={stopEventPropagation}
        onDoubleClick={() => {
          if (onlyEditableOnDoubleClick && !disabled) {
            editor.setEditable(true);
          }
        }}
      >
        {/**didn't use tiptap placeholder because it disappears when the editor is not editable */}
        {editor.getText().trim() === '' && !disabled && (
          <div
            className={cn(
              placeholderClassName,
              'opacity-75 pointer-events-none  absolute  z-50 ',
            )}
          >
            {' '}
            {placeholder}{' '}
          </div>
        )}
        <EditorContent
          className={editor.isEditable ? 'cursor-text select-text' : ''}
          key={disabled ? 'disabled' : 'enabled'}
          editor={editor}
        />
      </div>
    );
  },
);

type MarkdownInputProps = {
  initialValue: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  onlyEditableOnDoubleClick?: boolean;
  placeholderClassName?: string;
};

MarkdownInput.displayName = 'MarkdownInput';

//https://github.com/ueberdosis/tiptap/issues/7269#issuecomment-3669021079
const EmptyLineParagraphExtension = Paragraph.extend({
  renderMarkdown: (node, helpers) => {
    const view = helpers.renderChildren(node.content ?? []);
    if (!view || view.trim() === '') {
      return '<br>';
    }
    return view;
  },
});
