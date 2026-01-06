import { useReactFlow } from '@xyflow/react';
import { useRef, useState } from 'react';

import { useSidebar } from '@/components/ui/sidebar-shadcn';
import { apId, isNil } from '@activepieces/shared';

import {
  useCursorPosition,
  useCursorPositionEffect,
} from './cursor-position-context';
import { NoteOverlay } from './nodes/note-node';
import { NoteDragOverlayMode, useNotesContext } from './notes-context';
import { flowCanvasConsts } from './utils/consts';

const NoteDragOverlay = () => {
  const { open } = useSidebar();
  const { cursorPosition } = useCursorPosition();
  const [overlayPosition, setOverlayPosition] =
    useState<typeof cursorPosition>(cursorPosition);
  const builderNavigationBar = document.getElementById(
    flowCanvasConsts.BUILDER_NAVIGATION_SIDEBAR_ID,
  );
  const reactFlow = useReactFlow();
  const containerRef = useRef<HTMLDivElement>(null);
  const containerRect = containerRef.current?.getBoundingClientRect();
  const { draggedNote, noteDragOverlayMode, addNote } = useNotesContext();
  const builderNavigationBarWidth = open
    ? builderNavigationBar?.clientWidth ?? 0
    : 0;
  const left = `${
    overlayPosition.x -
    (containerRect?.width ?? 0) / 2 -
    builderNavigationBarWidth
  }px`;
  const top = `${overlayPosition.y - 50 - (containerRect?.height ?? 0) / 2}px`;
  useCursorPositionEffect((position) => {
    setOverlayPosition(position);
  });
  if (isNil(draggedNote) || isNil(noteDragOverlayMode)) {
    return null;
  }
  return (
    <div
      className={'absolute left-0 top-0 opacity-75'}
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
              id: apId(),
              content: 'test',
              creator: '',
              position: positionOnCanvas,
              size: draggedNote.size,
              color: 'yellow',
            });
          }
        }
      }}
      style={{
        left,
        top,
        height: `${draggedNote.size.height * reactFlow.getZoom()}px`,
        width: `${draggedNote.size.width * reactFlow.getZoom()}px`,
      }}
    >
      <NoteOverlay
        id={draggedNote.id}
        size={{
          width: draggedNote.size.width * reactFlow.getZoom(),
          height: draggedNote.size.height * reactFlow.getZoom(),
        }}
      ></NoteOverlay>
    </div>
  );
};

export default NoteDragOverlay;
