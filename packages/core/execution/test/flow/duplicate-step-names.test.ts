import { ErrorCode } from '@activepieces/core-utils'
import {
    CodeAction,
    FlowAction,
    FlowActionType,
    flowOperations,
    FlowOperationType,
    flowStructureUtil,
    FlowTriggerType,
    FlowVersion,
    FlowVersionState,
    StepLocationRelativeToParent,
} from '../../src'

const sourceCode = { packageJson: '{}', code: 'export const code = async () => {}' }

function codeAction(name: string, nextAction?: FlowAction): CodeAction {
    return {
        name,
        displayName: name,
        type: FlowActionType.CODE,
        valid: true,
        settings: { sourceCode, input: {}, inputUiInfo: {}, propertySettings: {} },
        nextAction,
    } as unknown as CodeAction
}

function flowOf(stepNames: string[]): FlowVersion {
    let head: FlowAction | undefined = undefined
    for (let i = stepNames.length - 1; i >= 0; i--) {
        head = codeAction(stepNames[i], head)
    }
    return {
        id: 'v1',
        created: '2026-08-21T17:00:00.000Z',
        updated: '2026-08-21T17:00:00.000Z',
        flowId: 'f1',
        updatedBy: null,
        displayName: 'flow',
        valid: true,
        schemaVersion: '24',
        agentIds: [],
        state: FlowVersionState.DRAFT,
        connectionIds: [],
        backupFiles: null,
        notes: [],
        trigger: {
            name: 'trigger',
            displayName: 'trigger',
            type: FlowTriggerType.EMPTY,
            valid: true,
            settings: {},
            nextAction: head,
        },
    } as unknown as FlowVersion
}

const nodeCount = (version: FlowVersion) => flowStructureUtil.getAllSteps(version.trigger).length

const clipboardOf = (version: FlowVersion, stepNames: string[]): FlowAction[] =>
    JSON.parse(JSON.stringify(stepNames.map((name) => flowStructureUtil.getActionOrThrow(name, version.trigger))))

const applyAll = (version: FlowVersion, operations: unknown[]): FlowVersion =>
    operations.reduce<FlowVersion>((acc, operation) => flowOperations.apply(acc, operation as never), version)

const addAfter = (parentStep: string, name: string) => ({
    type: FlowOperationType.ADD_ACTION,
    request: {
        parentStep,
        stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
        action: {
            type: FlowActionType.CODE,
            name,
            displayName: name,
            valid: true,
            settings: { sourceCode, input: {}, inputUiInfo: {}, propertySettings: {} },
        },
    },
})

describe('duplicate step names', () => {
    it('rejects a paste whose names were allocated against a stale snapshot', () => {
        const base = flowOf(['step_1', 'step_2', 'step_3', 'step_4', 'step_5'])
        const pasteFromSnapshot = () =>
            flowOperations.getOperationsForPaste(clipboardOf(base, ['step_2']), base, {
                parentStepName: 'step_5',
                stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
            })

        const pasted = applyAll(base, pasteFromSnapshot())

        expect(() => applyAll(pasted, pasteFromSnapshot())).toThrow(ErrorCode.FLOW_OPERATION_INVALID)
        expect(nodeCount(pasted)).toBe(10)
    })

    it('inserts one node per add, even when the parent name is already duplicated', () => {
        const corrupted = flowOf(['step_1', 'step_2', 'step_3', 'step_2', 'step_4'])

        const after = flowOperations.apply(corrupted, addAfter('step_2', 'step_5') as never)

        expect(nodeCount(after) - nodeCount(corrupted)).toBe(1)
    })

    it('still round-trips an IMPORT_FLOW that re-adds every existing name', () => {
        const base = flowOf(['step_1', 'step_2', 'step_3'])

        const imported = flowOperations.apply(base, {
            type: FlowOperationType.IMPORT_FLOW,
            request: {
                displayName: base.displayName,
                trigger: base.trigger,
                notes: [],
            },
        } as never)

        expect(flowStructureUtil.getAllSteps(imported.trigger).map((step) => step.name)).toEqual([
            'trigger',
            'step_1',
            'step_2',
            'step_3',
        ])
    })

    it('refuses to add a step under a name that already exists', () => {
        const base = flowOf(['step_1', 'step_2'])

        expect(() => flowOperations.apply(base, addAfter('step_2', 'step_1') as never)).toThrow(ErrorCode.FLOW_OPERATION_INVALID)
    })
})
