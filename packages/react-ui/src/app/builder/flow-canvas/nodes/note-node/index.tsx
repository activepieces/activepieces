import { useDraggable } from '@dnd-kit/core';
import { NodeProps, NodeResizeControl } from '@xyflow/react';
import { flowCanvasConsts } from '../../utils/consts';
import { ApNoteNode } from '../../utils/types';
import { useState } from 'react';
import { useBuilderStateContext } from '../../../builder-hooks';
import { Textarea } from '@/components/ui/textarea';

const controlStyle = {
  background: 'transparent',
  border: 'none',
};
const ApNoteCanvasNode = (props: NodeProps & Omit<ApNoteNode, 'position'>) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: props.id,
    data: {
      type: flowCanvasConsts.DRAGGED_NOTE_TAG,
    },
  });
  const [draggedNote, resizeNote, note] = useBuilderStateContext((state) => [state.draggedNote, state.resizeNote, state.getNoteById(props.id)]);
  const [showResizer, setShowResizer] = useState(false);
  const [size, setSize] = useState(props.data.size);
  if (draggedNote?.id === props.id || note === null) {
    return null;
  }
  return (
    <>
    {
      showResizer && ( <NodeResizeControl
        style={controlStyle}
        minWidth={200}
        minHeight={180}
        maxWidth={550}
        maxHeight={600}
        onResize={(_, params) => {
          // update the size locally means that we don't re-render the whole graph
          setSize({ width: params.width, height: params.height });
          resizeNote(props.id, { width: params.width, height: params.height });
        }}
      >
        <div className="rounded-full bg-background border border-solid border-blue-300 -translate-x-1/2 -translate-y-1/2 p-1"></div>
      </NodeResizeControl>)
    }
     
      <div ref={setNodeRef} {...attributes} {...listeners}>
        <NoteContent onBlur={() => setShowResizer(false)} onFocus={() => setShowResizer(true)} size={size} id={props.id} content={note?.content} creator={props.data.creator}></NoteContent>
      </div>
    </>
  );
};
ApNoteCanvasNode.displayName = 'ApNoteCanvasNode';


const NoteContent = ({
  size: { width, height },
  id,
  content,
  creator,
  onFocus,
  onBlur,
}: NoteContentProps) => {
  const updateContent = useBuilderStateContext((state) => state.updateContent);
  return (
    <div
      onFocus={() => onFocus?.()}
      onBlur={() => onBlur?.()}
      id={id}
      className="rounded-md border bg-yellow-200 border-solid shadow-sm border-yellow-500 p-2 flex flex-col gap-2"
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      <Textarea className='grow bg-transparent text-yellow-500 focus-visible:outline-none resize-none overflow-hidden border-none p-0' minRows={2} maxRows={10} value={content} onChange={(e) => updateContent(id, e.target.value)}>
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
  onFocus?: () => void;
  onBlur?: () => void;
}