import {
    CodeAction,
    FlowAction,
    FlowActionType,
    FlowOperationRequest,
    flowOperations,
    FlowOperationType,
    FlowTriggerType,
    FlowVersion,
    FlowVersionState,
    flowStructureUtil,
    StepLocationRelativeToParent,
} from '../../src'
import { FlowAction as FlowActionSchema } from '../../src/lib/automation/flows/actions/action'
import { _getImportOperations } from '../../src/lib/automation/flows/operations/import-flow'

function buildCodeAction({
    name,
    cof = false,
    onSuccess,
    onFailure,
    nextAction,
}: {
    name: string
    cof?: boolean
    onSuccess?: FlowAction
    onFailure?: FlowAction
    nextAction?: FlowAction
}): CodeAction {
    return {
        name,
        type: FlowActionType.CODE,
        valid: true,
        displayName: name,
        lastUpdatedDate: '2026-05-02T00:00:00.000Z',
        settings: {
            sourceCode: { code: '', packageJson: '{}' },
            input: {},
            errorHandlingOptions: {
                continueOnFailure: { value: cof },
                retryOnFailure: { value: false },
                ...(cof && (onSuccess || onFailure)
                    ? { continueOnFailureBranches: { onSuccess, onFailure } }
                    : {}),
            },
        },
        nextAction,
    }
}

function buildFlow(headAction: FlowAction): FlowVersion {
    return {
        id: 'flow-id',
        created: '2026-05-02T00:00:00.000Z',
        updated: '2026-05-02T00:00:00.000Z',
        flowId: 'flow-id',
        displayName: 'CoF test flow',
        updatedBy: '',
        agentIds: [],
        notes: [],
        valid: true,
        state: FlowVersionState.DRAFT,
        connectionIds: [],
        trigger: {
            name: 'trigger',
            type: FlowTriggerType.EMPTY,
            valid: true,
            displayName: 'Trigger',
            lastUpdatedDate: '2026-05-02T00:00:00.000Z',
            settings: {} as never,
            nextAction: headAction,
        },
    }
}

