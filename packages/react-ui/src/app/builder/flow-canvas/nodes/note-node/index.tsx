import { useDraggable } from '@dnd-kit/core';
import { NodeProps, NodeResizeControl } from '@xyflow/react';
import { flowCanvasConsts } from '../../utils/consts';
import { ApNoteNode } from '../../utils/types';
import { useRef, useState } from 'react';
import { useBuilderStateContext } from '../../../builder-hooks';
import { useDebouncedCallback } from 'use-debounce';
import { cn } from '@/lib/utils';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { MarkdownInput, MarkdownTools } from '@/components/ui/markdown-input';
import { Editor } from '@tiptap/core';
import { DragHandleDots2Icon } from '@radix-ui/react-icons';

const ApNoteCanvasNode = (props: NodeProps & Omit<ApNoteNode, 'position'>) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: props.id,
    data: {
      type: flowCanvasConsts.DRAGGED_NOTE_TAG,
    },
  });
  const [draggedNote, resizeNote, note] = useBuilderStateContext((state) => [state.draggedNote, state.resizeNote, state.getNoteById(props.id)]);
  const [size, setSize] = useState(props.data.size);
  if (draggedNote?.id === props.id || note === null) {
    return null;
  }
  return (
    <div className='group note-node'>
      <NodeResizeControl
        minWidth={200}
        minHeight={180}
        maxWidth={550}
        maxHeight={600}
        onResize={(_, params) => {
          // update the size locally means that we don't re-render the whole graph
          setSize({ width: params.width, height: params.height });
        }}
        onResizeEnd={(_, params) => {
          resizeNote(props.id, { width: params.width, height: params.height });
        }}
      >
        <button className={cn("group-focus-within:block hidden outline-none cursor-nwse-resize  rounded-full bg-stone-50 border border-solid border-primary -translate-x-[60%] -translate-y-[60%] p-0.75", {
        })}></button>
      </NodeResizeControl>
     
      <div key={props.data.size.height + props.data.size.width + note.position.x + note.position.y}  ref={setNodeRef} {...attributes} {...listeners} className={cn('p-0.5 group-focus-within:border-solid group-focus-within:border-primary border border-transparent rounded-md', {
      })}> 
        <NoteContent size={size} id={props.id} content={note?.content} creator={props.data.creator}/>
        </div>
    </div>
  );
};
ApNoteCanvasNode.displayName = 'ApNoteCanvasNode';


const NoteContent = ({
  size: { width, height },
  id,
  content,
  creator,
  isDragging
}: NoteContentProps) => {
  const [localContent, setLocalContent] = useState(content);
  const [updateContent,readonly] = useBuilderStateContext((state) => [state.updateContent,state.readonly]);
  const debouncedUpdateContent = useDebouncedCallback((id: string, content: string) => {
    updateContent(id, content)
  }, 500);
  const editorRef = useRef<Editor | null>(null);
  return (
    <div
      id={id}
      className="rounded-md bg-amber-200 border-solid shadow-md p-2 flex flex-col gap-2 relative"
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      {
        !isDragging && !readonly && editorRef.current && <NoteTools editor={editorRef.current} />
      }

      <div 
        className='grow h-full overflow-auto' 
        onDoubleClick={(e) => {
          e.stopPropagation();
          editorRef.current?.commands.focus();
        }}
      >
      <MarkdownInput ref={editorRef} disabled={isDragging || readonly} initialValue={localContent} className='cursor-text text-amber-700 text-sm' onChange={(value: string) => {
        setLocalContent(value);
        debouncedUpdateContent(id, value);
      }} />

      </div>
    
      <div className='flex items-center justify-between gap-2'> 
      <TextWithTooltip tooltipMessage={creator}>
      <div className="text-amber-700 font-semibold text-xs">
       {creator}
      </div>
      </TextWithTooltip>
      <DragHandleDots2Icon className='size-4 text-amber-700 cursor-grab' />
      </div>
    </div>
  );
};
export { ApNoteCanvasNode, NoteContent };
type NoteContentProps = {
  size: { width: number; height: number };
  id: string;
  content: string;
  creator: string;
  isDragging?: boolean;
}

const NoteTools = ({editor}: {editor: Editor}) => {
  return (
    <div className="absolute -top-[50px] w-full left-0">
      <div className="flex items-center justify-center">
        <div className='p-1 bg-background shadow-md rounded-md scale-75'>
        <MarkdownTools editor={editor} />
        </div>
    </div>
    </div>
  )
}