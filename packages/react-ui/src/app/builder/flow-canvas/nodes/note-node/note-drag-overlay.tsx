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

  // Use the captured offset if available, otherwise fallback to centering
  const offsetX = draggedNoteOffset
    ? draggedNoteOffset.x * reactFlow.getZoom()
    : nodeSizeWithZoom.width / 2;
  const offsetY = draggedNoteOffset
    ? draggedNoteOffset.y * reactFlow.getZoom()
    : nodeSizeWithZoom.height / 2;

  const left = `${overlayPosition.x - offsetX - builderNavigationBarWidth}px`;
  const top = `${overlayPosition.y - 50 - offsetY}px`;
  useCursorPositionEffect((position) => {
    setOverlayPosition(position);
  });
  const hideOverlay = isNil(draggedNote) || isNil(noteDragOverlayMode);

  if (hideOverlay) {
    return null;
  }
  return (
    <div
      className={'absolute left-0 top-0  !cursor-grabbing note-drag-overlay'}
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
        height: `${draggedNote.size.height * reactFlow.getZoom()}px !important`,
        width: `${draggedNote.size.width * reactFlow.getZoom()}px !important`,
      }}
    >
      <NoteContent
        isDragging={true}
        note={{
          ...draggedNote,
          size: {
            width: draggedNote.size.width * reactFlow.getZoom(),
            height: draggedNote.size.height * reactFlow.getZoom(),
          },
        }}
      ></NoteContent>
    </div>
  );
};

export default NoteDragOverlay;
