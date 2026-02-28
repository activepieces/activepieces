import { isNil } from '../../../core/common'
import { ActivepiecesError, ErrorCode } from '../../../core/common/activepieces-error'
import { BranchCondition, BranchExecutionType, emptyCondition, FlowActionKind } from '../actions/action'
import { FlowVersion } from '../flow-version'
import { BranchEdge, FlowEdgeType, FlowGraph, FlowGraphEdge, FlowGraphNode, FlowNodeType, isActionNodeData } from '../graph/flow-graph'
import { FlowTriggerKind } from '../triggers/trigger'


export const AI_PIECE_NAME = '@activepieces/piece-ai'

function isAction(kind: FlowActionKind | FlowTriggerKind | undefined): kind is FlowActionKind {
    return kind === FlowActionKind.CODE
        || kind === FlowActionKind.PIECE
        || kind === FlowActionKind.LOOP_ON_ITEMS
        || kind === FlowActionKind.ROUTER
}

function isTrigger(kind: FlowActionKind | FlowTriggerKind | undefined): kind is FlowTriggerKind {
    return kind === FlowTriggerKind.EMPTY
        || kind === FlowTriggerKind.PIECE
}

function getActionOrThrow(name: string, flowVersion: FlowVersion): FlowGraphNode {
    const node = getStepOrThrow(name, flowVersion)
    if (node.type !== FlowNodeType.ACTION) {
        throw new ActivepiecesError({
            code: ErrorCode.STEP_NOT_FOUND,
            params: {
                stepName: name,
            },
        })
    }
    return node
}

function getStep(name: string, flowVersion: FlowVersion): FlowGraphNode | undefined {
    return flowVersion.graph.nodes.find((n) => n.id === name)
}

function getStepOrThrow(name: string, flowVersion: FlowVersion): FlowGraphNode {
    const node = getStep(name, flowVersion)
    if (isNil(node)) {
        throw new ActivepiecesError({
            code: ErrorCode.STEP_NOT_FOUND,
            params: {
                stepName: name,
            },
        })
    }
    return node
}

function getAllSteps(flowVersion: FlowVersionLike): FlowGraphNode[] {
    return flowVersion.graph.nodes
}

function transferFlow(
    flowVersion: FlowVersion,
    transferFunction: (node: FlowGraphNode) => FlowGraphNode,
): FlowVersion {
    const clonedFlow: FlowVersion = JSON.parse(JSON.stringify(flowVersion))
    clonedFlow.graph.nodes = clonedFlow.graph.nodes.map((node) => transferFunction(node))
    return clonedFlow
}

function createBranchEdge(source: string, branchIndex: number, branchName: string, conditions: BranchCondition[][] | undefined): BranchEdge {
    if (conditions) {
        return {
            id: `${source}-branch-${branchIndex}`,
            source,
            target: null,
            type: FlowEdgeType.BRANCH,
            branchIndex,
            branchName,
            branchType: BranchExecutionType.CONDITION,
            conditions,
        }
    }
    return {
        id: `${source}-branch-${branchIndex}`,
        source,
        target: null,
        type: FlowEdgeType.BRANCH,
        branchIndex,
        branchName,
        branchType: BranchExecutionType.CONDITION,
        conditions: [[emptyCondition]],
    }
}

function getTriggerNode(graph: FlowGraph): FlowGraphNode | undefined {
    return graph.nodes.find((n) => n.type === FlowNodeType.TRIGGER)
}

function getSuccessorEdge(graph: FlowGraph, nodeId: string): FlowGraphEdge | undefined {
    return graph.edges.find((e) => e.source === nodeId && e.type === FlowEdgeType.DEFAULT)
}

function getPredecessorEdge(graph: FlowGraph, nodeId: string): FlowGraphEdge | undefined {
    return graph.edges.find((e) => e.target === nodeId)
}

function getLoopEdge(graph: FlowGraph, loopNodeId: string): FlowGraphEdge | undefined {
    return graph.edges.find((e) => e.source === loopNodeId && e.type === FlowEdgeType.LOOP)
}

