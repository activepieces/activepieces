import { FlowActionKind } from '../actions/action'
import { FlowVersion } from '../flow-version'
import { BranchEdge, FlowEdgeType, FlowGraph, FlowGraphNode, FlowNodeType, isActionNodeData, isTriggerNodeData } from '../graph/flow-graph'
import { flowStructureUtil } from '../util/flow-structure-util'
import { actionOperations, actionUtils } from './action-operations'
import { FlowOperationRequest, FlowOperationType, ImportFlowRequest, MoveActionRequest, StepLocationRelativeToParent, UpdateActionRequest, UpdateTriggerRequest } from './index'

// --- Move Action ---

function moveAction(flowVersion: FlowVersion, request: MoveActionRequest): FlowOperationRequest[] {
    const node = flowStructureUtil.getActionOrThrow(request.name, flowVersion)
    flowStructureUtil.getStepOrThrow(request.newParentStep, flowVersion)
    if (!isActionNodeData(node.data)) return []
    return [
        {
            type: FlowOperationType.DELETE_ACTION,
            request: { names: [request.name] },
        },
        {
            type: FlowOperationType.ADD_ACTION,
            request: {
                action: node.data,
                parentStep: request.newParentStep,
                stepLocationRelativeToParent: request.stepLocationRelativeToNewParent,
                branchIndex: request.branchIndex,
            },
        },
    ]
}

// --- Duplicate Step ---

function duplicateStep(stepName: string, flowVersion: FlowVersion): FlowOperationRequest[] {
    const node = flowStructureUtil.getActionOrThrow(stepName, flowVersion)
    const allDescendants = collectDescendantNodes(node, flowVersion)
    const allNodes = [node, ...allDescendants]
    const oldNameToNewName = actionUtils.mapToNewNames(flowVersion, allNodes)

    const clonedMain = actionUtils.clone(JSON.parse(JSON.stringify(node)), oldNameToNewName)

    if (!isActionNodeData(clonedMain.data)) return []
    const operations: FlowOperationRequest[] = [
        {
            type: FlowOperationType.ADD_ACTION,
            request: {
                action: clonedMain.data,
                parentStep: stepName,
                stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
            },
        },
    ]

    // Add descendant operations - we need to reconstruct the graph structure
    const clonedDescendantOps = getDescendantAddOperations(node, allDescendants, oldNameToNewName, flowVersion)
    operations.push(...clonedDescendantOps)

    return operations
}

function getDescendantAddOperations(
    parentNode: FlowGraphNode,
    descendants: FlowGraphNode[],
    oldNameToNewName: Record<string, string>,
    flowVersion: FlowVersion,
): FlowOperationRequest[] {
    const operations: FlowOperationRequest[] = []
    const graph = flowVersion.graph

    if (parentNode.data.kind === FlowActionKind.LOOP_ON_ITEMS) {
        const loopEdge = flowStructureUtil.getLoopEdge(graph, parentNode.id)
        if (loopEdge && loopEdge.target) {
            addChainOperations(loopEdge.target, graph, oldNameToNewName, oldNameToNewName[parentNode.id], StepLocationRelativeToParent.INSIDE_LOOP, undefined, operations, flowVersion)
        }
    }
    else if (parentNode.data.kind === FlowActionKind.ROUTER) {
        const branchEdges = flowStructureUtil.getBranchEdges(graph, parentNode.id)
        for (const branchEdge of branchEdges) {
            if (branchEdge.target) {
                addChainOperations(branchEdge.target, graph, oldNameToNewName, oldNameToNewName[parentNode.id], StepLocationRelativeToParent.INSIDE_BRANCH, branchEdge.branchIndex, operations, flowVersion)
            }
        }
    }

    return operations
}

