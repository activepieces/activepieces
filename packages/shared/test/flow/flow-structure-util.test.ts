import {
    FlowActionKind,
    FlowEdgeType,
    FlowNodeType,
    FlowVersion,
    FlowVersionState,
    FlowTriggerKind,
    flowStructureUtil,
    BranchExecutionType,
    BranchOperator,
    RouterExecutionType,
    FlowGraphNode,
} from '../../src'
import {
    createEmptyFlowVersion,
} from './test-utils'

function makeCodeNode(name: string): FlowGraphNode {
    return {
        id: name,
        type: FlowNodeType.ACTION,
        data: {
            name,
            kind: FlowActionKind.CODE,
            valid: true,
            displayName: 'Code',
            settings: {
                sourceCode: { code: 'test', packageJson: '{}' },
                input: {},
            },
        },
    }
}

function makeLoopNode(name: string): FlowGraphNode {
    return {
        id: name,
        type: FlowNodeType.ACTION,
        data: {
            name,
            kind: FlowActionKind.LOOP_ON_ITEMS,
            valid: true,
            displayName: 'Loop on Items',
            settings: { items: '{{trigger.items}}' },
        },
    }
}

function makeRouterNode(name: string): FlowGraphNode {
    return {
        id: name,
        type: FlowNodeType.ACTION,
        data: {
            name,
            kind: FlowActionKind.ROUTER,
            valid: true,
            displayName: 'Router',
            settings: { executionType: RouterExecutionType.EXECUTE_FIRST_MATCH },
        },
    }
}

