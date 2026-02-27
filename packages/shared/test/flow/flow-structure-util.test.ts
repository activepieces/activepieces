import {
    FlowActionType,
    FlowVersion,
    FlowVersionState,
    FlowTriggerType,
    flowStructureUtil,
    LoopOnItemsAction,
    RouterAction,
    BranchExecutionType,
    BranchOperator,
    RouterExecutionType,
} from '../../src'
import {
    createCodeAction,
    createEmptyFlowVersion,
    createLoopAction,
    createRouterAction,
} from './test-utils'

describe('findPathToStep', () => {

    it('should return trigger for a direct child of trigger', () => {
        const flow: FlowVersion = {
            ...createEmptyFlowVersion(),
            trigger: {
                ...createEmptyFlowVersion().trigger,
                steps: ['step_1'],
            },
            steps: [createCodeAction('step_1')],
        }

        const path = flowStructureUtil.findPathToStep(flow, 'step_1')

        expect(path.map(s => s.name)).toEqual(['trigger'])
    })

    it('should return trigger and preceding step for second step in chain', () => {
        const flow: FlowVersion = {
            ...createEmptyFlowVersion(),
            trigger: {
                ...createEmptyFlowVersion().trigger,
                steps: ['step_1', 'step_2'],
            },
            steps: [createCodeAction('step_1'), createCodeAction('step_2')],
        }

        const path = flowStructureUtil.findPathToStep(flow, 'step_2')

        expect(path.map(s => s.name)).toEqual(['trigger', 'step_1'])
    })

    it('should return full chain for third step', () => {
        const flow: FlowVersion = {
            ...createEmptyFlowVersion(),
            trigger: {
                ...createEmptyFlowVersion().trigger,
                steps: ['step_1', 'step_2', 'step_3'],
            },
            steps: [createCodeAction('step_1'), createCodeAction('step_2'), createCodeAction('step_3')],
        }

        const path = flowStructureUtil.findPathToStep(flow, 'step_3')

        expect(path.map(s => s.name)).toEqual(['trigger', 'step_1', 'step_2'])
    })

    it('should include preceding step before a loop (data mapper scenario)', () => {
        const flow: FlowVersion = {
            ...createEmptyFlowVersion(),
            trigger: {
                ...createEmptyFlowVersion().trigger,
                steps: ['step_2', 'step_6'],
            },
            steps: [
                createCodeAction('step_2'),
                {
                    name: 'step_6',
                    type: FlowActionType.LOOP_ON_ITEMS,
                    valid: true,
                    displayName: 'Loop on Items',
                    settings: { items: '{{step_2.output}}' },
                    children: ['step_7'],
                },
                createCodeAction('step_7'),
            ],
        }

        const pathToLoop = flowStructureUtil.findPathToStep(flow, 'step_6')
        expect(pathToLoop.map(s => s.name)).toEqual(['trigger', 'step_2'])

        const pathToLoopChild = flowStructureUtil.findPathToStep(flow, 'step_7')
        expect(pathToLoopChild.map(s => s.name)).toEqual(['trigger', 'step_2', 'step_6'])
    })

    it('should include preceding siblings inside a loop', () => {
        const flow: FlowVersion = {
            ...createEmptyFlowVersion(),
            trigger: {
                ...createEmptyFlowVersion().trigger,
                steps: ['loop_1'],
            },
            steps: [
                {
                    name: 'loop_1',
                    type: FlowActionType.LOOP_ON_ITEMS,
                    valid: true,
                    displayName: 'Loop',
                    settings: { items: '{{trigger.items}}' },
                    children: ['step_2', 'step_3'],
                },
                createCodeAction('step_2'),
                createCodeAction('step_3'),
            ],
        }

        const path = flowStructureUtil.findPathToStep(flow, 'step_3')

        expect(path.map(s => s.name)).toEqual(['trigger', 'loop_1', 'step_2'])
    })

    it('should not include steps from other router branches', () => {
        const flow: FlowVersion = {
            ...createEmptyFlowVersion(),
            trigger: {
                ...createEmptyFlowVersion().trigger,
                steps: ['router_1'],
            },
            steps: [
                {
                    ...createRouterAction('router_1'),
                    branches: [
                        {
                            conditions: [[{
                                operator: BranchOperator.TEXT_CONTAINS,
                                firstValue: '{{trigger.value}}',
                                secondValue: 'test',
                                caseSensitive: false,
                            }]],
                            branchType: BranchExecutionType.CONDITION,
                            branchName: 'Branch 1',
                            steps: ['step_a'],
                        },
                        {
                            branchType: BranchExecutionType.FALLBACK,
                            branchName: 'Otherwise',
                            steps: ['step_c'],
                        },
                    ],
                },
                createCodeAction('step_a'),
                createCodeAction('step_c'),
            ],
        }

        const path = flowStructureUtil.findPathToStep(flow, 'step_c')

        expect(path.map(s => s.name)).toEqual(['trigger', 'router_1'])
        expect(path.map(s => s.name)).not.toContain('step_a')
    })

    it('should return trigger and loop for a step inside a loop', () => {
        const flow: FlowVersion = {
            ...createEmptyFlowVersion(),
            trigger: {
                ...createEmptyFlowVersion().trigger,
                steps: ['step_1'],
            },
            steps: [
                {
                    name: 'step_1',
                    type: FlowActionType.LOOP_ON_ITEMS,
                    valid: true,
                    displayName: 'Loop',
                    settings: { items: '{{trigger.items}}' },
                    children: ['step_2'],
                },
                createCodeAction('step_2'),
            ],
        }

        const path = flowStructureUtil.findPathToStep(flow, 'step_2')

        expect(path.map(s => s.name)).toEqual(['trigger', 'step_1'])
    })

    it('should return trigger and router for a step inside a router branch', () => {
        const flow: FlowVersion = {
            ...createEmptyFlowVersion(),
            trigger: {
                ...createEmptyFlowVersion().trigger,
                steps: ['step_1'],
            },
            steps: [
                {
                    ...createRouterAction('step_1'),
                    branches: [
                        {
                            conditions: [[{
                                operator: BranchOperator.TEXT_CONTAINS,
                                firstValue: '{{trigger.value}}',
                                secondValue: 'test',
                                caseSensitive: false,
                            }]],
                            branchType: BranchExecutionType.CONDITION,
                            branchName: 'Branch 1',
                            steps: ['step_2'],
                        },
                        {
                            branchType: BranchExecutionType.FALLBACK,
                            branchName: 'Otherwise',
                            steps: [],
                        },
                    ],
                },
                createCodeAction('step_2'),
            ],
        }

        const path = flowStructureUtil.findPathToStep(flow, 'step_2')

        expect(path.map(s => s.name)).toEqual(['trigger', 'step_1'])
    })

    it('should return trigger, loop, and router for deeply nested step', () => {
        const flow: FlowVersion = {
            ...createEmptyFlowVersion(),
            trigger: {
                ...createEmptyFlowVersion().trigger,
                steps: ['loop_1'],
            },
            steps: [
                {
                    name: 'loop_1',
                    type: FlowActionType.LOOP_ON_ITEMS,
                    valid: true,
                    displayName: 'Loop',
                    settings: { items: '{{trigger.items}}' },
                    children: ['router_1'],
                },
                {
                    ...createRouterAction('router_1'),
                    branches: [
                        {
                            conditions: [[{
                                operator: BranchOperator.TEXT_CONTAINS,
                                firstValue: '{{trigger.value}}',
                                secondValue: 'test',
                                caseSensitive: false,
                            }]],
                            branchType: BranchExecutionType.CONDITION,
                            branchName: 'Branch 1',
                            steps: ['step_3'],
                        },
                        {
                            branchType: BranchExecutionType.FALLBACK,
                            branchName: 'Otherwise',
                            steps: [],
                        },
                    ],
                },
                createCodeAction('step_3'),
            ],
        }

        const path = flowStructureUtil.findPathToStep(flow, 'step_3')

        expect(path.map(s => s.name)).toEqual(['trigger', 'loop_1', 'router_1'])
    })

    it('should return empty array for the trigger itself', () => {
        const flow = createEmptyFlowVersion()

        const path = flowStructureUtil.findPathToStep(flow, 'trigger')

        expect(path).toEqual([])
    })
})

