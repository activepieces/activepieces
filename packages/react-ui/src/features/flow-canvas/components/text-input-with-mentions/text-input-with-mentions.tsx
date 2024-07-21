import Document from '@tiptap/extension-document';
import Mention from '@tiptap/extension-mention';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { useEditor, EditorContent } from '@tiptap/react';



// figure out a way to insert mentions dynamically in the editor
//figure out a way to parse the output of the editor to get text
// figure out a way to parse the input into a json object for the editor

// define your extension array
const extensions = [
  Document,
  Paragraph.configure({
    HTMLAttributes: {
      class: 'text-base leading-[30px]',
    }
  }),
  Text,
  
  Mention.configure({
    renderHTML({ options, node }) {
      const imageUrl = `https://cdn.activepieces.com/pieces/webhook.svg`;//TODO: replace with the actual image url
      
      // Creating the main div element
      const mentionElement = document.createElement('span');
      mentionElement.className = 'inline-flex bg-[#fafafa] border border-[#9e9e9e] border-solid items-center gap-2 py-1 px-2 rounded-[3px]  ';
     
      // Creating the image element
      const imgElement = document.createElement('img');
      imgElement.src = imageUrl;
      imgElement.className = 'object-fit w-4 h-4';
      
      // Adding the image element to the main div
      mentionElement.appendChild(imgElement);
      
      // Creating the second child div element
      const mentiontextDiv = document.createElement('div');
      mentiontextDiv.className = 'text-base text-accent-foreground leading-[18px]';
      mentiontextDiv.textContent = node.attrs.id;
      
      // Adding the text div to the main div
      mentionElement.appendChild(mentiontextDiv);
      return mentionElement;
    },
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