describe('findPathToStep', () => {

    it('should return trigger for a direct child of trigger', () => {
        const flow: FlowVersion = {
            ...createEmptyFlowVersion(),
            graph: {
                nodes: [
                    createEmptyFlowVersion().graph.nodes[0],
                    makeCodeNode('step_1'),
                ],
                edges: [
                    { id: 'trigger-default', source: 'trigger', target: 'step_1', type: FlowEdgeType.DEFAULT },
                ],
            },
        }

        const path = flowStructureUtil.findPathToStep(flow, 'step_1')
        expect(path.map(s => s.id)).toEqual(['trigger'])
    })

    it('should return trigger and preceding step for second step in chain', () => {
        const flow: FlowVersion = {
            ...createEmptyFlowVersion(),
            graph: {
                nodes: [
                    createEmptyFlowVersion().graph.nodes[0],
                    makeCodeNode('step_1'),
                    makeCodeNode('step_2'),
                ],
                edges: [
                    { id: 'trigger-default', source: 'trigger', target: 'step_1', type: FlowEdgeType.DEFAULT },
                    { id: 'step_1-default', source: 'step_1', target: 'step_2', type: FlowEdgeType.DEFAULT },
                ],
            },
        }

        const path = flowStructureUtil.findPathToStep(flow, 'step_2')
        expect(path.map(s => s.id)).toEqual(['trigger', 'step_1'])
    })

    it('should return full chain for third step', () => {
        const flow: FlowVersion = {
            ...createEmptyFlowVersion(),
            graph: {
                nodes: [
                    createEmptyFlowVersion().graph.nodes[0],
                    makeCodeNode('step_1'),
                    makeCodeNode('step_2'),
                    makeCodeNode('step_3'),
                ],
                edges: [
                    { id: 'trigger-default', source: 'trigger', target: 'step_1', type: FlowEdgeType.DEFAULT },
                    { id: 'step_1-default', source: 'step_1', target: 'step_2', type: FlowEdgeType.DEFAULT },
                    { id: 'step_2-default', source: 'step_2', target: 'step_3', type: FlowEdgeType.DEFAULT },
                ],
            },
        }

        const path = flowStructureUtil.findPathToStep(flow, 'step_3')
        expect(path.map(s => s.id)).toEqual(['trigger', 'step_1', 'step_2'])
    })

    it('should include preceding step before a loop', () => {
        const flow: FlowVersion = {
            ...createEmptyFlowVersion(),
            graph: {
                nodes: [
                    createEmptyFlowVersion().graph.nodes[0],
                    makeCodeNode('step_2'),
                    makeLoopNode('step_6'),
                    makeCodeNode('step_7'),
                ],
                edges: [
                    { id: 'trigger-default', source: 'trigger', target: 'step_2', type: FlowEdgeType.DEFAULT },
                    { id: 'step_2-default', source: 'step_2', target: 'step_6', type: FlowEdgeType.DEFAULT },
                    { id: 'step_6-loop', source: 'step_6', target: 'step_7', type: FlowEdgeType.LOOP },
                ],
            },
        }

        const pathToLoop = flowStructureUtil.findPathToStep(flow, 'step_6')
        expect(pathToLoop.map(s => s.id)).toEqual(['trigger', 'step_2'])

        const pathToLoopChild = flowStructureUtil.findPathToStep(flow, 'step_7')
        expect(pathToLoopChild.map(s => s.id)).toEqual(['trigger', 'step_2', 'step_6'])
    })

    it('should include preceding siblings inside a loop', () => {
        const flow: FlowVersion = {
            ...createEmptyFlowVersion(),
            graph: {
                nodes: [
                    createEmptyFlowVersion().graph.nodes[0],
                    makeLoopNode('loop_1'),
                    makeCodeNode('step_2'),
                    makeCodeNode('step_3'),
                ],
                edges: [
                    { id: 'trigger-default', source: 'trigger', target: 'loop_1', type: FlowEdgeType.DEFAULT },
                    { id: 'loop_1-loop', source: 'loop_1', target: 'step_2', type: FlowEdgeType.LOOP },
                    { id: 'step_2-default', source: 'step_2', target: 'step_3', type: FlowEdgeType.DEFAULT },
                ],
            },
        }

        const path = flowStructureUtil.findPathToStep(flow, 'step_3')
        expect(path.map(s => s.id)).toEqual(['trigger', 'loop_1', 'step_2'])
    })

    it('should not include steps from other router branches', () => {
        const flow: FlowVersion = {
            ...createEmptyFlowVersion(),
            graph: {
                nodes: [
                    createEmptyFlowVersion().graph.nodes[0],
                    makeRouterNode('router_1'),
                    makeCodeNode('step_a'),
                    makeCodeNode('step_c'),
                ],
                edges: [
                    { id: 'trigger-default', source: 'trigger', target: 'router_1', type: FlowEdgeType.DEFAULT },
                    {
                        id: 'router_1-branch-0', source: 'router_1', target: 'step_a', type: FlowEdgeType.BRANCH,
                        branchIndex: 0, branchName: 'Branch 1', branchType: BranchExecutionType.CONDITION,
                        conditions: [[{ operator: BranchOperator.TEXT_CONTAINS, firstValue: '{{trigger.value}}', secondValue: 'test', caseSensitive: false }]],
                    },
                    {
                        id: 'router_1-branch-1', source: 'router_1', target: 'step_c', type: FlowEdgeType.BRANCH,
                        branchIndex: 1, branchName: 'Otherwise', branchType: BranchExecutionType.FALLBACK,
                    },
                ],
            },
        }

        const path = flowStructureUtil.findPathToStep(flow, 'step_c')
        expect(path.map(s => s.id)).toEqual(['trigger', 'router_1'])
        expect(path.map(s => s.id)).not.toContain('step_a')
    })

    it('should return trigger and loop for a step inside a loop', () => {
        const flow: FlowVersion = {
            ...createEmptyFlowVersion(),
            graph: {
                nodes: [
                    createEmptyFlowVersion().graph.nodes[0],
                    makeLoopNode('step_1'),
                    makeCodeNode('step_2'),
                ],
                edges: [
                    { id: 'trigger-default', source: 'trigger', target: 'step_1', type: FlowEdgeType.DEFAULT },
                    { id: 'step_1-loop', source: 'step_1', target: 'step_2', type: FlowEdgeType.LOOP },
                ],
            },
        }

        const path = flowStructureUtil.findPathToStep(flow, 'step_2')
        expect(path.map(s => s.id)).toEqual(['trigger', 'step_1'])
    })

    it('should return trigger and router for a step inside a router branch', () => {
        const flow: FlowVersion = {
            ...createEmptyFlowVersion(),
            graph: {
                nodes: [
                    createEmptyFlowVersion().graph.nodes[0],
                    makeRouterNode('step_1'),
                    makeCodeNode('step_2'),
                ],
                edges: [
                    { id: 'trigger-default', source: 'trigger', target: 'step_1', type: FlowEdgeType.DEFAULT },
                    {
                        id: 'step_1-branch-0', source: 'step_1', target: 'step_2', type: FlowEdgeType.BRANCH,
                        branchIndex: 0, branchName: 'Branch 1', branchType: BranchExecutionType.CONDITION,
                        conditions: [[{ operator: BranchOperator.TEXT_CONTAINS, firstValue: '{{trigger.value}}', secondValue: 'test', caseSensitive: false }]],
                    },
                    {
                        id: 'step_1-branch-1', source: 'step_1', target: null, type: FlowEdgeType.BRANCH,
                        branchIndex: 1, branchName: 'Otherwise', branchType: BranchExecutionType.FALLBACK,
                    },
                ],
            },
        }

        const path = flowStructureUtil.findPathToStep(flow, 'step_2')
        expect(path.map(s => s.id)).toEqual(['trigger', 'step_1'])
    })

    it('should return trigger, loop, and router for deeply nested step', () => {
        const flow: FlowVersion = {
            ...createEmptyFlowVersion(),
            graph: {
                nodes: [
                    createEmptyFlowVersion().graph.nodes[0],
                    makeLoopNode('loop_1'),
                    makeRouterNode('router_1'),
                    makeCodeNode('step_3'),
                ],
                edges: [
                    { id: 'trigger-default', source: 'trigger', target: 'loop_1', type: FlowEdgeType.DEFAULT },
                    { id: 'loop_1-loop', source: 'loop_1', target: 'router_1', type: FlowEdgeType.LOOP },
                    {
                        id: 'router_1-branch-0', source: 'router_1', target: 'step_3', type: FlowEdgeType.BRANCH,
                        branchIndex: 0, branchName: 'Branch 1', branchType: BranchExecutionType.CONDITION,
                        conditions: [[{ operator: BranchOperator.TEXT_CONTAINS, firstValue: '{{trigger.value}}', secondValue: 'test', caseSensitive: false }]],
                    },
                    {
                        id: 'router_1-branch-1', source: 'router_1', target: null, type: FlowEdgeType.BRANCH,
                        branchIndex: 1, branchName: 'Otherwise', branchType: BranchExecutionType.FALLBACK,
                    },
                ],
            },
        }

        const path = flowStructureUtil.findPathToStep(flow, 'step_3')
        expect(path.map(s => s.id)).toEqual(['trigger', 'loop_1', 'router_1'])
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
            graph: {
                nodes: [
                    createEmptyFlowVersion().graph.nodes[0],
                    makeLoopNode('loop_1'),
                    makeCodeNode('step_2'),
                    makeCodeNode('step_3'),
                ],
                edges: [
                    { id: 'trigger-default', source: 'trigger', target: 'loop_1', type: FlowEdgeType.DEFAULT },
                    { id: 'loop_1-loop', source: 'loop_1', target: 'step_2', type: FlowEdgeType.LOOP },
                    { id: 'step_2-default', source: 'step_2', target: 'step_3', type: FlowEdgeType.DEFAULT },
                ],
            },
        }

        const loop = flow.graph.nodes.find(n => n.id === 'loop_1')!
        const children = flowStructureUtil.getAllChildSteps(loop, flow)
        expect(children.map(s => s.id)).toEqual(['step_2', 'step_3'])
    })

    it('should return nested children of a loop containing a router', () => {
        const flow: FlowVersion = {
            ...createEmptyFlowVersion(),
            graph: {
                nodes: [
                    createEmptyFlowVersion().graph.nodes[0],
                    makeLoopNode('loop_1'),
                    makeRouterNode('router_1'),
                    makeCodeNode('step_3'),
                ],
                edges: [
                    { id: 'trigger-default', source: 'trigger', target: 'loop_1', type: FlowEdgeType.DEFAULT },
                    { id: 'loop_1-loop', source: 'loop_1', target: 'router_1', type: FlowEdgeType.LOOP },
                    {
                        id: 'router_1-branch-0', source: 'router_1', target: 'step_3', type: FlowEdgeType.BRANCH,
                        branchIndex: 0, branchName: 'Branch 1', branchType: BranchExecutionType.CONDITION,
                        conditions: [[{ operator: BranchOperator.TEXT_CONTAINS, firstValue: '{{trigger.value}}', secondValue: 'test', caseSensitive: false }]],
                    },
                    {
                        id: 'router_1-branch-1', source: 'router_1', target: null, type: FlowEdgeType.BRANCH,
                        branchIndex: 1, branchName: 'Otherwise', branchType: BranchExecutionType.FALLBACK,
                    },
                ],
            },
        }

        const loop = flow.graph.nodes.find(n => n.id === 'loop_1')!
        const children = flowStructureUtil.getAllChildSteps(loop, flow)
        expect(children.map(s => s.id)).toEqual(['router_1', 'step_3'])
    })
})