describe('getAllChildSteps', () => {

    it('should return direct children of a loop', () => {
        const flow: FlowVersion = {
            ...createEmptyFlowVersion(),
            trigger: {
                ...createEmptyFlowVersion().trigger,
                steps: ['loop_1'],
            },
            steps: [
                {
                    name: 'loop_1',
                    type: FlowActionType.LOOP_ON_ITEMS,
                    valid: true,
                    displayName: 'Loop',
                    settings: { items: '{{trigger.items}}' },
                    children: ['step_2', 'step_3'],
                },
                createCodeAction('step_2'),
                createCodeAction('step_3'),
            ],
        }

        const loop = flow.steps[0] as LoopOnItemsAction
        const children = flowStructureUtil.getAllChildSteps(loop, flow)

        expect(children.map(s => s.name)).toEqual(['step_2', 'step_3'])
    })

    it('should return nested children of a loop containing a router', () => {
        const flow: FlowVersion = {
            ...createEmptyFlowVersion(),
            trigger: {
                ...createEmptyFlowVersion().trigger,
                steps: ['loop_1'],
            },
            steps: [
                {
                    name: 'loop_1',
                    type: FlowActionType.LOOP_ON_ITEMS,
                    valid: true,
                    displayName: 'Loop',
                    settings: { items: '{{trigger.items}}' },
                    children: ['router_1'],
                },
                {
                    ...createRouterAction('router_1'),
                    branches: [
                        {
                            conditions: [[{
                                operator: BranchOperator.TEXT_CONTAINS,
                                firstValue: '{{trigger.value}}',
                                secondValue: 'test',
                                caseSensitive: false,
                            }]],
                            branchType: BranchExecutionType.CONDITION,
                            branchName: 'Branch 1',
                            steps: ['step_3'],
                        },
                        {
                            branchType: BranchExecutionType.FALLBACK,
                            branchName: 'Otherwise',
                            steps: [],
                        },
                    ],
                },
                createCodeAction('step_3'),
            ],
        }

        const loop = flow.steps[0] as LoopOnItemsAction
        const children = flowStructureUtil.getAllChildSteps(loop, flow)

        expect(children.map(s => s.name)).toEqual(['router_1', 'step_3'])
    })
})

