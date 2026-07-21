import { ChatMention } from '@activepieces/shared';
import { Document } from '@tiptap/extension-document';
import { HardBreak } from '@tiptap/extension-hard-break';
import { History } from '@tiptap/extension-history';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Text } from '@tiptap/extension-text';
import { EditorContent, useEditor } from '@tiptap/react';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';

import { cn } from '@/lib/utils';

import { emojiSuggestion } from '../emoji/emoji-suggestion';

import { mentionExtension } from './mention-extension';
import { MentionCommandAttrs } from './mention-picker';
import { mentionSerialization } from './mention-serialization';
import { mentionSuggestion } from './mention-suggestion';

export const ChatMentionEditor = forwardRef<
  ChatMentionEditorHandle,
  ChatMentionEditorProps
>(({ placeholder, autoFocus, onChange, onSubmit, className }, ref) => {
  const suggestionOpenRef = useRef(false);
  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  // The editor is created once, so read the placeholder from a ref inside the
  // function form — a static string would freeze at its first-mount value.
  const placeholderRef = useRef(placeholder);
  placeholderRef.current = placeholder;

  const extensions = useMemo(
    () => [
      Document,
      Paragraph,
      Text,
      HardBreak,
      History,
      Placeholder.configure({
        placeholder: () => placeholderRef.current ?? '',
        emptyEditorClass:
          'before:content-[attr(data-placeholder)] before:text-muted-foreground before:opacity-75 before:float-left before:pointer-events-none before:h-0',
      }),
      mentionExtension.buildChatMentionExtension(
        mentionSuggestion.createMentionSuggestion({
          onOpenChange: (open) => {
            suggestionOpenRef.current = open;
          },
        }),
      ),
      emojiSuggestion.buildEmojiSuggestionExtension({
        onOpenChange: (open) => {
          suggestionOpenRef.current = open;
        },
      }),
    ],
    [],
  );

  const editor = useEditor({
    extensions,
    autofocus: autoFocus ? 'end' : false,
    editorProps: {
      attributes: {
        class: cn(
          'outline-none whitespace-pre-wrap break-words min-h-[44px] px-3 py-2.5 text-base sm:text-sm',
          className,
        ),
      },
      handleKeyDown: (_view, event) => {
        if (
          event.key === 'Enter' &&
          !event.shiftKey &&
          !suggestionOpenRef.current
        ) {
          event.preventDefault();
          onSubmitRef.current?.();
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: instance }) => {
      const value = mentionSerialization.editorJsonToValue(instance.getJSON());
      onChangeRef.current?.({ ...value, isEmpty: instance.isEmpty });
    },
  });

  // Placeholder only recomputes on a transaction, so dispatch an empty one to
  // force a re-read when the placeholder changes externally. No docChanged, so
  // onUpdate doesn't fire.
  useEffect(() => {
    if (!editor) return;
    editor.view.dispatch(editor.state.tr);
  }, [placeholder, editor]);

  const clear = useCallback(() => {
    editor?.commands.clearContent(true);
  }, [editor]);

  const focus = useCallback(() => {
    if (editor && !editor.isFocused) {
      editor.commands.focus('end');
    }
  }, [editor]);

  const insertText = useCallback(
    (text: string) => {
      if (!editor) {
        return;
      }
      const prefix = editor.isEmpty ? '' : ' ';
      editor.chain().focus('end').insertContent(`${prefix}${text}`).run();
    },
    [editor],
  );

  const insertMentionAtCaret = useCallback(
    (attrs: MentionCommandAttrs) => {
      if (!editor) {
        return;
      }
      editor
        .chain()
        .focus()
        .insertContent([
          { type: 'mention', attrs },
          { type: 'text', text: ' ' },
        ])
        .run();
    },
    [editor],
  );

  const insertEmoji = useCallback(
    (emoji: string) => {
      editor?.chain().focus().insertContent(emoji).run();
    },
    [editor],
  );

  useImperativeHandle(
    ref,
    () => ({ clear, focus, insertText, insertMentionAtCaret, insertEmoji }),
    [clear, focus, insertText, insertMentionAtCaret, insertEmoji],
  );

  return <EditorContent editor={editor} />;
});
ChatMentionEditor.displayName = 'ChatMentionEditor';

export type ChatMentionEditorValue = {
  content: string;
  mentions: ChatMention[];
  isEmpty: boolean;
};

export type ChatMentionEditorHandle = {
  clear: () => void;
  focus: () => void;
  insertText: (text: string) => void;
  insertMentionAtCaret: (attrs: MentionCommandAttrs) => void;
  insertEmoji: (emoji: string) => void;
};

export type ChatMentionEditorProps = {
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  onChange?: (value: ChatMentionEditorValue) => void;
  onSubmit?: () => void;
};
