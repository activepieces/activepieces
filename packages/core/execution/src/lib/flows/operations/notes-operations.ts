import dayjs from 'dayjs'
import { FlowVersion } from '../flow-version'
import { Note } from '../note'
import { flowStructureUtil } from '../util/flow-structure-util'
import { AddNoteRequest, DeleteNoteRequest, UpdateNoteRequest } from '.'

const _clearDanglingNoteAnchors = (flowVersion: FlowVersion): FlowVersion => {
    const stepNames = new Set(
        flowStructureUtil.getAllSteps(flowVersion.trigger).map((step) => step.name),
    )
    return {
        ...flowVersion,
        notes: flowVersion.notes.map((note) =>
            note.anchor && !stepNames.has(note.anchor.stepName)
                ? { ...note, anchor: null }
                : note,
        ),
    }
}

const _updateNote = (flowVersion: FlowVersion, request: UpdateNoteRequest): FlowVersion => {
    const newFlowVersion = JSON.parse(JSON.stringify(flowVersion))
    newFlowVersion.notes = newFlowVersion.notes.map((note: Note) => {
        if (note.id === request.id) {
            return { ...note, ...request, updatedAt: dayjs().toISOString() }
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

const _addNote = (flowVersion: FlowVersion, request: AddNoteRequest): FlowVersion => {
    const newFlowVersion = JSON.parse(JSON.stringify(flowVersion))
    newFlowVersion.notes.push({ ...request, createdAt: dayjs().toISOString(), updatedAt: dayjs().toISOString() })
    return newFlowVersion
}

export const notesOperations = {
    updateNote: _updateNote,
    deleteNote: _deleteNote,
    addNote: _addNote,
    clearDanglingNoteAnchors: _clearDanglingNoteAnchors,
}