function addChainOperations(
    startNodeId: string,
    graph: FlowGraph,
    oldNameToNewName: Record<string, string>,
    parentStepName: string,
    firstLocation: StepLocationRelativeToParent,
    branchIndex: number | undefined,
    operations: FlowOperationRequest[],
    flowVersion: FlowVersion,
): void {
    const chain = flowStructureUtil.getDefaultChain(graph, startNodeId)
    for (let i = 0; i < chain.length; i++) {
        const nodeId = chain[i]
        const node = graph.nodes.find((n) => n.id === nodeId)
        if (!node) continue

        const clonedNode = actionUtils.clone(JSON.parse(JSON.stringify(node)), oldNameToNewName)
        if (!isActionNodeData(clonedNode.data)) continue

        const parentStep = i === 0 ? parentStepName : oldNameToNewName[chain[i - 1]]
        const location = i === 0 ? firstLocation : StepLocationRelativeToParent.AFTER
        const branchIdx = i === 0 ? branchIndex : undefined
        operations.push(createAddActionOperation(clonedNode.data, parentStep, location, branchIdx))

        // Recurse into nested structures
        if (node.data.kind === FlowActionKind.LOOP_ON_ITEMS) {
            const loopEdge = flowStructureUtil.getLoopEdge(graph, nodeId)
            if (loopEdge && loopEdge.target) {
                addChainOperations(loopEdge.target, graph, oldNameToNewName, oldNameToNewName[nodeId], StepLocationRelativeToParent.INSIDE_LOOP, undefined, operations, flowVersion)
            }
        }
        else if (node.data.kind === FlowActionKind.ROUTER) {
            const branchEdges = flowStructureUtil.getBranchEdges(graph, nodeId)
            for (const bEdge of branchEdges) {
                if (bEdge.target) {
                    addChainOperations(bEdge.target, graph, oldNameToNewName, oldNameToNewName[nodeId], StepLocationRelativeToParent.INSIDE_BRANCH, bEdge.branchIndex, operations, flowVersion)
                }
            }
        }
    }
}

// --- Duplicate Branch ---

function duplicateBranch(routerName: string, childIndex: number, flowVersion: FlowVersion): FlowOperationRequest[] {
    const routerNode = flowStructureUtil.getActionOrThrow(routerName, flowVersion)
    const branchEdges = flowStructureUtil.getBranchEdges(flowVersion.graph, routerName)
    if (branchEdges.length === 0) {
        return []
    }
    const branchEdge = branchEdges[childIndex]
    if (!branchEdge) return []

    const operations: FlowOperationRequest[] = [{
        type: FlowOperationType.ADD_BRANCH,
        request: {
            branchName: `${branchEdge.branchName} Copy`,
            branchIndex: childIndex + 1,
            stepName: routerName,
            conditions: branchEdge.branchType === 'CONDITION' ? branchEdge.conditions : undefined,
        },
    }]

    if (branchEdge.target) {
        const chain = flowStructureUtil.getDefaultChain(flowVersion.graph, branchEdge.target)
        const chainNodes = chain.map((id) => flowVersion.graph.nodes.find((n) => n.id === id)!).filter(Boolean)
        const allDescendants = chainNodes.flatMap((node) => [node, ...collectDescendantNodes(node, flowVersion)])

        // Remove duplicates
        const seen = new Set<string>()
        const uniqueDescendants: FlowGraphNode[] = []
        for (const d of allDescendants) {
            if (!seen.has(d.id)) {
                seen.add(d.id)
                uniqueDescendants.push(d)
            }
        }

        const oldNameToNewName = actionUtils.mapToNewNames(flowVersion, uniqueDescendants)

        for (let i = 0; i < chainNodes.length; i++) {
            const clonedNode = actionUtils.clone(JSON.parse(JSON.stringify(chainNodes[i])), oldNameToNewName)
            if (!isActionNodeData(clonedNode.data)) continue

            const parentStep = i === 0 ? routerName : oldNameToNewName[chainNodes[i - 1].id]
            const location = i === 0 ? StepLocationRelativeToParent.INSIDE_BRANCH : StepLocationRelativeToParent.AFTER
            const branchIdx = i === 0 ? childIndex + 1 : undefined
            operations.push(createAddActionOperation(clonedNode.data, parentStep, location, branchIdx))

            // Handle nested structures
            if (chainNodes[i].data.kind === FlowActionKind.LOOP_ON_ITEMS) {
                const loopEdge = flowStructureUtil.getLoopEdge(flowVersion.graph, chainNodes[i].id)
                if (loopEdge && loopEdge.target) {
                    addChainOperations(loopEdge.target, flowVersion.graph, oldNameToNewName, oldNameToNewName[chainNodes[i].id], StepLocationRelativeToParent.INSIDE_LOOP, undefined, operations, flowVersion)
                }
            }
            else if (chainNodes[i].data.kind === FlowActionKind.ROUTER) {
                const innerBranchEdges = flowStructureUtil.getBranchEdges(flowVersion.graph, chainNodes[i].id)
                for (const bEdge of innerBranchEdges) {
                    if (bEdge.target) {
                        addChainOperations(bEdge.target, flowVersion.graph, oldNameToNewName, oldNameToNewName[chainNodes[i].id], StepLocationRelativeToParent.INSIDE_BRANCH, bEdge.branchIndex, operations, flowVersion)
                    }
                }
            }
        }
    }

    return operations
}

// --- Import Flow ---