function getBranchEdges(graph: FlowGraph, routerNodeId: string): BranchEdge[] {
    return graph.edges
        .filter((e): e is BranchEdge => e.source === routerNodeId && e.type === FlowEdgeType.BRANCH)
        .sort((a, b) => a.branchIndex - b.branchIndex)
}

function getDefaultChain(graph: FlowGraph, startNodeId: string): string[] {
    const result: string[] = [startNodeId]
    let currentId = startNodeId
    while (true) {
        const edge = getSuccessorEdge(graph, currentId)
        if (!edge || !edge.target) break
        result.push(edge.target)
        currentId = edge.target
    }
    return result
}

function findPathToStep(flowVersion: FlowVersion, targetStepName: string): StepWithIndex[] {
    const result: StepWithIndex[] = []
    const allNodes = getAllSteps(flowVersion)
    const parentMap = buildParentMap(flowVersion)
    for (let i = 0; i < allNodes.length; i++) {
        const node = allNodes[i]
        if (isAncestorOf(node.id, targetStepName, parentMap)) {
            result.push({ ...node, dfsIndex: i })
        }
    }
    return result
}

function isAncestorOf(stepName: string, targetStepName: string, parentMap: Map<string, string>): boolean {
    let current = targetStepName
    while (parentMap.has(current)) {
        current = parentMap.get(current)!
        if (current === stepName) {
            return true
        }
    }
    return false
}

function buildParentMap(flowVersion: FlowVersion): Map<string, string> {
    const parentMap = new Map<string, string>()
    const graph = flowVersion.graph
    const triggerNode = getTriggerNode(graph)
    if (!triggerNode) return parentMap
    const defaultEdge = getSuccessorEdge(graph, triggerNode.id)
    if (defaultEdge?.target) {
        addChainToParentMap(defaultEdge.target, triggerNode.id, graph, parentMap)
    }
    return parentMap
}

function addChainToParentMap(startId: string, containerId: string, graph: FlowGraph, parentMap: Map<string, string>): void {
    const chain = getDefaultChain(graph, startId)
    let parentName = containerId
    for (const nodeId of chain) {
        parentMap.set(nodeId, parentName)
        const node = graph.nodes.find((n) => n.id === nodeId)
        if (node?.data.kind === FlowActionKind.LOOP_ON_ITEMS) {
            const loopEdge = getLoopEdge(graph, nodeId)
            if (loopEdge?.target) {
                addChainToParentMap(loopEdge.target, nodeId, graph, parentMap)
            }
        }
        else if (node?.data.kind === FlowActionKind.ROUTER) {
            for (const branchEdge of getBranchEdges(graph, nodeId)) {
                if (branchEdge.target) {
                    addChainToParentMap(branchEdge.target, nodeId, graph, parentMap)
                }
            }
        }
        parentName = nodeId
    }
}

function getDirectChildRefs(node: FlowGraphNode, graph: FlowGraph): string[] {
    if (node.type === FlowNodeType.TRIGGER) {
        return []
    }
    switch (node.data.kind) {
        case FlowActionKind.LOOP_ON_ITEMS: {
            const loopEdge = getLoopEdge(graph, node.id)
            return loopEdge && loopEdge.target ? [loopEdge.target] : []
        }
        case FlowActionKind.ROUTER: {
            const branchEdges = getBranchEdges(graph, node.id)
            return branchEdges.filter((e) => e.target !== null).map((e) => e.target!)
        }
        default:
            return []
    }
}

