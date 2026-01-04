import { useState } from 'react';

import { useSidebar } from '@/components/ui/sidebar-shadcn';

import {
  useCursorPosition,
  useCursorPositionEffect,
} from './cursor-position-context';
import { BUILDER_NAVIGATION_SIDEBAR_ID, flowUtilConsts } from './utils/consts';
import { useNotesContext } from './notes-context';
import { apId } from '@activepieces/shared';
import { useReactFlow } from '@xyflow/react';

const NoteCreationOverlay = () => {
  const { open } = useSidebar();
  const { cursorPosition } = useCursorPosition();
  const [overlayPosition, setOverlayPosition] =
    useState<typeof cursorPosition>(cursorPosition);
  const builderNavigationBar = document.getElementById(
    BUILDER_NAVIGATION_SIDEBAR_ID,
  );
  const builderNavigationBarWidth = open
    ? builderNavigationBar?.clientWidth ?? 0
    : 0;
  const left = `${
    overlayPosition.x -
    flowUtilConsts.NOTE_CREATION_OVERLAY_WIDTH / 2 -
    builderNavigationBarWidth
  }px`;
  const top = `${
    overlayPosition.y 
    - flowUtilConsts.NOTE_CREATION_OVERLAY_HEIGHT / 2 -40
  }px`;
 
  useCursorPositionEffect((position) => {
    setOverlayPosition(position);
  });
  const { setShowOverlay,addNote } = useNotesContext()
  const reactFlowInstance = useReactFlow();
  return (
    <div
      onClick={() => {
        setShowOverlay(false);
        const position = reactFlowInstance.screenToFlowPosition({
            x: overlayPosition.x,
            y: overlayPosition.y,
        });
        addNote({
          content: 'test',
          creator: 'test',
          position,
          size: { width: flowUtilConsts.NOTE_CREATION_OVERLAY_WIDTH, height: flowUtilConsts.NOTE_CREATION_OVERLAY_HEIGHT },
          color: 'oklch(87.9% .169 91.605)',
          id: apId(),
        });
      }}
      className={
        'p-4 absolute left-0 top-0  opacity-50  rounded-md border bg-yellow-200 border-solid shadow-sm border-yellow-500'
      }
      style={{
        left,
        top,
        height: `${flowUtilConsts.NOTE_CREATION_OVERLAY_HEIGHT}px`,
        width: `${flowUtilConsts.NOTE_CREATION_OVERLAY_WIDTH}px`,
      }}
    >
     
    </div>
  );
};

export default NoteCreationOverlay;
