import { createContext, useContext, useState } from "react";

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
    showOverlay: boolean;
    setShowOverlay: (showOverlay: boolean) => void;
    addNote: (note: Note) => void;
    removeNote: (id: string) => void;
    moveNote: (id: string, position: {x: number, y: number}) => void;
    resizeNote: (id: string, size: {width: number, height: number}) => void;    
}


const NotesContext = createContext<NotesContextType>({notes: [], showOverlay: false, setShowOverlay: (showOverlay: boolean) => {}, addNote: () => {}, removeNote: () => {}, moveNote: () => {}, resizeNote: () => {}});

export const useNotesContext = () => {
    return useContext(NotesContext);
}
export const NotesProvider = ({children}: {children: React.ReactNode}) => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [showOverlay, setShowOverlay] = useState(false);
    const addNote = (note: Note) => {
        setNotes([...notes, note]);
    }
    const removeNote = (id: string) => {
        setNotes(notes.filter((note) => note.id !== id));
    }
    const moveNote = (id: string, position: {x: number, y: number}) => {
        const note = notes.find((note) => note.id === id);
        console.log('note', note);
        setNotes(notes.map((note) => note.id === id ? {...note, position} : note));
    }
    const resizeNote = (id: string, size: {width: number, height: number}) => {
        setNotes(notes.map((note) => note.id === id ? {...note, size} : note));
    }
    return <NotesContext.Provider value={{notes, showOverlay, setShowOverlay, addNote, removeNote, moveNote, resizeNote}}>{children}</NotesContext.Provider>
}