import Document from '@tiptap/extension-document';
import Mention from '@tiptap/extension-mention';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { useEditor, EditorContent } from '@tiptap/react';

import suggestion from './suggestion.js';
// figure out a way to insert mentions dynamically in the editor
//figure out a way to parse the output of the editor to get text
// figure out a way to parse the input into a json object for the editor
//figure out a way to render the mentions correctly
// define your extension array
const extensions = [
  Document,
  Paragraph,
  Text,
  Mention.configure({
    HTMLAttributes: {
      class: 'mention',
    },
    suggestion,
  }),
];

export const TextInputWithMentions = ({ className }: { className: string }) => {
  const editor = useEditor({
    extensions,
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Hello World!' }],
        },
        { type: 'paragraph' },
        { type: 'paragraph' },
        { type: 'paragraph' },
        {
          type: 'paragraph',
          content: [
            { type: 'mention', attrs: { id: 'Cyndi Lauper', label: null } },
            { type: 'text', text: ' ' },
          ],
        },
        { type: 'paragraph' },
        { type: 'paragraph' },
      ],
    },
    editorProps: {
      attributes: {
        class: className,
      },
    },
  });

  return (
    <>
      <EditorContent editor={editor} />
      {JSON.stringify(editor?.getJSON(), null, 2)}
    </>
  );
};
