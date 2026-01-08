import { Image } from '@tiptap/extension-image'
import { TableKit } from '@tiptap/extension-table'
import { Markdown } from '@tiptap/markdown'
import { Editor, EditorContent, useEditor } from '@tiptap/react'
import { Strike} from '@tiptap/extension-strike'
import { Bold} from '@tiptap/extension-bold'
import { Italic} from '@tiptap/extension-italic'
import { Underline} from '@tiptap/extension-underline'
import { StarterKit } from '@tiptap/starter-kit'
import { cn } from '@/lib/utils'
import { HardBreak } from '@tiptap/extension-hard-break';
import { Focus } from '@tiptap/extensions'
import React, { useEffect, useImperativeHandle, useState } from 'react'
import { Button } from './button'
import { BoldIcon, ItalicIcon, Strikethrough, UnderlineIcon } from 'lucide-react'

export const MarkdownInput = React.forwardRef<Editor | null, MarkdownInputProps>(({
    initialValue,
    onChange,
    className,
    disabled
}: MarkdownInputProps, ref: React.Ref<Editor | null>) => {

  const editor = useEditor({
    extensions: [
      StarterKit,  Focus.configure({
        className: 'has-focus',
        mode: 'all',
      }),
      Markdown,
      Image,
      TableKit,
      Strike,
      Bold,
      Italic,
      Underline,
      HardBreak
    ],
    content: initialValue,
    contentType: 'markdown',
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getMarkdown())
    },
    editorProps:{
        attributes:{
            class: cn('bg-transparent text-inherit outline-none border-none p-0 m-0',className),
              spellcheck: 'false'
        }
    },
    onBlur: ()=>{
      window.getSelection()?.removeAllRanges();
    }
  })

  useImperativeHandle(ref, () => editor, [editor])

  // Stop all events from bubbling to prevent dnd-kit/React Flow interference with selection
  const stopEventPropagation = (e: React.SyntheticEvent) => {
    if (disabled) return;
    e.stopPropagation();
  };

  return (
    //gotta add this nodrag nopan nowheel to prevent dnd-kit and React Flow interference with selection
    <div 
      className={disabled? '': 'nodrag nopan nowheel'}
      onPointerDown={stopEventPropagation} 
      onMouseDown={stopEventPropagation}
      onClick={stopEventPropagation}
      onPointerUp={stopEventPropagation}
      onMouseUp={stopEventPropagation}
    >
      <EditorContent editor={editor} />
    </div>
  )
})
  


type MarkdownInputProps = {
    initialValue: string
    onChange: (value: string) => void
    className?: string,
    disabled?: boolean
}


export const MarkdownTools = ({editor}: {editor: Editor}) => {
  const isStrikeActive = editor.isActive('strike');
  const isBoldActive = editor.isActive('bold');
  const isItalicActive = editor.isActive('italic');
  const isUnderlineActive = editor.isActive('underline');
  //because tiptap doesn't instantly set the active state, we need to use a state to track it
  const [activeState,setActiveState] = useState({
    isStrikeActive,
    isBoldActive,
    isItalicActive,
    isUnderlineActive,
  });
  const handleStrike = () => {

    editor.chain().focus().toggleStrike().run();
    editor.commands.focus();
    setActiveState({
      ...activeState,
      isStrikeActive: !isStrikeActive,
    });
  }
  const handleBold = () => {
    editor.chain().focus().toggleBold().run();
    editor.commands.focus();
    setActiveState({
      ...activeState,
      isBoldActive: !isBoldActive,
    });
  }
  const handleItalic = () => {
    editor.chain().focus().toggleItalic().run();
    editor.commands.focus();
    setActiveState({
      ...activeState,
      isItalicActive: !isItalicActive,
    });
  }
  const handleUnderline = () => {
    editor.chain().focus().toggleUnderline().run();
    editor.commands.focus();
    setActiveState({
      ...activeState,
      isUnderlineActive: !isUnderlineActive,
    });
  }
  useEffect(() => {
    setActiveState({
      isStrikeActive,
      isBoldActive,
      isItalicActive,
      isUnderlineActive,
    });
  }, [isStrikeActive, isBoldActive, isItalicActive, isUnderlineActive]);

  return (
    <div className="flex items-center gap-2" key={`${isStrikeActive}-${isBoldActive}-${isItalicActive}-${isUnderlineActive}`}>
      <Button onClick={handleStrike} size={'icon'} variant={isStrikeActive ? 'default' : 'ghost'}><Strikethrough className='size-4' /></Button>
      <Button onClick={handleBold} size={'icon'} variant={isBoldActive ? 'default' : 'ghost'}><BoldIcon className='size-4' /></Button>
      <Button onClick={handleItalic} size={'icon'} variant={isItalicActive ? 'default' : 'ghost'}><ItalicIcon className='size-4' /></Button>
      <Button onClick={handleUnderline} size={'icon'} variant={isUnderlineActive ? 'default' : 'ghost'}><UnderlineIcon className='size-4' /></Button>
    </div>
  )
}