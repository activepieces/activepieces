import { useDraggable } from '@dnd-kit/core';
import { NodeProps, NodeResizeControl } from '@xyflow/react';
import { flowCanvasConsts } from '../../utils/consts';
import { ApNoteNode } from '../../utils/types';
import { useState } from 'react';
import { useBuilderStateContext } from '../../../builder-hooks';
import { Textarea } from '@/components/ui/textarea';
import { useDebouncedCallback } from 'use-debounce';
import { cn } from '@/lib/utils';

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
    <div className='group'>
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
        <button className={cn("group-focus-within:block hidden cursor-nwse-resize  rounded-full bg-background border border-solid border-primary -translate-x-[50%] -translate-y-[50%] p-0.75", {
        })}></button>
      </NodeResizeControl>
     
      <div ref={setNodeRef} {...attributes} {...listeners} className={cn('p-0.5 group-focus-within:border-solid group-focus-within:border-primary border border-transparent rounded-md', {
      })}>
        <NoteContent size={size} id={props.id} content={note?.content} creator={props.data.creator}></NoteContent>
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
}: NoteContentProps) => {
  const [localContent, setLocalContent] = useState(content);
  const updateContent = useBuilderStateContext((state) => state.updateContent);
  const debouncedUpdateContent = useDebouncedCallback((id: string, content: string) => {
    updateContent(id, content)
  }, 500);
  return (
    <div
      id={id}
      className="rounded-md bg-yellow-200 border-solid shadow-sm p-2 flex flex-col gap-2"
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      <Textarea className='grow bg-transparent text-yellow-500 focus-visible:outline-none resize-none overflow-hidden border-none p-0'
       minRows={2} 
       maxRows={10}
      value={localContent}
      onChange={(e) => {
        setLocalContent(e.target.value);
        debouncedUpdateContent(id, e.target.value);
      }}
      >
      </Textarea>
      <div className="text-yellow-500 font-semibold text-xs">
        {creator}
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
}