function importFlow(flowVersion: FlowVersion, request: ImportFlowRequest): FlowOperationRequest[] {
    const existingActionNodes = flowVersion.graph.nodes
        .filter((n) => n.type === FlowNodeType.ACTION)
        .map((n) => n.id)

    const deleteOperations = existingActionNodes.map(name =>
        createDeleteActionOperation(name),
    )

    const importGraph = request.graph
    const triggerNode = importGraph.nodes.find((n) => n.type === FlowNodeType.TRIGGER)

    const importOperations = getImportOperationsFromGraph(importGraph)

    return [
        createChangeNameOperation(request.displayName),
        ...deleteOperations,
        ...(triggerNode && isTriggerNodeData(triggerNode.data) ? [createUpdateTriggerOperation(triggerNode.data)] : []),
        ...importOperations,
        ...getImportOperationsForNotes(flowVersion, request),
    ]
}

function getImportOperationsFromGraph(graph: FlowGraph): FlowOperationRequest[] {
    const operations: FlowOperationRequest[] = []
    const triggerNode = graph.nodes.find((n) => n.type === FlowNodeType.TRIGGER)
    if (!triggerNode) return operations

    // Follow default edges from trigger
    const defaultEdge = graph.edges.find((e) => e.source === triggerNode.id && e.type === FlowEdgeType.DEFAULT)
    if (!defaultEdge || !defaultEdge.target) return operations

    addImportChainOperations(defaultEdge.target, graph, triggerNode.id, StepLocationRelativeToParent.AFTER, undefined, operations)
    return operations
}

function addImportChainOperations(
    startNodeId: string,
    graph: FlowGraph,
    firstParent: string,
    firstLocation: StepLocationRelativeToParent,
    branchIndex: number | undefined,
    operations: FlowOperationRequest[],
): void {
    const chain = getDefaultChainFromGraph(graph, startNodeId)
    for (let i = 0; i < chain.length; i++) {
        const nodeId = chain[i]
        const node = graph.nodes.find((n) => n.id === nodeId)
        if (!node || !isActionNodeData(node.data)) continue

        const parentStep = i === 0 ? firstParent : chain[i - 1]
        const location = i === 0 ? firstLocation : StepLocationRelativeToParent.AFTER
        const branchIdx = i === 0 ? branchIndex : undefined
        operations.push(createAddActionOperation(node.data, parentStep, location, branchIdx))

        // Handle nested structures
        if (node.data.kind === FlowActionKind.LOOP_ON_ITEMS) {
            const loopEdge = graph.edges.find((e) => e.source === nodeId && e.type === FlowEdgeType.LOOP)
            if (loopEdge && loopEdge.target) {
                addImportChainOperations(loopEdge.target, graph, nodeId, StepLocationRelativeToParent.INSIDE_LOOP, undefined, operations)
            }
        }
        else if (node.data.kind === FlowActionKind.ROUTER) {
            const branchEdges = graph.edges
                .filter((e): e is BranchEdge => e.source === nodeId && e.type === FlowEdgeType.BRANCH)
                .sort((a, b) => a.branchIndex - b.branchIndex)

            // ADD_ACTION creates default branches. For extra branches beyond those, emit ADD_BRANCH.
            const defaultBranchCount = actionOperations.getDefaultBranchEdges('').length
            for (const bEdge of branchEdges) {
                if (bEdge.branchIndex >= defaultBranchCount) {
                    operations.push({
                        type: FlowOperationType.ADD_BRANCH,
                        request: {
                            stepName: nodeId,
                            branchIndex: bEdge.branchIndex,
                            branchName: bEdge.branchName,
                            conditions: bEdge.conditions,
                        },
                    })
                }
                else {
                    operations.push({
                        type: FlowOperationType.UPDATE_BRANCH,
                        request: {
                            stepName: nodeId,
                            branchIndex: bEdge.branchIndex,
                            branchName: bEdge.branchName,
                            conditions: bEdge.conditions,
                        },
                    })
                }
            }

            for (const bEdge of branchEdges) {
                if (bEdge.target) {
                    addImportChainOperations(bEdge.target, graph, nodeId, StepLocationRelativeToParent.INSIDE_BRANCH, bEdge.branchIndex, operations)
                }
            }
        }
    }
}

function getDefaultChainFromGraph(graph: FlowGraph, startId: string): string[] {
    const result: string[] = [startId]
    let currentId = startId
    while (true) {
        const edge = graph.edges.find((e) => e.source === currentId && e.type === FlowEdgeType.DEFAULT)
        if (!edge || !edge.target) break
        result.push(edge.target)
        currentId = edge.target
    }
    return result
}

