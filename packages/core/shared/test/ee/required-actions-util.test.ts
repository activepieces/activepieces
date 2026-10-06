import { FlowAction, FlowActionType, FlowTriggerType, FlowVersion, FlowVersionState, LoopOnItemsAction, PieceAction } from '@activepieces/core-execution'
import { RequiredActionsMode } from '../../src/lib/ee/piece-set'
import { requiredActionsUtil } from '../../src/lib/ee/piece-set/required-actions-util'

const CRM = '@activepieces/piece-crm'
const BILLING = '@activepieces/piece-billing'
const actionExists = { [CRM]: { create_deal: true, update_contact: true, log_call: false }, [BILLING]: { create_invoice: true } }

function pieceStep({ name, pieceName, actionName, skip, nextAction }: { name: string, pieceName: string, actionName: string, skip?: boolean, nextAction?: FlowAction }): PieceAction {
    return {
        name,
        type: FlowActionType.PIECE,
        valid: true,
        displayName: name,
        skip,
        lastUpdatedDate: '2026-09-28T00:00:00.000Z',
        settings: {
            pieceName,
            pieceVersion: '0.0.1',
            actionName,
            input: {},
            propertySettings: {},
            errorHandlingOptions: {},
        },
        nextAction,
    }
}

function loopStep({ name, skip, firstLoopAction }: { name: string, skip?: boolean, firstLoopAction?: FlowAction }): LoopOnItemsAction {
    return {
        name,
        type: FlowActionType.LOOP_ON_ITEMS,
        valid: true,
        displayName: name,
        skip,
        lastUpdatedDate: '2026-09-28T00:00:00.000Z',
        settings: { items: '' },
        firstLoopAction,
    }
}

function flowWith(head?: FlowAction): FlowVersion {
    return {
        id: 'version',
        created: '2026-09-28T00:00:00.000Z',
        updated: '2026-09-28T00:00:00.000Z',
        flowId: 'flow',
        displayName: 'Flow',
        updatedBy: null,
        valid: true,
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

function rule(mode: RequiredActionsMode, actions: Record<string, string[]>) {
    return { mode, actions }
}

describe('requiredActionsUtil.checkRequiredActionsExistInFlowVersion', () => {
    it('passes when there is no rule', () => {
        const result = requiredActionsUtil.checkRequiredActionsExistInFlowVersion({ requiredActions: rule(RequiredActionsMode.ANY, {}), flowVersion: flowWith(), actionExists })
        expect(result.passed).toBe(true)
    })

    it('any: passes with one of the required actions', () => {
        const flowVersion = flowWith(pieceStep({ name: 'step_1', pieceName: BILLING, actionName: 'create_invoice' }))
        const result = requiredActionsUtil.checkRequiredActionsExistInFlowVersion({ requiredActions: rule(RequiredActionsMode.ANY, { [CRM]: ['create_deal'], [BILLING]: ['create_invoice'] }), flowVersion, actionExists })
        expect(result.passed).toBe(true)
    })

    it('any: fails with none of them and lists all as missing', () => {
        const result = requiredActionsUtil.checkRequiredActionsExistInFlowVersion({ requiredActions: rule(RequiredActionsMode.ANY, { [CRM]: ['create_deal'], [BILLING]: ['create_invoice'] }), flowVersion: flowWith(), actionExists })
        expect(result.passed).toBe(false)
        expect(result.missingActions).toEqual({ [CRM]: ['create_deal'], [BILLING]: ['create_invoice'] })
    })

    it('all: fails when one is missing and lists only that one', () => {
        const flowVersion = flowWith(pieceStep({ name: 'step_1', pieceName: CRM, actionName: 'create_deal' }))
        const result = requiredActionsUtil.checkRequiredActionsExistInFlowVersion({ requiredActions: rule(RequiredActionsMode.ALL, { [CRM]: ['create_deal', 'update_contact'] }), flowVersion, actionExists })
        expect(result.passed).toBe(false)
        expect(result.missingActions).toEqual({ [CRM]: ['update_contact'] })
    })

    it('does not count a skipped step and reports it as skipped', () => {
        const flowVersion = flowWith(pieceStep({ name: 'step_1', pieceName: CRM, actionName: 'create_deal', skip: true }))
        const result = requiredActionsUtil.checkRequiredActionsExistInFlowVersion({ requiredActions: rule(RequiredActionsMode.ANY, { [CRM]: ['create_deal'] }), flowVersion, actionExists })
        expect(result.passed).toBe(false)
        expect(result.skippedActions).toEqual({ [CRM]: ['create_deal'] })
        expect(result.missingActions).toEqual({})
    })

    it('does not count a step inside a skipped loop', () => {
        const flowVersion = flowWith(loopStep({ name: 'step_1', skip: true, firstLoopAction: pieceStep({ name: 'step_2', pieceName: CRM, actionName: 'create_deal' }) }))
        const result = requiredActionsUtil.checkRequiredActionsExistInFlowVersion({ requiredActions: rule(RequiredActionsMode.ANY, { [CRM]: ['create_deal'] }), flowVersion, actionExists })
        expect(result.passed).toBe(false)
        expect(result.skippedActions).toEqual({ [CRM]: ['create_deal'] })
    })

    it('counts a step inside a loop that is not skipped', () => {
        const flowVersion = flowWith(loopStep({ name: 'step_1', firstLoopAction: pieceStep({ name: 'step_2', pieceName: CRM, actionName: 'create_deal' }) }))
        const result = requiredActionsUtil.checkRequiredActionsExistInFlowVersion({ requiredActions: rule(RequiredActionsMode.ANY, { [CRM]: ['create_deal'] }), flowVersion, actionExists })
        expect(result.passed).toBe(true)
    })

    it('ignores actions that are not in the latest piece version', () => {
        const flowVersion = flowWith(pieceStep({ name: 'step_1', pieceName: CRM, actionName: 'create_deal' }))
        const result = requiredActionsUtil.checkRequiredActionsExistInFlowVersion({ requiredActions: rule(RequiredActionsMode.ALL, { [CRM]: ['create_deal', 'log_call'] }), flowVersion, actionExists })
        expect(result.passed).toBe(true)
        expect(result.requiredActions).toEqual({ [CRM]: ['create_deal'] })
    })

    it('passes when every required action was removed from its piece', () => {
        const result = requiredActionsUtil.checkRequiredActionsExistInFlowVersion({ requiredActions: rule(RequiredActionsMode.ANY, { [CRM]: ['log_call'] }), flowVersion: flowWith(), actionExists })
        expect(result.passed).toBe(true)
    })
})

describe('requiredActionsUtil.buildRequiredActionsMissingErrorMessage', () => {
    it('lists missing and skipped actions in one readable line', () => {
        const flowVersion = flowWith(pieceStep({ name: 'step_1', pieceName: CRM, actionName: 'create_deal', skip: true }))
        const result = requiredActionsUtil.checkRequiredActionsExistInFlowVersion({ requiredActions: rule(RequiredActionsMode.ALL, { [CRM]: ['create_deal', 'update_contact'] }), flowVersion, actionExists })
        expect(requiredActionsUtil.buildRequiredActionsMissingErrorMessage(result)).toBe(`This flow needs these actions to publish: ${CRM} · update_contact, ${CRM} · create_deal`)
    })
})
