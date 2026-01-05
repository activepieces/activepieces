import { createContext, useContext, useState } from "react";

export enum NoteDragOverlayMode {
    CREATE = 'create',
    MOVE = 'move',
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
    color: string;
    id: string;
}

type NotesContextType = {
    notes: Note[];
    addNote: (note: Note) => void;
    removeNote: (id: string) => void;
    moveNote: (id: string, position: {x: number, y: number}) => void;
    resizeNote: (id: string, size: {width: number, height: number}) => void;   
    draggedNote: Note | null;
    setDraggedNote: (note: Note | null, mode: NoteDragOverlayMode | null) => void;
    noteDragOverlayMode: NoteDragOverlayMode | null;
    setNoteDragOverlayMode: (noteDragOverlayMode: NoteDragOverlayMode | null) => void;
    getNoteById: (id: string) => Note | null;
}


const NotesContext = createContext<NotesContextType>({notes: [], noteDragOverlayMode: null, setNoteDragOverlayMode: (noteDragOverlayMode: NoteDragOverlayMode | null) => {}, addNote: () => {}, removeNote: () => {}, moveNote: () => {}, resizeNote: () => {}, draggedNote: null, setDraggedNote: (note: Note | null, mode: NoteDragOverlayMode | null) => {}, getNoteById: () => null});

export const useNotesContext = () => {
    return useContext(NotesContext);
}
export const NotesProvider = ({children}: {children: React.ReactNode}) => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [noteDragOverlayMode, setNoteDragOverlayMode] = useState<NoteDragOverlayMode | null>(null);
    const [draggedNote, setDraggedNote] = useState<Note | null>(null);
    const addNote = (note: Note) => {
        setNotes([...notes, note]);
        setNoteDragOverlayMode(null);
    }
    const removeNote = (id: string) => {
        setNotes(notes.filter((note) => note.id !== id));
    }
    const moveNote = (id: string, position: {x: number, y: number}) => {
        setNotes(notes.map((note) => note.id === id ? {...note, position} : note));
        setNoteDragOverlayMode(null);
        setDraggedNote(null);
    }
    const resizeNote = (id: string, size: {width: number, height: number}) => {
        setNotes(notes.map((note) => note.id === id ? {...note, size} : note));
    }
    const getNoteById = (id: string) => {
        return notes.find((note) => note.id === id) ?? null;
    }

    return <NotesContext.Provider value={{notes, noteDragOverlayMode, setNoteDragOverlayMode, addNote, removeNote, moveNote, resizeNote, draggedNote, setDraggedNote: (note: Note | null, mode: NoteDragOverlayMode | null) => {
        setDraggedNote(note);
        setNoteDragOverlayMode(mode);
    }, getNoteById   }}>{children}</NotesContext.Provider>
}