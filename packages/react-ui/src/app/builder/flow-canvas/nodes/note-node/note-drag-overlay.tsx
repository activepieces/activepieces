import { useReactFlow } from '@xyflow/react';
import { useRef, useState } from 'react';

import { useSidebar } from '@/components/ui/sidebar-shadcn';
import { isNil } from '@activepieces/shared';

import { useBuilderStateContext } from '../../../builder-hooks';
import { NoteDragOverlayMode } from '../../../state/notes-state';
import {
  useCursorPosition,
  useCursorPositionEffect,
} from '../../cursor-position-context';
import { flowCanvasConsts } from '../../utils/consts';

import { NoteContent } from '.';
const NoteDragOverlay = () => {
  const { open } = useSidebar();
  const { cursorPosition } = useCursorPosition();
  const [overlayPosition, setOverlayPosition] =
    useState<typeof cursorPosition>(cursorPosition);
  const builderNavigationBar = document.getElementById(
    flowCanvasConsts.BUILDER_NAVIGATION_SIDEBAR_ID,
  );
  const [draggedNote, noteDragOverlayMode, addNote, draggedNoteOffset] =
    useBuilderStateContext((state) => [
      state.draggedNote,
      state.noteDragOverlayMode,
      state.addNote,
      state.draggedNoteOffset,
    ]);
  const reactFlow = useReactFlow();
  const containerRef = useRef<HTMLDivElement>(null);
  const builderNavigationBarWidth = open
    ? builderNavigationBar?.clientWidth ?? 0
    : 0;

  const nodeSizeWithZoom = {
    width: (draggedNote?.size.width ?? 0) * reactFlow.getZoom(),
    height: (draggedNote?.size.height ?? 0) * reactFlow.getZoom(),
  };

  const offsetX = draggedNoteOffset
    ? draggedNoteOffset.x
    : nodeSizeWithZoom.width / 2;
  const offsetY = draggedNoteOffset
    ? draggedNoteOffset.y
    : nodeSizeWithZoom.height / 2;

  const left = `${overlayPosition.x - offsetX - builderNavigationBarWidth}px`;
  const top = `${
    overlayPosition.y - offsetY - flowCanvasConsts.BUILDER_HEADER_HEIGHT
  }px`;
  useCursorPositionEffect((position) => {
    setOverlayPosition(position);
  });
  const hideOverlay = isNil(draggedNote) || isNil(noteDragOverlayMode);

  if (hideOverlay) {
    return null;
  }
  return (
    <div
      className={'absolute !cursor-grabbing note-drag-overlay'}
      ref={containerRef}
      onClick={() => {
        if (noteDragOverlayMode === NoteDragOverlayMode.CREATE) {
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            const positionOnCanvas = reactFlow.screenToFlowPosition({
              x: rect.left,
              y: rect.top,
            });
            addNote({
              content: flowCanvasConsts.DEFAULT_NOTE_CONTENT,
              position: positionOnCanvas,
              size: draggedNote.size,
              color: flowCanvasConsts.DEFAULT_NOTE_COLOR,
            });
          }
        }
      }}
      style={{
        left,
        top,
        height: `${draggedNote.size.height}px`,
        width: `${draggedNote.size.width}px`,
        transform: `scale(${reactFlow.getZoom()})`,
        transformOrigin: '0 0',
      }}
    >
      <NoteContent
        isDragging={true}
        note={{
          ...draggedNote,
        }}
      ></NoteContent>
    </div>
  );
};

export default NoteDragOverlay;
