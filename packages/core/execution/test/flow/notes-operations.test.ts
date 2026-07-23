import {
    FlowActionType,
    flowOperations,
    FlowOperationType,
    FlowTriggerType,
    FlowVersion,
    FlowVersionState,
    Note,
    NoteColorVariant,
    StepLocationRelativeToParent,
} from '../../src'

const codeAction = (name: string, nextAction?: FlowVersion['trigger']['nextAction']) => ({
    name,
    valid: true,
    displayName: 'Code',
    type: FlowActionType.CODE as const,
    settings: {
        sourceCode: {
            code: 'export const code = async () => true;',
            packageJson: '{}',
        },
        input: {},
        errorHandlingOptions: {},
    },
    ...(nextAction ? { nextAction } : {}),
})

const createNote = (anchor: Note['anchor'] = null): Note => ({
    id: 'note-1',
    content: 'hello',
    ownerId: null,
    color: NoteColorVariant.YELLOW,
    position: { x: 100, y: 200 },
    size: { width: 200, height: 100 },
    anchor,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
})

const createFlowVersion = (notes: Note[]): FlowVersion => ({
    id: 'version-id',
    created: '2026-01-01T00:00:00.000Z',
    updated: '2026-01-01T00:00:00.000Z',
    flowId: 'flow-id',
    displayName: 'Test flow',
    updatedBy: null,
    valid: true,
    schemaVersion: null,
    agentIds: [],
    state: FlowVersionState.DRAFT,
    connectionIds: [],
    backupFiles: null,
    notes,
    trigger: {
        name: 'trigger',
        valid: false,
        displayName: 'Select Trigger',
        type: FlowTriggerType.EMPTY,
        settings: {},
        nextAction: {
            name: 'step_1',
            valid: true,
            displayName: 'Code',
            type: FlowActionType.CODE,
            settings: {
                sourceCode: {
                    code: 'export const code = async () => true;',
                    packageJson: '{}',
                },
                input: {},
                errorHandlingOptions: {},
            },
        },
    },
})

describe('note operations', () => {
    it('keeps the anchor when a note is moved via UPDATE_NOTE', () => {
        const anchor = { stepName: 'step_1', offset: { x: 50, y: -20 } }
        const flowVersion = createFlowVersion([createNote(anchor)])
        const result = flowOperations.apply(flowVersion, {
            type: FlowOperationType.UPDATE_NOTE,
            request: {
                ...createNote(anchor),
                position: { x: 300, y: 400 },
            },
        })
        expect(result.notes[0].position).toEqual({ x: 300, y: 400 })
        expect(result.notes[0].anchor).toEqual(anchor)
    })

    it('clears the anchor when UPDATE_NOTE sends anchor null', () => {
        const anchor = { stepName: 'step_1', offset: { x: 50, y: -20 } }
        const flowVersion = createFlowVersion([createNote(anchor)])
        const result = flowOperations.apply(flowVersion, {
            type: FlowOperationType.UPDATE_NOTE,
            request: {
                ...createNote(anchor),
                anchor: null,
            },
        })
        expect(result.notes[0].anchor).toBeNull()
    })

    it('keeps the anchor when UPDATE_NOTE omits the anchor key', () => {
        const anchor = { stepName: 'step_1', offset: { x: 50, y: -20 } }
        const flowVersion = createFlowVersion([createNote(anchor)])
        const { anchor: _omitted, ...requestWithoutAnchor } = createNote(anchor)
        const result = flowOperations.apply(flowVersion, {
            type: FlowOperationType.UPDATE_NOTE,
            request: {
                ...requestWithoutAnchor,
                position: { x: 300, y: 400 },
            },
        })
        expect(result.notes[0].anchor).toEqual(anchor)
    })

    it('keeps the anchor when its step is moved', () => {
        const anchor = { stepName: 'step_1', offset: { x: 50, y: -20 } }
        const flowVersion = createFlowVersion([createNote(anchor)])
        flowVersion.trigger.nextAction = codeAction('step_1', codeAction('step_2'))
        const result = flowOperations.apply(flowVersion, {
            type: FlowOperationType.MOVE_ACTION,
            request: {
                name: 'step_1',
                newParentStep: 'step_2',
                stepLocationRelativeToNewParent:
                    StepLocationRelativeToParent.AFTER,
            },
        })
        expect(result.notes[0].anchor).toEqual(anchor)
    })

    it('clears anchors of descendant steps when their container step is deleted', () => {
        const flowVersion = createFlowVersion([
            createNote({ stepName: 'step_2', offset: { x: 0, y: 0 } }),
        ])
        flowVersion.trigger.nextAction = {
            name: 'step_1',
            valid: true,
            displayName: 'Loop',
            type: FlowActionType.LOOP_ON_ITEMS,
            settings: { items: '{{trigger}}' },
            firstLoopAction: {
                name: 'step_2',
                valid: true,
                displayName: 'Code',
                type: FlowActionType.CODE,
                settings: {
                    sourceCode: {
                        code: 'export const code = async () => true;',
                        packageJson: '{}',
                    },
                    input: {},
                    errorHandlingOptions: {},
                },
            },
        }
        const result = flowOperations.apply(flowVersion, {
            type: FlowOperationType.DELETE_ACTION,
            request: { names: ['step_1'] },
        })
        expect(result.notes[0].anchor).toBeNull()
    })

    it('clears anchors referencing a deleted step and leaves others intact', () => {
        const anchoredToDeleted = {
            ...createNote({ stepName: 'step_1', offset: { x: 0, y: 0 } }),
            id: 'note-1',
        }
        const anchoredToOther = {
            ...createNote({ stepName: 'trigger', offset: { x: 10, y: 10 } }),
            id: 'note-2',
        }
        const freeNote = { ...createNote(), id: 'note-3' }
        const flowVersion = createFlowVersion([
            anchoredToDeleted,
            anchoredToOther,
            freeNote,
        ])
        const result = flowOperations.apply(flowVersion, {
            type: FlowOperationType.DELETE_ACTION,
            request: { names: ['step_1'] },
        })
        expect(result.notes.find((n) => n.id === 'note-1')?.anchor).toBeNull()
        expect(result.notes.find((n) => n.id === 'note-2')?.anchor).toEqual({
            stepName: 'trigger',
            offset: { x: 10, y: 10 },
        })
        expect(result.notes.find((n) => n.id === 'note-3')?.anchor).toBeNull()
        expect(flowVersion.notes.find((n) => n.id === 'note-1')?.anchor).toEqual({
            stepName: 'step_1',
            offset: { x: 0, y: 0 },
        })
    })
})