describe('Continue-on-Failure branches', () => {
    describe('schema', () => {
        it('parses an action with onSuccess and onFailure branches without infinite loop', () => {
            const action = buildCodeAction({
                name: 'step_1',
                cof: true,
                onSuccess: buildCodeAction({
                    name: 'step_2',
                    nextAction: buildCodeAction({ name: 'step_3' }),
                }),
                onFailure: buildCodeAction({ name: 'step_4' }),
            })
            const result = FlowActionSchema.safeParse(action)
            expect(result.success).toBe(true)
        })
    })

    describe('transferStep', () => {
        it('visits every step inside CoF branches', () => {
            const head = buildCodeAction({
                name: 'step_1',
                cof: true,
                onSuccess: buildCodeAction({
                    name: 'step_2',
                    nextAction: buildCodeAction({ name: 'step_3' }),
                }),
                onFailure: buildCodeAction({ name: 'step_4' }),
            })
            const flow = buildFlow(head)
            const allNames = flowStructureUtil.getAllSteps(flow.trigger).map((s) => s.name)
            expect(allNames).toContain('step_1')
            expect(allNames).toContain('step_2')
            expect(allNames).toContain('step_3')
            expect(allNames).toContain('step_4')
        })
    })

    describe('ADD_ACTION', () => {
        it('places a step at the head of the onSuccess branch', () => {
            const head = buildCodeAction({ name: 'step_1', cof: true })
            const flow = buildFlow(head)
            const op: FlowOperationRequest = {
                type: FlowOperationType.ADD_ACTION,
                request: {
                    parentStep: 'step_1',
                    stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_ON_SUCCESS_BRANCH,
                    action: buildCodeAction({ name: 'success_head' }),
                },
            }
            const after = flowOperations.apply(flow, op)
            const updatedHead = after.trigger.nextAction as CodeAction
            const branches =
                updatedHead.settings.errorHandlingOptions?.continueOnFailureBranches
            expect(branches?.onSuccess?.name).toBe('success_head')
            expect(branches?.onFailure).toBeUndefined()
        })

        it('places a step at the head of the onFailure branch', () => {
            const head = buildCodeAction({ name: 'step_1', cof: true })
            const flow = buildFlow(head)
            const op: FlowOperationRequest = {
                type: FlowOperationType.ADD_ACTION,
                request: {
                    parentStep: 'step_1',
                    stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_ON_FAILURE_BRANCH,
                    action: buildCodeAction({ name: 'failure_head' }),
                },
            }
            const after = flowOperations.apply(flow, op)
            const updatedHead = after.trigger.nextAction as CodeAction
            const branches =
                updatedHead.settings.errorHandlingOptions?.continueOnFailureBranches
            expect(branches?.onFailure?.name).toBe('failure_head')
        })

        it('inserts the new step at the head and chains the existing branch as its nextAction', () => {
            const existingBranchHead = buildCodeAction({ name: 'existing_head' })
            const head = buildCodeAction({
                name: 'step_1',
                cof: true,
                onSuccess: existingBranchHead,
            })
            const flow = buildFlow(head)
            const op: FlowOperationRequest = {
                type: FlowOperationType.ADD_ACTION,
                request: {
                    parentStep: 'step_1',
                    stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_ON_SUCCESS_BRANCH,
                    action: buildCodeAction({ name: 'new_head' }),
                },
            }
            const after = flowOperations.apply(flow, op)
            const updatedHead = after.trigger.nextAction as CodeAction
            const onSuccess =
                updatedHead.settings.errorHandlingOptions?.continueOnFailureBranches?.onSuccess
            expect(onSuccess?.name).toBe('new_head')
            expect(onSuccess?.nextAction?.name).toBe('existing_head')
        })

        it('strips inline branches from a head ADD when adding an action that already carries CoF subtrees', () => {
            const trigger = buildCodeAction({ name: 'placeholder' })
            const flow = buildFlow(trigger)
            const richAction = buildCodeAction({
                name: 'rich',
                cof: true,
                onSuccess: buildCodeAction({ name: 'inline_success' }),
                onFailure: buildCodeAction({ name: 'inline_failure' }),
            })
            const op: FlowOperationRequest = {
                type: FlowOperationType.ADD_ACTION,
                request: {
                    parentStep: 'placeholder',
                    stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
                    action: richAction,
                },
            }
            const after = flowOperations.apply(flow, op)
            const placed = (after.trigger.nextAction as CodeAction).nextAction as CodeAction
            expect(placed.name).toBe('rich')
            const branches =
                placed.settings.errorHandlingOptions?.continueOnFailureBranches
            expect(branches?.onSuccess).toBeUndefined()
            expect(branches?.onFailure).toBeUndefined()
            const allNames = flowStructureUtil.getAllSteps(after.trigger).map((s) => s.name)
            expect(allNames.filter((n) => n === 'inline_success')).toHaveLength(0)
            expect(allNames.filter((n) => n === 'inline_failure')).toHaveLength(0)
        })
    })

    describe('DELETE_ACTION', () => {
        it('rebinds branches.onSuccess to the deleted step\'s nextAction when the deleted step is the branch head', () => {
            const head = buildCodeAction({
                name: 'step_1',
                cof: true,
                onSuccess: buildCodeAction({
                    name: 'success_head',
                    nextAction: buildCodeAction({ name: 'success_tail' }),
                }),
            })
            const flow = buildFlow(head)
            const op: FlowOperationRequest = {
                type: FlowOperationType.DELETE_ACTION,
                request: { names: ['success_head'] },
            }
            const after = flowOperations.apply(flow, op)
            const updatedHead = after.trigger.nextAction as CodeAction
            const onSuccess =
                updatedHead.settings.errorHandlingOptions?.continueOnFailureBranches?.onSuccess
            expect(onSuccess?.name).toBe('success_tail')
        })

        it('deletes a step inside the branch chain via transferStep', () => {
            const head = buildCodeAction({
                name: 'step_1',
                cof: true,
                onSuccess: buildCodeAction({
                    name: 'success_head',
                    nextAction: buildCodeAction({
                        name: 'middle',
                        nextAction: buildCodeAction({ name: 'tail' }),
                    }),
                }),
            })
            const flow = buildFlow(head)
            const op: FlowOperationRequest = {
                type: FlowOperationType.DELETE_ACTION,
                request: { names: ['middle'] },
            }
            const after = flowOperations.apply(flow, op)
            const allNames = flowStructureUtil.getAllSteps(after.trigger).map((s) => s.name)
            expect(allNames).not.toContain('middle')
            expect(allNames).toContain('success_head')
            expect(allNames).toContain('tail')
        })

        it('clears onSuccess to undefined when the only branch step is deleted', () => {
            const head = buildCodeAction({
                name: 'step_1',
                cof: true,
                onSuccess: buildCodeAction({ name: 'lonely' }),
            })
            const flow = buildFlow(head)
            const op: FlowOperationRequest = {
                type: FlowOperationType.DELETE_ACTION,
                request: { names: ['lonely'] },
            }
            const after = flowOperations.apply(flow, op)
            const updatedHead = after.trigger.nextAction as CodeAction
            const onSuccess =
                updatedHead.settings.errorHandlingOptions?.continueOnFailureBranches?.onSuccess
            expect(onSuccess).toBeUndefined()
        })
    })

    describe('_getImportOperations', () => {
        it('emits ADD_ACTION ops for both CoF branches and chained nextActions inside them', () => {
            const head = buildCodeAction({
                name: 'step_1',
                cof: true,
                onSuccess: buildCodeAction({
                    name: 'success_head',
                    nextAction: buildCodeAction({ name: 'success_tail' }),
                }),
                onFailure: buildCodeAction({ name: 'failure_head' }),
            })
            const ops = _getImportOperations(head)
            const locations = ops
                .filter((o) => o.type === FlowOperationType.ADD_ACTION)
                .map((o) => o.request.stepLocationRelativeToParent)
            expect(locations).toContain(StepLocationRelativeToParent.INSIDE_ON_SUCCESS_BRANCH)
            expect(locations).toContain(StepLocationRelativeToParent.INSIDE_ON_FAILURE_BRANCH)
            expect(locations).toContain(StepLocationRelativeToParent.AFTER)
        })
    })

    describe('round-trip via MOVE_ACTION', () => {
        it('moves a step with CoF branches into a loop without losing branch contents', () => {
            const cofStep = buildCodeAction({
                name: 'cof_step',
                cof: true,
                onSuccess: buildCodeAction({
                    name: 'success_head',
                    nextAction: buildCodeAction({ name: 'success_tail' }),
                }),
                onFailure: buildCodeAction({ name: 'failure_head' }),
            })
            const loopAction: FlowAction = {
                name: 'loop',
                type: FlowActionType.LOOP_ON_ITEMS,
                valid: true,
                displayName: 'Loop',
                lastUpdatedDate: '2026-05-02T00:00:00.000Z',
                settings: { items: '' },
                nextAction: cofStep,
            }
            const flow = buildFlow(loopAction)
            const op: FlowOperationRequest = {
                type: FlowOperationType.MOVE_ACTION,
                request: {
                    name: 'cof_step',
                    newParentStep: 'loop',
                    stepLocationRelativeToNewParent: StepLocationRelativeToParent.INSIDE_LOOP,
                },
            }
            const after = flowOperations.apply(flow, op)
            const allSteps = flowStructureUtil.getAllSteps(after.trigger)
            const allNames = allSteps.map((s) => s.name)
            expect(allNames.filter((n) => n === 'cof_step')).toHaveLength(1)
            expect(allNames.filter((n) => n === 'success_head')).toHaveLength(1)
            expect(allNames.filter((n) => n === 'success_tail')).toHaveLength(1)
            expect(allNames.filter((n) => n === 'failure_head')).toHaveLength(1)
            const movedCof = allSteps.find((s) => s.name === 'cof_step') as CodeAction
            const branches =
                movedCof.settings.errorHandlingOptions?.continueOnFailureBranches
            expect(branches?.onSuccess?.name).toBe('success_head')
            expect(branches?.onSuccess?.nextAction?.name).toBe('success_tail')
            expect(branches?.onFailure?.name).toBe('failure_head')
        })
    })
})
