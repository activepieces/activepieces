import { BranchExecutionType, FlowActionKind } from '../actions/action'
import { FlowVersion } from '../flow-version'
import { BranchEdge } from '../graph/flow-graph'
import { flowStructureUtil } from '../util/flow-structure-util'
import { AddBranchRequest, DeleteBranchRequest, MoveBranchRequest, UpdateBranchRequest } from './index'

// --- Add Branch ---

function add(flowVersion: FlowVersion, request: AddBranchRequest): FlowVersion {
    const cloned: FlowVersion = JSON.parse(JSON.stringify(flowVersion))
    const routerNode = flowStructureUtil.getStepOrThrow(request.stepName, cloned)
    if (routerNode.data.kind !== FlowActionKind.ROUTER) {
        return cloned
    }

    const newBranchEdge = flowStructureUtil.createBranchEdge(
        request.stepName,
        request.branchIndex,
        request.branchName,
        request.conditions,
    )

    // Shift existing branch indexes
    const branchEdges = flowStructureUtil.getBranchEdges(cloned.graph, request.stepName)
    for (const edge of branchEdges) {
        if (edge.branchIndex >= request.branchIndex) {
            edge.branchIndex += 1
            edge.id = `${edge.source}-branch-${edge.branchIndex}`
        }
    }

    cloned.graph.edges.push(newBranchEdge)
    return cloned
}

// --- Delete Branch ---

function remove(flowVersion: FlowVersion, request: DeleteBranchRequest): FlowVersion {
    const cloned: FlowVersion = JSON.parse(JSON.stringify(flowVersion))
    const branchEdges = flowStructureUtil.getBranchEdges(cloned.graph, request.stepName)
    const deletedEdge = branchEdges.find((e) => e.branchIndex === request.branchIndex)
    if (!deletedEdge) {
        return cloned
    }

    // Collect all nodes reachable from the deleted branch
    const nodesToRemove = new Set<string>()
    if (deletedEdge.target) {
        collectAllReachable(deletedEdge.target, cloned, nodesToRemove)
    }

    // Remove the branch edge
    cloned.graph.edges = cloned.graph.edges.filter((e) => e !== deletedEdge)

    // Remove all descendant nodes and their edges
    cloned.graph.nodes = cloned.graph.nodes.filter((n) => !nodesToRemove.has(n.id))
    cloned.graph.edges = cloned.graph.edges.filter(
        (e) => !nodesToRemove.has(e.source) && !nodesToRemove.has(e.target!),
    )

    // Shift remaining branch indexes down
    const remainingBranchEdges = flowStructureUtil.getBranchEdges(cloned.graph, request.stepName)
    for (const edge of remainingBranchEdges) {
        if (edge.branchIndex > request.branchIndex) {
            edge.branchIndex -= 1
            edge.id = `${edge.source}-branch-${edge.branchIndex}`
        }
    }

    return cloned
}

function collectAllReachable(nodeId: string, flowVersion: FlowVersion, collected: Set<string>): void {
    collected.add(nodeId)
    const node = flowVersion.graph.nodes.find((n) => n.id === nodeId)
    if (!node) return

    // Follow default edge
    const defaultEdge = flowStructureUtil.getSuccessorEdge(flowVersion.graph, nodeId)
    if (defaultEdge && defaultEdge.target && !collected.has(defaultEdge.target)) {
        collectAllReachable(defaultEdge.target, flowVersion, collected)
    }

    // Follow branch edges
    const branchEdges = flowStructureUtil.getBranchEdges(flowVersion.graph, nodeId)
    for (const branchEdge of branchEdges) {
        if (branchEdge.target && !collected.has(branchEdge.target)) {
            collectAllReachable(branchEdge.target, flowVersion, collected)
        }
    }

    // Follow loop edge
    const loopEdge = flowStructureUtil.getLoopEdge(flowVersion.graph, nodeId)
    if (loopEdge && loopEdge.target && !collected.has(loopEdge.target)) {
        collectAllReachable(loopEdge.target, flowVersion, collected)
    }
}

// --- Move Branch ---

function isIndexWithinBounds(index: number, arrayLength: number): boolean {
    return index >= 0 && index < arrayLength
}

function move(flowVersion: FlowVersion, request: MoveBranchRequest): FlowVersion {
    const cloned: FlowVersion = JSON.parse(JSON.stringify(flowVersion))
    const routerNode = cloned.graph.nodes.find((n) => n.id === request.stepName)
    if (!routerNode) return cloned
    if (routerNode.data.kind !== FlowActionKind.ROUTER) return cloned

    const branchEdges = flowStructureUtil.getBranchEdges(cloned.graph, request.stepName)
    if (!isIndexWithinBounds(request.sourceBranchIndex, branchEdges.length) ||
        !isIndexWithinBounds(request.targetBranchIndex, branchEdges.length) ||
        request.sourceBranchIndex === request.targetBranchIndex) {
        return cloned
    }

    const sourceEdge = branchEdges[request.sourceBranchIndex]
    const targetEdge = branchEdges[request.targetBranchIndex]

    if (sourceEdge.branchType === BranchExecutionType.FALLBACK ||
        targetEdge.branchType === BranchExecutionType.FALLBACK) {
        return cloned
    }

    // Swap branch data (target, branchName, conditions, branchType) between source and target
    const tempTarget = sourceEdge.target
    const tempName = sourceEdge.branchName
    const tempConditions = (sourceEdge as BranchEdge).conditions
    const tempBranchType = sourceEdge.branchType

    sourceEdge.target = targetEdge.target
    sourceEdge.branchName = targetEdge.branchName
    ;(sourceEdge as BranchEdge).conditions = (targetEdge as BranchEdge).conditions
    sourceEdge.branchType = targetEdge.branchType

    targetEdge.target = tempTarget
    targetEdge.branchName = tempName
    ;(targetEdge as BranchEdge).conditions = tempConditions
    targetEdge.branchType = tempBranchType

    return cloned
}

function update(flowVersion: FlowVersion, request: UpdateBranchRequest): FlowVersion {
    const cloned: FlowVersion = JSON.parse(JSON.stringify(flowVersion))
    const branchEdges = flowStructureUtil.getBranchEdges(cloned.graph, request.stepName)
    const branchEdge = branchEdges.find((e) => e.branchIndex === request.branchIndex)
    if (!branchEdge) {
        return cloned
    }
    if (request.branchName !== undefined) {
        branchEdge.branchName = request.branchName
    }
    if (request.conditions !== undefined) {
        branchEdge.conditions = request.conditions
    }
    return cloned
}

export const branchOperations = { add, remove, move, update }