function getAllChildSteps(node: FlowGraphNode, flowVersion: FlowVersion): FlowGraphNode[] {
    const graph = flowVersion.graph
    const result: FlowGraphNode[] = []

    if (node.data.kind === FlowActionKind.LOOP_ON_ITEMS) {
        const loopEdge = getLoopEdge(graph, node.id)
        if (loopEdge && loopEdge.target) {
            collectChainAndDescendants(loopEdge.target, graph, result)
        }
    }
    else if (node.data.kind === FlowActionKind.ROUTER) {
        const branchEdges = getBranchEdges(graph, node.id)
        for (const branchEdge of branchEdges) {
            if (branchEdge.target) {
                collectChainAndDescendants(branchEdge.target, graph, result)
            }
        }
    }

    return result
}

function collectChainAndDescendants(startId: string, graph: FlowGraph, result: FlowGraphNode[]): void {
    const chain = getDefaultChain(graph, startId)
    for (const nodeId of chain) {
        const node = graph.nodes.find((n) => n.id === nodeId)
        if (node) {
            result.push(node)
            if (node.data.kind === FlowActionKind.LOOP_ON_ITEMS) {
                const loopEdge = getLoopEdge(graph, nodeId)
                if (loopEdge && loopEdge.target) {
                    collectChainAndDescendants(loopEdge.target, graph, result)
                }
            }
            else if (node.data.kind === FlowActionKind.ROUTER) {
                const branchEdges = getBranchEdges(graph, nodeId)
                for (const branchEdge of branchEdges) {
                    if (branchEdge.target) {
                        collectChainAndDescendants(branchEdge.target, graph, result)
                    }
                }
            }
        }
    }
}

function isChildOf(parent: FlowGraphNode, childStepName: string, flowVersion: FlowVersion): boolean {
    switch (parent.data.kind) {
        case FlowActionKind.ROUTER:
        case FlowActionKind.LOOP_ON_ITEMS: {
            const children = getAllChildSteps(parent, flowVersion)
            return children.some((c) => c.id === childStepName)
        }
        default:
            break
    }
    return false
}

function findUnusedName(source: FlowVersion | string[]): string {
    const names = Array.isArray(source) ? source : getAllSteps(source).map((n) => n.id)
    let index = 1
    let name = 'step_1'
    while (names.includes(name)) {
        index++
        name = 'step_' + index
    }
    return name
}

function extractConnectionIdsFromAuth(auth: string): string[] {
    const match = auth.match(/{{connections\['([^']*(?:'\s*,\s*'[^']*)*)'\]}}/)
    if (!match || !match[1]) {
        return []
    }
    return match[1].split(/'\s*,\s*'/).map(id => id.trim())
}

function extractAgentIds(flowVersion: FlowVersion): string[] {
    return getAllSteps(flowVersion).map(node => getExternalAgentId(node)).filter((id): id is string => id !== null && id !== '')
}

function getExternalAgentId(node: FlowGraphNode): string | null {
    if (node.data.kind !== FlowActionKind.PIECE) return null
    if (node.data.settings.pieceName !== AI_PIECE_NAME) return null
    const agentId = node.data.settings.input['agentId']
    return typeof agentId === 'string' ? agentId : null
}

function extractConnectionIds(flowVersion: FlowVersion): string[] {
    const allIds = getAllSteps(flowVersion)
        .flatMap(node => {
            if (!isActionNodeData(node.data) || !('input' in node.data.settings)) return []
            const auth = node.data.settings.input?.['auth']
            return typeof auth === 'string'
                ? extractConnectionIdsFromAuth(auth)
                : []
        })

    return Array.from(new Set(allIds))
}

export const flowStructureUtil = {
    isTrigger,
    isAction,
    getAllSteps,
    transferFlow,
    getStepOrThrow,
    getActionOrThrow,
    getStep,
    createBranchEdge,
    findPathToStep,
    isChildOf,
    findUnusedName,
    getAllChildSteps,
    extractConnectionIds,
    extractAgentIds,
    getDirectChildRefs,
    getTriggerNode,
    getSuccessorEdge,
    getPredecessorEdge,
    getLoopEdge,
    getBranchEdges,
    getDefaultChain,
}

type StepWithIndex = FlowGraphNode & {
    dfsIndex: number
}

type FlowVersionLike = {
    graph: FlowGraph
}
