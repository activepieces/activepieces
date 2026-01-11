import { CreateNoteRequest, DeleteNoteRequest, UpdateNoteRequest } from ".";
import { apId } from "../../common/id-generator";
import { FlowVersion } from "../flow-version";
import { Note } from "../note";

const _updateNote = (flowVersion: FlowVersion, request: UpdateNoteRequest): FlowVersion => {
    const newFlowVersion = JSON.parse(JSON.stringify(flowVersion))
    newFlowVersion.notes = newFlowVersion.notes.map((note: Note) => {
        if (note.id === request.id) {
            return { ...note, ...request, updatedAt: new Date().toISOString() }
        }
        return note
    })
    return newFlowVersion
}

const _deleteNote = (flowVersion: FlowVersion, request: DeleteNoteRequest): FlowVersion => {
    const newFlowVersion = JSON.parse(JSON.stringify(flowVersion))
    newFlowVersion.notes = newFlowVersion.notes.filter((note: Note) => note.id !== request.id)
    return newFlowVersion
}

const _addNote = (flowVersion: FlowVersion, request: CreateNoteRequest): FlowVersion => {
    const newFlowVersion = JSON.parse(JSON.stringify(flowVersion))
    newFlowVersion.notes.push({ ...request, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    return newFlowVersion
}

export const notesOperations = {
    updateNote: _updateNote,
    deleteNote: _deleteNote,
    addNote: _addNote,
}