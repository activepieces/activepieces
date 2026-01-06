import { useDraggable } from '@dnd-kit/core';
import { NodeProps, NodeResizeControl } from '@xyflow/react';

import { useNotesContext } from '../notes-context';
import { flowCanvasConsts } from '../utils/consts';
import { ApNoteNode } from '../utils/types';
import { useState } from 'react';

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
  const [size, setSize] = useState(props.data.size);
  const { draggedNote, resizeNote } = useNotesContext();
  if (draggedNote?.id === props.id) {
    return null;
  }
  return (
    <>
      <NodeResizeControl
        style={controlStyle}
        minWidth={100}
        minHeight={150}
        maxWidth={550}
        maxHeight={600}
        onResize={(_, params) => {
          // update the size locally means that we don't re-render the whole graph
          setSize({ width: params.width, height: params.height });
          resizeNote(props.id, { width: params.width, height: params.height });
        }}
      >
        <div className="rounded-full bg-background border border-solid border-blue-300 -translate-x-1/2 -translate-y-1/2 p-2"></div>
      </NodeResizeControl>
      <div ref={setNodeRef} {...attributes} {...listeners}>
        <NoteOverlay size={size} id={props.id}></NoteOverlay>
      </div>
    </>
  );
};
ApNoteCanvasNode.displayName = 'ApNoteCanvasNode';

const NoteOverlay = ({
  size: { width, height },
  id,
}: {
  size: { width: number; height: number };
  id: string;
}) => {
  return (
    <div
      id={id}
      className="rounded-md border bg-yellow-200 border-solid shadow-sm border-yellow-500 p-2"
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    ></div>
  );
};
export { ApNoteCanvasNode, NoteOverlay };
