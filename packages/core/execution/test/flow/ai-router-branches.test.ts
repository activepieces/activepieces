import { describe, expect, it } from 'vitest'
import { BranchExecutionType, FlowActionType } from '../../src/lib/flows/actions/action'
import { FlowVersion, FlowVersionState } from '../../src/lib/flows/flow-version'
import { flowOperations, FlowOperationType, StepLocationRelativeToParent } from '../../src/lib/flows/operations'
import { flowStructureUtil } from '../../src/lib/flows/util/flow-structure-util'
import { FlowTriggerType } from '../../src/lib/flows/triggers/trigger'

function flowWithAiRouter(): FlowVersion {
    return {
        id: 'v1',
        flowId: 'f1',
        displayName: 'test',
        valid: true,
        state: FlowVersionState.DRAFT,
        schemaVersion: '27',
        updatedBy: null,
        created: '',
        updated: '',
        trigger: {
            name: 'trigger',
            displayName: 'Trigger',
            valid: true,
            type: FlowTriggerType.EMPTY,
            settings: {},
            lastUpdatedDate: new Date().toISOString(),
            nextAction: {
                name: 'step_1',
                displayName: 'AI Router',
                valid: false,
                lastUpdatedDate: new Date().toISOString(),
                type: FlowActionType.AI_ROUTER,
                settings: {
                    text: '',
                    question: '',
                    branches: [
                        { branchType: BranchExecutionType.CONDITION, branchName: 'Route 1', description: '' },
                        { branchType: BranchExecutionType.FALLBACK, branchName: 'Otherwise', description: 'else' },
                    ],
                },
                children: [null, null],
            },
        },
    } as FlowVersion
}

function routerOf(flowVersion: FlowVersion) {
    const step = flowStructureUtil.getActionOrThrow('step_1', flowVersion.trigger)
    if (step.type !== FlowActionType.AI_ROUTER) {
        throw new Error('expected an ai router')
    }
    return step
}

describe('branch operations on an AI_ROUTER', () => {
    it('adds a route with a description rather than a condition tree', () => {
        const flowVersion = flowOperations.apply(flowWithAiRouter(), {
            type: FlowOperationType.ADD_BRANCH,
            request: { stepName: 'step_1', branchIndex: 1, branchName: 'Route 2', description: 'refunds' },
        })

        const router = routerOf(flowVersion)
        expect(router.settings.branches.map((branch) => branch.branchName)).toEqual(['Route 1', 'Route 2', 'Otherwise'])
        expect(router.settings.branches[1]).toEqual({
            branchType: BranchExecutionType.CONDITION,
            branchName: 'Route 2',
            description: 'refunds',
        })
        expect(router.children).toHaveLength(3)
    })

    it('puts an added step inside the branch it was added to', () => {
        const flowVersion = flowOperations.apply(flowWithAiRouter(), {
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: 'step_1',
                stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_BRANCH,
                branchIndex: 0,
                action: {
                    name: 'step_2',
                    displayName: 'Code',
                    valid: true,
                    type: FlowActionType.CODE,
                    settings: { sourceCode: { packageJson: '{}', code: 'x' }, input: {} },
                },
            },
        })

        const router = routerOf(flowVersion)
        expect(router.children[0]?.name).toBe('step_2')
        expect(router.children[1]).toBeNull()
        expect(flowStructureUtil.getAllSteps(flowVersion.trigger).map((step) => step.name)).toContain('step_2')
    })

    it('duplicates a route carrying its description, not conditions', () => {
        const base = flowWithAiRouter()
        routerOf(base).settings.branches[0] = { branchType: BranchExecutionType.CONDITION, branchName: 'Route 1', description: 'payments and refunds' }

        const flowVersion = flowOperations.apply(base, {
            type: FlowOperationType.DUPLICATE_BRANCH,
            request: { stepName: 'step_1', branchIndex: 0 },
        })

        const router = routerOf(flowVersion)
        expect(router.settings.branches.map((branch) => branch.branchName)).toEqual(['Route 1', 'Route 1 Copy', 'Otherwise'])
        expect(router.settings.branches[1]).toEqual({
            branchType: BranchExecutionType.CONDITION,
            branchName: 'Route 1 Copy',
            description: 'payments and refunds',
        })
        expect(router.children).toHaveLength(3)
    })

    it('keeps branches and children in lockstep across move and delete', () => {
        let flowVersion = flowOperations.apply(flowWithAiRouter(), {
            type: FlowOperationType.ADD_BRANCH,
            request: { stepName: 'step_1', branchIndex: 1, branchName: 'Route 2' },
        })
        flowVersion = flowOperations.apply(flowVersion, {
            type: FlowOperationType.MOVE_BRANCH,
            request: { stepName: 'step_1', sourceBranchIndex: 0, targetBranchIndex: 1 },
        })
        expect(routerOf(flowVersion).settings.branches.map((branch) => branch.branchName)).toEqual(['Route 2', 'Route 1', 'Otherwise'])

        flowVersion = flowOperations.apply(flowVersion, {
            type: FlowOperationType.DELETE_BRANCH,
            request: { stepName: 'step_1', branchIndex: 0 },
        })
        const router = routerOf(flowVersion)
        expect(router.settings.branches.map((branch) => branch.branchName)).toEqual(['Route 1', 'Otherwise'])
        expect(router.children).toHaveLength(2)
    })

    it('never moves the fallback route out of last place', () => {
        const flowVersion = flowOperations.apply(flowWithAiRouter(), {
            type: FlowOperationType.MOVE_BRANCH,
            request: { stepName: 'step_1', sourceBranchIndex: 1, targetBranchIndex: 0 },
        })

        expect(routerOf(flowVersion).settings.branches.map((branch) => branch.branchName)).toEqual(['Route 1', 'Otherwise'])
    })
})
