import {
  BaseEdge,
  ConnectionLineComponentProps,
  EdgeProps,
  getBezierPath,
} from '@xyflow/react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { cn } from '@/lib/utils';

import { flowCanvasConsts } from '../utils/consts';
import { ApNoteAnchorEdge } from '../utils/types';

export const ApNoteAnchorCanvasEdge = ({
  source,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  data,
}: EdgeProps & ApNoteAnchorEdge) => {
  const isNoteBeingMoved = useBuilderStateContext(
    (state) => state.draggedNote?.id === source,
  );
  if (isNoteBeingMoved) {
    return null;
  }
  const [path] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  return (
    <BaseEdge
      path={path}
      interactionWidth={0}
      className={cn(
        '!stroke-current',
        flowCanvasConsts.NOTE_COLOR_CLASS_NAME[data.color],
      )}
      style={flowCanvasConsts.NOTE_EDGE_STROKE_STYLE}
    />
  );
};

export const NoteConnectionLine = ({
  fromX,
  fromY,
  fromPosition,
  toX,
  toY,
  toPosition,
  fromNode,
}: ConnectionLineComponentProps) => {
  const noteId = fromNode?.id ?? null;
  const noteColor = useBuilderStateContext((state) =>
    noteId ? state.getNoteById(noteId)?.color ?? null : null,
  );
  const [path] = getBezierPath({
    sourceX: fromX,
    sourceY: fromY,
    sourcePosition: fromPosition,
    targetX: toX,
    targetY: toY,
    targetPosition: toPosition,
  });
  return (
    <path
      d={path}
      fill="none"
      className={cn(
        '!stroke-current',
        noteColor
          ? flowCanvasConsts.NOTE_COLOR_CLASS_NAME[noteColor]
          : 'text-primary',
      )}
      style={flowCanvasConsts.NOTE_EDGE_STROKE_STYLE}
    />
  );
};
