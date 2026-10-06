/**
 * @vitest-environment jsdom
 */
/* eslint-disable testing-library/no-unnecessary-act */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import NoteDragOverlay from '@/app/builder/flow-canvas/nodes/note-node/note-drag-overlay';
import { NoteDragOverlayMode } from '@/app/builder/state/notes-state';

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const canvasOrigin = vi.hoisted(() => ({ left: 255, top: 68 }));

const builderState = vi.hoisted((): { current: DraggedNoteSlice } => ({
  current: {
    draggedNote: null,
    noteDragOverlayMode: null,
    addNote: () => undefined,
    draggedNoteOffset: null,
  },
}));

vi.mock('@xyflow/react', () => ({
  useReactFlow: () => ({
    getZoom: () => 1,
    screenToFlowPosition: (position: Point) => position,
  }),
  useStore: <T,>(selector: (state: CanvasState) => T) =>
    selector({ domNode: { getBoundingClientRect: () => canvasOrigin } }),
}));

vi.mock('@/app/builder/builder-hooks', () => ({
  useBuilderStateContext: <T,>(selector: (state: DraggedNoteSlice) => T) =>
    selector(builderState.current),
}));

vi.mock('@/app/builder/state/notes-state', () => ({
  NoteDragOverlayMode: { CREATE: 'create', MOVE: 'move' },
}));

vi.mock('@/app/builder/flow-canvas/nodes/note-node', () => ({
  NoteContent: () => null,
}));

vi.mock('@/app/builder/flow-canvas/utils/consts', () => ({
  flowCanvasConsts: { DEFAULT_NOTE_CONTENT: '', DEFAULT_NOTE_COLOR: 'blue' },
}));

let container: HTMLDivElement | null = null;
let root: Root | null = null;

describe('NoteDragOverlay', () => {
  afterEach(() => {
    act(() => root?.unmount());
    container?.remove();
    container = null;
    root = null;
    builderState.current = {
      draggedNote: null,
      noteDragOverlayMode: null,
      addNote: () => undefined,
      draggedNoteOffset: null,
    };
  });

  it('centres the new-note preview on the cursor, measured from the canvas element', () => {
    mountOverlay();
    movePointer({ x: 600, y: 700 });
    builderState.current = {
      ...builderState.current,
      draggedNote: { size: { width: 150, height: 150 } },
      noteDragOverlayMode: NoteDragOverlayMode.CREATE,
    };
    renderOverlay();

    const overlay = container?.querySelector<HTMLElement>('.note-drag-overlay');
    expect(overlay?.style.left).toBe(`${600 - 150 / 2 - canvasOrigin.left}px`);
    expect(overlay?.style.top).toBe(`${700 - 150 / 2 - canvasOrigin.top}px`);
  });

  it('keeps the grabbed point of a moved note under the cursor', () => {
    mountOverlay();
    movePointer({ x: 600, y: 700 });
    builderState.current = {
      ...builderState.current,
      draggedNote: { size: { width: 275, height: 175 } },
      noteDragOverlayMode: NoteDragOverlayMode.MOVE,
      draggedNoteOffset: { x: 40, y: 125 },
    };
    renderOverlay();

    const overlay = container?.querySelector<HTMLElement>('.note-drag-overlay');
    expect(overlay?.style.left).toBe(`${600 - 40 - canvasOrigin.left}px`);
    expect(overlay?.style.top).toBe(`${700 - 125 - canvasOrigin.top}px`);
  });
});

function mountOverlay(): void {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  renderOverlay();
}

function renderOverlay(): void {
  act(() => root?.render(<NoteDragOverlay />));
}

function movePointer({ x, y }: Point): void {
  act(() => {
    window.dispatchEvent(
      new MouseEvent('pointermove', { clientX: x, clientY: y }),
    );
  });
}

type Point = { x: number; y: number };

type CanvasState = {
  domNode: { getBoundingClientRect: () => { left: number; top: number } };
};

type DraggedNoteSlice = {
  draggedNote: { size: { width: number; height: number } } | null;
  noteDragOverlayMode: NoteDragOverlayMode | null;
  addNote: () => void;
  draggedNoteOffset: Point | null;
};