describe('isChildOf', () => {

    it('should return true for direct child of loop', () => {
        const flow: FlowVersion = {
            ...createEmptyFlowVersion(),
            graph: {
                nodes: [
                    createEmptyFlowVersion().graph.nodes[0],
                    makeLoopNode('loop_1'),
                    makeCodeNode('step_2'),
                ],
                edges: [
                    { id: 'trigger-default', source: 'trigger', target: 'loop_1', type: FlowEdgeType.DEFAULT },
                    { id: 'loop_1-loop', source: 'loop_1', target: 'step_2', type: FlowEdgeType.LOOP },
                ],
            },
        }

        const loop = flow.graph.nodes.find(n => n.id === 'loop_1')!
        expect(flowStructureUtil.isChildOf(loop, 'step_2', flow)).toBe(true)
    })

    it('should return true for nested child of loop', () => {
        const flow: FlowVersion = {
            ...createEmptyFlowVersion(),
            graph: {
                nodes: [
                    createEmptyFlowVersion().graph.nodes[0],
                    makeLoopNode('loop_1'),
                    makeRouterNode('router_1'),
                    makeCodeNode('step_3'),
                ],
                edges: [
                    { id: 'trigger-default', source: 'trigger', target: 'loop_1', type: FlowEdgeType.DEFAULT },
                    { id: 'loop_1-loop', source: 'loop_1', target: 'router_1', type: FlowEdgeType.LOOP },
                    {
                        id: 'router_1-branch-0', source: 'router_1', target: 'step_3', type: FlowEdgeType.BRANCH,
                        branchIndex: 0, branchName: 'Branch 1', branchType: BranchExecutionType.CONDITION,
                        conditions: [[{ operator: BranchOperator.TEXT_CONTAINS, firstValue: '{{trigger.value}}', secondValue: 'test', caseSensitive: false }]],
                    },
                    {
                        id: 'router_1-branch-1', source: 'router_1', target: null, type: FlowEdgeType.BRANCH,
                        branchIndex: 1, branchName: 'Otherwise', branchType: BranchExecutionType.FALLBACK,
                    },
                ],
            },
        }

        const loop = flow.graph.nodes.find(n => n.id === 'loop_1')!
        expect(flowStructureUtil.isChildOf(loop, 'step_3', flow)).toBe(true)
    })

    it('should return false for step not inside the loop', () => {
        const flow: FlowVersion = {
            ...createEmptyFlowVersion(),
            graph: {
                nodes: [
                    createEmptyFlowVersion().graph.nodes[0],
                    makeLoopNode('loop_1'),
                    makeCodeNode('step_2'),
                ],
                edges: [
                    { id: 'trigger-default', source: 'trigger', target: 'loop_1', type: FlowEdgeType.DEFAULT },
                    { id: 'loop_1-default', source: 'loop_1', target: 'step_2', type: FlowEdgeType.DEFAULT },
                ],
            },
        }

        const loop = flow.graph.nodes.find(n => n.id === 'loop_1')!
        expect(flowStructureUtil.isChildOf(loop, 'step_2', flow)).toBe(false)
    })

    it('should return false for code step', () => {
        const flow: FlowVersion = {
            ...createEmptyFlowVersion(),
            graph: {
                nodes: [
                    createEmptyFlowVersion().graph.nodes[0],
                    makeCodeNode('step_1'),
                    makeCodeNode('step_2'),
                ],
                edges: [
                    { id: 'trigger-default', source: 'trigger', target: 'step_1', type: FlowEdgeType.DEFAULT },
                    { id: 'step_1-default', source: 'step_1', target: 'step_2', type: FlowEdgeType.DEFAULT },
                ],
            },
        }

        expect(flowStructureUtil.isChildOf(flow.graph.nodes[1], 'step_2', flow)).toBe(false)
    })
})

