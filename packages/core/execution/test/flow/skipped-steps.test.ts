import { CodeAction, FlowAction, FlowActionType, FlowOperationType, flowOperations, flowStructureUtil, FlowTriggerType, FlowVersion, FlowVersionState, LoopOnItemsAction } from '../../src'

function codeStep({ name, valid = true, skip, nextAction }: { name: string, valid?: boolean, skip?: boolean, nextAction?: FlowAction }): CodeAction {
    return {
        name,
        type: FlowActionType.CODE,
        valid,
        skip,
        displayName: name,
        lastUpdatedDate: '2026-09-28T00:00:00.000Z',
        settings: { sourceCode: { code: '', packageJson: '{}' }, input: {} },
        nextAction,
    }
}

function loopStep({ name, skip, firstLoopAction, nextAction }: { name: string, skip?: boolean, firstLoopAction?: FlowAction, nextAction?: FlowAction }): LoopOnItemsAction {
    return {
        name,
        type: FlowActionType.LOOP_ON_ITEMS,
        valid: true,
        skip,
        displayName: name,
        lastUpdatedDate: '2026-09-28T00:00:00.000Z',
        settings: { items: '' },
        firstLoopAction,
        nextAction,
    }
}

function flowWith(head: FlowAction): FlowVersion {
    return {
        id: 'version',
        created: '2026-09-28T00:00:00.000Z',
        updated: '2026-09-28T00:00:00.000Z',
        flowId: 'flow',
        displayName: 'Flow',
        updatedBy: null,
        valid: false,
        schemaVersion: null,
        agentIds: [],
        state: FlowVersionState.DRAFT,
        connectionIds: [],
        backupFiles: null,
        notes: [],
        trigger: {
            name: 'trigger',
            type: FlowTriggerType.EMPTY,
            valid: true,
            displayName: 'Trigger',
            lastUpdatedDate: '2026-09-28T00:00:00.000Z',
            settings: {},
            nextAction: head,
        },
    }
}

function rename(flowVersion: FlowVersion): FlowVersion {
    return flowOperations.apply(flowVersion, { type: FlowOperationType.CHANGE_NAME, request: { displayName: 'Renamed' } })
}

describe('flowStructureUtil.getSkippedStepNames', () => {
    it('includes a skipped loop and every step inside it, but not the step after it', () => {
        const flowVersion = flowWith(loopStep({
            name: 'step_1',
            skip: true,
            firstLoopAction: codeStep({ name: 'step_2' }),
            nextAction: codeStep({ name: 'step_3' }),
        }))
        expect(flowStructureUtil.getSkippedStepNames({ trigger: flowVersion.trigger })).toEqual(new Set(['step_1', 'step_2']))
    })
})

describe('flow version validity with skipped steps', () => {
    it('is valid when the only invalid step is inside a skipped loop', () => {
        const flowVersion = flowWith(loopStep({ name: 'step_1', skip: true, firstLoopAction: codeStep({ name: 'step_2', valid: false }) }))
        expect(rename(flowVersion).valid).toBe(true)
    })

    it('is invalid when the invalid step is after a skipped loop', () => {
        const flowVersion = flowWith(loopStep({ name: 'step_1', skip: true, nextAction: codeStep({ name: 'step_2', valid: false }) }))
        expect(rename(flowVersion).valid).toBe(false)
    })
})
