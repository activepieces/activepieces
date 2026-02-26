import { FlowVersion } from '../flow-version'
import { Note } from '../note'
import { AddNoteRequest, DeleteNoteRequest, UpdateNoteRequest } from './index'

function add(flowVersion: FlowVersion, request: AddNoteRequest): FlowVersion {
    const newFlowVersion = JSON.parse(JSON.stringify(flowVersion))
    newFlowVersion.notes.push({ ...request, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
    return newFlowVersion
}

function update(flowVersion: FlowVersion, request: UpdateNoteRequest): FlowVersion {
    const newFlowVersion = JSON.parse(JSON.stringify(flowVersion))
    newFlowVersion.notes = newFlowVersion.notes.map((note: Note) => {
        if (note.id === request.id) {
            return { ...note, ...request, updatedAt: new Date().toISOString() }
        }
        return note
    })
    return newFlowVersion
}

function remove(flowVersion: FlowVersion, request: DeleteNoteRequest): FlowVersion {
    const newFlowVersion = JSON.parse(JSON.stringify(flowVersion))
    newFlowVersion.notes = newFlowVersion.notes.filter((note: Note) => note.id !== request.id)
    return newFlowVersion
}

export const noteOperations = { add, update, remove }