describe('getDirectChildRefs', () => {

    it('should return loop edge target', () => {
        const flow = createEmptyFlowVersion()
        const loopNode = makeLoopNode('loop_1')
        flow.graph.nodes.push(loopNode, makeCodeNode('step_2'), makeCodeNode('step_3'))
        flow.graph.edges.push(
            { id: 'loop_1-loop', source: 'loop_1', target: 'step_2', type: FlowEdgeType.LOOP },
        )

        expect(flowStructureUtil.getDirectChildRefs(loopNode, flow.graph)).toEqual(['step_2'])
    })

    it('should return router branch edge targets', () => {
        const flow = createEmptyFlowVersion()
        const routerNode = makeRouterNode('router_1')
        flow.graph.nodes.push(routerNode, makeCodeNode('step_2'), makeCodeNode('step_3'))
        flow.graph.edges.push(
            {
                id: 'router_1-branch-0', source: 'router_1', target: 'step_2', type: FlowEdgeType.BRANCH,
                branchIndex: 0, branchName: 'Branch 1', branchType: BranchExecutionType.CONDITION,
                conditions: [[{ operator: BranchOperator.TEXT_CONTAINS, firstValue: 'a', secondValue: 'b', caseSensitive: false }]],
            },
            {
                id: 'router_1-branch-1', source: 'router_1', target: 'step_3', type: FlowEdgeType.BRANCH,
                branchIndex: 1, branchName: 'Otherwise', branchType: BranchExecutionType.FALLBACK,
            },
        )

        expect(flowStructureUtil.getDirectChildRefs(routerNode, flow.graph)).toEqual(['step_2', 'step_3'])
    })

    it('should return empty array for code action', () => {
        const flow = createEmptyFlowVersion()
        const codeNode = makeCodeNode('step_1')
        flow.graph.nodes.push(codeNode)
        expect(flowStructureUtil.getDirectChildRefs(codeNode, flow.graph)).toEqual([])
    })
})