// --- Copy Actions ---

function getActionsForCopy(selectedSteps: string[], flowVersion: FlowVersion): FlowGraphNode[] {
    const allNodes = flowStructureUtil.getAllSteps(flowVersion)
    const nodesToCopy = selectedSteps
        .map((stepName) => flowStructureUtil.getStepOrThrow(stepName, flowVersion))
        .filter((node) => node.type === FlowNodeType.ACTION)
    return nodesToCopy
        .filter(node => !nodesToCopy.filter(parent => parent.id !== node.id).some(parent => flowStructureUtil.isChildOf(parent, node.id, flowVersion)))
        .map(node => JSON.parse(JSON.stringify(node)) as FlowGraphNode)
        .sort((a, b) => allNodes.findIndex(n => n.id === a.id) - allNodes.findIndex(n => n.id === b.id))
}

// --- Paste Operations ---

function getOperationsForPaste(
    nodes: FlowGraphNode[],
    flowVersion: FlowVersion,
    pastingDetails: PasteLocation,
): FlowOperationRequest[] {
    const newNamesMap = actionUtils.mapToNewNames(flowVersion, nodes)
    const clonedNodes: FlowGraphNode[] = nodes.map(node => {
        const cloned: FlowGraphNode = JSON.parse(JSON.stringify(node))
        return actionUtils.clone(cloned, newNamesMap)
    })
    const operations: FlowOperationRequest[] = []
    for (let i = 0; i < clonedNodes.length; i++) {
        const data = clonedNodes[i].data
        if (!isActionNodeData(data)) continue
        if (i === 0) {
            operations.push({
                type: FlowOperationType.ADD_ACTION,
                request: {
                    action: data,
                    parentStep: pastingDetails.parentStepName,
                    stepLocationRelativeToParent: pastingDetails.stepLocationRelativeToParent,
                    branchIndex: pastingDetails.stepLocationRelativeToParent === StepLocationRelativeToParent.INSIDE_BRANCH ? (pastingDetails as InsideBranchPasteLocation).branchIndex : undefined,
                },
            })
        }
        else {
            operations.push({
                type: FlowOperationType.ADD_ACTION,
                request: {
                    action: data,
                    parentStep: clonedNodes[i - 1].id,
                    stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
                },
            })
        }
    }
    return operations
}

// --- Shared Helpers ---

function collectDescendantNodes(node: FlowGraphNode, flowVersion: FlowVersion): FlowGraphNode[] {
    return flowStructureUtil.getAllChildSteps(node, flowVersion)
}

function getImportOperationsForNotes(flowVersion: FlowVersion, request: ImportFlowRequest): FlowOperationRequest[] {
    return [
        ...flowVersion.notes.map((note): FlowOperationRequest => ({
            type: FlowOperationType.DELETE_NOTE,
            request: { id: note.id },
        })),
        ...(request.notes || []).map((note): FlowOperationRequest => ({
            type: FlowOperationType.ADD_NOTE,
            request: note,
        })),
    ]
}

function createAddActionOperation(
    action: UpdateActionRequest,
    parentStep: string,
    stepLocationRelativeToParent: StepLocationRelativeToParent,
    branchIndex?: number,
): FlowOperationRequest {
    return {
        type: FlowOperationType.ADD_ACTION,
        request: { action, parentStep, stepLocationRelativeToParent, branchIndex },
    }
}

function createDeleteActionOperation(actionName: string): FlowOperationRequest {
    return {
        type: FlowOperationType.DELETE_ACTION,
        request: { names: [actionName] },
    }
}

function createUpdateTriggerOperation(triggerData: UpdateTriggerRequest): FlowOperationRequest {
    return {
        type: FlowOperationType.UPDATE_TRIGGER,
        request: triggerData,
    }
}

function createChangeNameOperation(displayName: string): FlowOperationRequest {
    return {
        type: FlowOperationType.CHANGE_NAME,
        request: { displayName },
    }
}

export const compositeOperations = { moveAction, duplicateStep, duplicateBranch, importFlow, getImportOperationsFromGraph, getActionsForCopy, getOperationsForPaste }

export type InsideBranchPasteLocation = {
    branchIndex: number
    stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_BRANCH
    parentStepName: string
}

export type OutsideBranchPasteLocation = {
    parentStepName: string
    stepLocationRelativeToParent:
    | StepLocationRelativeToParent.AFTER
    | StepLocationRelativeToParent.INSIDE_LOOP
}

export type PasteLocation = InsideBranchPasteLocation | OutsideBranchPasteLocation
