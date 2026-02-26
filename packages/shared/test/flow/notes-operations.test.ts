import {
    flowOperations,
    FlowOperationType,
    FlowVersion,
} from '../../src'
import { createEmptyFlowVersion } from './test-utils'

describe('Notes Operations', () => {
    function addNote(flow: FlowVersion, id: string, content: string): FlowVersion {
        return flowOperations.apply(flow, {
            type: FlowOperationType.ADD_NOTE,
            request: {
                id,
                content,
                color: 'orange',
                position: { x: 100, y: 200 },
                size: { width: 150, height: 100 },
            },
        })
    }

    it('should add note', () => {
        const flow = createEmptyFlowVersion()
        const result = addNote(flow, 'note-1', 'My first note')
        expect(result.notes).toHaveLength(1)
        expect(result.notes[0].id).toBe('note-1')
        expect(result.notes[0].content).toBe('My first note')
        expect(result.notes[0].color).toBe('orange')
        expect(result.notes[0].position).toEqual({ x: 100, y: 200 })
        expect(result.notes[0].createdAt).toBeDefined()
        expect(result.notes[0].updatedAt).toBeDefined()
    })

    it('should update note', () => {
        let flow = createEmptyFlowVersion()
        flow = addNote(flow, 'note-1', 'Original content')
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.UPDATE_NOTE,
            request: {
                id: 'note-1',
                content: 'Updated content',
                color: 'blue',
                position: { x: 300, y: 400 },
                size: { width: 200, height: 150 },
            },
        })
        expect(result.notes).toHaveLength(1)
        expect(result.notes[0].content).toBe('Updated content')
        expect(result.notes[0].color).toBe('blue')
    })

    it('should delete note', () => {
        let flow = createEmptyFlowVersion()
        flow = addNote(flow, 'note-1', 'To be deleted')
        flow = addNote(flow, 'note-2', 'To be kept')
        const result = flowOperations.apply(flow, {
            type: FlowOperationType.DELETE_NOTE,
            request: { id: 'note-1' },
        })
        expect(result.notes).toHaveLength(1)
        expect(result.notes[0].id).toBe('note-2')
        expect(result.notes[0].content).toBe('To be kept')
    })
})
