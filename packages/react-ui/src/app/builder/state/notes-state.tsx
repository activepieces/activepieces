import { StoreApi } from 'zustand';

import { BuilderState } from '../builder-hooks';

export enum NoteDragOverlayMode {
  CREATE = 'create',
  MOVE = 'move',
}
export enum NoteColorVariant {
  ORANGE = 'orange',
  RED = 'red',
  GREEN = 'green',
  BLUE = 'blue',
  PURPLE = 'purple',
  YELLOW = 'yellow',
}
export type Note = {
  content: string;
  creator: string;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  color: NoteColorVariant;
  id: string;
};

export type NotesState = {
  notes: Note[];
  addNote: (note: Note) => void;
  deleteNote: (id: string) => void;
  moveNote: (id: string, position: { x: number; y: number }) => void;
  resizeNote: (id: string, size: { width: number; height: number }) => void;
  draggedNote: Note | null;
  updateContent: (id: string, content: string) => void;
  updateNoteColor: (id: string, color: NoteColorVariant) => void;
  setDraggedNote: (note: Note | null, mode: NoteDragOverlayMode | null) => void;
  noteDragOverlayMode: NoteDragOverlayMode | null;
  setNoteDragOverlayMode: (
    noteDragOverlayMode: NoteDragOverlayMode | null,
  ) => void;
  getNoteById: (id: string) => Note | null;
};

export const createNotesState = (
  notes: Note[],
  get: StoreApi<BuilderState>['getState'],
  set: StoreApi<BuilderState>['setState'],
): NotesState => {
  return {
    notes,
    noteDragOverlayMode: null,
    setNoteDragOverlayMode: (
      noteDragOverlayMode: NoteDragOverlayMode | null,
    ) => {
      set({ noteDragOverlayMode });
    },
    addNote: (note: Note) => {
      set((state) => {
        return { notes: [...state.notes, note], noteDragOverlayMode: null };
      });
    },
    updateContent: (id: string, content: string) => {
      set((state) => {
        return {
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, content } : note,
          ),
        };
      });
    },
    deleteNote: (id: string) => {
      set((state) => {
        return {
          notes: state.notes.filter((note) => note.id !== id),
          noteDragOverlayMode: null,
        };
      });
    },
    moveNote: (id: string, position: { x: number; y: number }) => {
      set((state) => {
        return {
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, position } : note,
          ),
          noteDragOverlayMode: null,
          draggedNote: null,
        };
      });
    },
    resizeNote: (id: string, size: { width: number; height: number }) => {
      set((state) => {
        return {
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, size } : note,
          ),
          noteDragOverlayMode: null,
        };
      });
    },
    draggedNote: null,
    setDraggedNote: (note: Note | null, mode: NoteDragOverlayMode | null) => {
      set({ draggedNote: note, noteDragOverlayMode: mode });
    },
    getNoteById: (id: string) => {
      return get().notes.find((note) => note.id === id) ?? null;
    },
    updateNoteColor: (id: string, color: NoteColorVariant) => {
      set((state) => {
        return {
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, color } : note,
          ),
        };
      });
    },
  };
};
