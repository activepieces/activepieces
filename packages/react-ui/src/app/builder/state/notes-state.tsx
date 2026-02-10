import { StoreApi } from 'zustand';

import { authenticationSession } from '@/lib/authentication-session';
import {
  AddNoteRequest,
  FlowOperationType,
  NoteColorVariant,
  Note,
  apId,
} from '@activepieces/shared';

import { BuilderState } from '../builder-hooks';

export enum NoteDragOverlayMode {
  CREATE = 'create',
  MOVE = 'move',
}

export type NotesState = {
  addNote: (request: Omit<AddNoteRequest, 'id'>) => void;
  deleteNote: (id: string) => void;
  moveNote: (id: string, position: { x: number; y: number }) => void;
  resizeNote: (id: string, size: { width: number; height: number }) => void;
  draggedNote: Note | null;
  updateContent: (id: string, content: string) => void;
  updateNoteColor: (id: string, color: NoteColorVariant) => void;
  setDraggedNote: (
    note: Note | null,
    mode: NoteDragOverlayMode | null,
    offset?: { x: number; y: number },
  ) => void;
  noteDragOverlayMode: NoteDragOverlayMode | null;
  setNoteDragOverlayMode: (
    noteDragOverlayMode: NoteDragOverlayMode | null,
  ) => void;
  getNoteById: (id: string) => Note | null;
  draggedNoteOffset: { x: number; y: number } | null;
};

export const createNotesState = (
  get: StoreApi<BuilderState>['getState'],
  set: StoreApi<BuilderState>['setState'],
): NotesState => {
  return {
    noteDragOverlayMode: null,
    setNoteDragOverlayMode: (
      noteDragOverlayMode: NoteDragOverlayMode | null,
    ) => {
      set({ noteDragOverlayMode });
    },
    addNote: (request: Omit<AddNoteRequest, 'id'>) => {
      const id = apId();
      get().applyOperation({
        type: FlowOperationType.ADD_NOTE,
        request: {
          ...request,
          id,
        },
      });
      const notes = get().flowVersion.notes;
      const noteIndex = notes.findIndex((note) => note.id === id);
      if (noteIndex !== -1) {
        notes[noteIndex] = {
          ...notes[noteIndex],
          ownerId: authenticationSession.getCurrentUserId() ?? null,
        };
      }
      notes[noteIndex].ownerId =
        authenticationSession.getCurrentUserId() ?? null;
      set(() => {
        return {
          flowVersion: {
            ...get().flowVersion,
            notes,
          },
          draggedNote: null,
          noteDragOverlayMode: null,
        };
      });
    },
    updateContent: (id: string, content: string) => {
      const note = get().getNoteById(id);
      if (!note) {
        return;
      }
      get().applyOperation({
        type: FlowOperationType.UPDATE_NOTE,
        request: {
          ...note,
          content,
        },
      });
    },
    deleteNote: (id: string) => {
      get().applyOperation({
        type: FlowOperationType.DELETE_NOTE,
        request: {
          id: id,
        },
      });
    },
    moveNote: (id: string, position: { x: number; y: number }) => {
      set(() => {
        return {
          noteDragOverlayMode: null,
          draggedNote: null,
        };
      });
      const note = get().getNoteById(id);
      if (!note) {
        return;
      }
      get().applyOperation({
        type: FlowOperationType.UPDATE_NOTE,
        request: {
          ...note,
          position,
        },
      });
    },
    resizeNote: (id: string, size: { width: number; height: number }) => {
      set(() => {
        return {
          noteDragOverlayMode: null,
          draggedNote: null,
        };
      });
      const note = get().getNoteById(id);
      if (!note) {
        return;
      }
      get().applyOperation({
        type: FlowOperationType.UPDATE_NOTE,
        request: {
          ...note,
          size,
        },
      });
    },
    draggedNote: null,
    draggedNoteOffset: null,
    setDraggedNote: (
      note: Note | null,
      mode: NoteDragOverlayMode | null,
      offset?: { x: number; y: number },
    ) => {
      set({
        draggedNote: note,
        noteDragOverlayMode: mode,
        draggedNoteOffset: offset ?? null,
      });
    },
    getNoteById: (id: string) => {
      return get().flowVersion.notes.find((note) => note.id === id) ?? null;
    },
    updateNoteColor: (id: string, color: NoteColorVariant) => {
      const note = get().getNoteById(id);
      if (!note) {
        return;
      }
      get().applyOperation({
        type: FlowOperationType.UPDATE_NOTE,
        request: {
          ...note,
          color,
        },
      });
    },
  };
};