describe('isChildOf', () => {

    it('should return true for direct child of loop', () => {
        const flow: FlowVersion = {
            ...createEmptyFlowVersion(),
            trigger: {
                ...createEmptyFlowVersion().trigger,
                steps: ['loop_1'],
            },
            steps: [
                {
                    name: 'loop_1',
                    type: FlowActionType.LOOP_ON_ITEMS,
                    valid: true,
                    displayName: 'Loop',
                    settings: { items: '{{trigger.items}}' },
                    children: ['step_2'],
                },
                createCodeAction('step_2'),
            ],
        }

        const loop = flow.steps[0]
        expect(flowStructureUtil.isChildOf(loop, 'step_2', flow)).toBe(true)
    })

    it('should return true for nested child of loop', () => {
        const flow: FlowVersion = {
            ...createEmptyFlowVersion(),
            trigger: {
                ...createEmptyFlowVersion().trigger,
                steps: ['loop_1'],
            },
            steps: [
                {
                    name: 'loop_1',
                    type: FlowActionType.LOOP_ON_ITEMS,
                    valid: true,
                    displayName: 'Loop',
                    settings: { items: '{{trigger.items}}' },
                    children: ['router_1'],
                },
                {
                    ...createRouterAction('router_1'),
                    branches: [
                        {
                            conditions: [[{
                                operator: BranchOperator.TEXT_CONTAINS,
                                firstValue: '{{trigger.value}}',
                                secondValue: 'test',
                                caseSensitive: false,
                            }]],
                            branchType: BranchExecutionType.CONDITION,
                            branchName: 'Branch 1',
                            steps: ['step_3'],
                        },
                        {
                            branchType: BranchExecutionType.FALLBACK,
                            branchName: 'Otherwise',
                            steps: [],
                        },
                    ],
                },
                createCodeAction('step_3'),
            ],
        }

        const loop = flow.steps[0]
        expect(flowStructureUtil.isChildOf(loop, 'step_3', flow)).toBe(true)
    })

    it('should return false for step not inside the loop', () => {
        const flow: FlowVersion = {
            ...createEmptyFlowVersion(),
            trigger: {
                ...createEmptyFlowVersion().trigger,
                steps: ['loop_1', 'step_2'],
            },
            steps: [
                {
                    name: 'loop_1',
                    type: FlowActionType.LOOP_ON_ITEMS,
                    valid: true,
                    displayName: 'Loop',
                    settings: { items: '{{trigger.items}}' },
                    children: [],
                },
                createCodeAction('step_2'),
            ],
        }

        const loop = flow.steps[0]
        expect(flowStructureUtil.isChildOf(loop, 'step_2', flow)).toBe(false)
    })

    it('should return false for code step', () => {
        const flow: FlowVersion = {
            ...createEmptyFlowVersion(),
            trigger: {
                ...createEmptyFlowVersion().trigger,
                steps: ['step_1', 'step_2'],
            },
            steps: [createCodeAction('step_1'), createCodeAction('step_2')],
        }

        expect(flowStructureUtil.isChildOf(flow.steps[0], 'step_2', flow)).toBe(false)
    })
})

describe('getDirectChildRefs', () => {

    it('should return trigger steps', () => {
        const flow = {
            ...createEmptyFlowVersion(),
            trigger: {
                ...createEmptyFlowVersion().trigger,
                steps: ['step_1', 'step_2'],
            },
        }

        expect(flowStructureUtil.getDirectChildRefs(flow.trigger)).toEqual(['step_1', 'step_2'])
    })

    it('should return loop children', () => {
        const loop: LoopOnItemsAction = {
            name: 'loop_1',
            type: FlowActionType.LOOP_ON_ITEMS,
            valid: true,
            displayName: 'Loop',
            settings: { items: '{{trigger.items}}' },
            children: ['step_2', 'step_3'],
        }

        expect(flowStructureUtil.getDirectChildRefs(loop)).toEqual(['step_2', 'step_3'])
    })

    it('should return router branch steps flattened', () => {
        const router = createRouterAction('router_1')
        // Override branches to have specific steps
        ;(router as RouterAction).branches = [
            {
                conditions: [[{
                    operator: BranchOperator.TEXT_CONTAINS,
                    firstValue: 'a',
                    secondValue: 'b',
                    caseSensitive: false,
                }]],
                branchType: BranchExecutionType.CONDITION,
                branchName: 'Branch 1',
                steps: ['step_2'],
            },
            {
                branchType: BranchExecutionType.FALLBACK,
                branchName: 'Otherwise',
                steps: ['step_3'],
            },
        ]

        expect(flowStructureUtil.getDirectChildRefs(router)).toEqual(['step_2', 'step_3'])
    })

    it('should return empty array for code action', () => {
        expect(flowStructureUtil.getDirectChildRefs(createCodeAction('step_1'))).toEqual([])
    })
})
