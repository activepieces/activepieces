import { TypeCompiler } from '@sinclair/typebox/compiler'
import { applyFunctionToValuesSync, isNil, isString } from '../../../core/common'
import { ActivepiecesError, ErrorCode } from '../../../core/common/activepieces-error'
import { BranchExecutionType, FlowActionKind, SingleActionSchema } from '../actions/action'
import { FlowVersion } from '../flow-version'
import { BranchEdge, FlowEdgeType, FlowGraphNode, FlowNodeData, FlowNodeType, isActionNodeData } from '../graph/flow-graph'
import { flowStructureUtil } from '../util/flow-structure-util'
import { AddActionRequest, DeleteActionRequest, SkipActionRequest, StepLocationRelativeToParent, UpdateActionRequest } from './index'

const actionSchemaValidator = TypeCompiler.Compile(SingleActionSchema)

function createAction(request: UpdateActionRequest): FlowGraphNode {
    const baseData = {
        displayName: request.displayName,
        name: request.name,
        valid: false,
        skip: request.skip,
        kind: request.kind,
        settings: {
            ...request.settings,
            customLogoUrl: request.settings.customLogoUrl,
        },
    }
    const valid = (isNil(request.valid) ? true : request.valid) && actionSchemaValidator.Check(baseData)
    return {
        id: request.name,
        type: FlowNodeType.ACTION,
        data: {
            ...baseData,
            valid,
        } as FlowNodeData,
    }
}

// --- Add Action ---

function add(flowVersion: FlowVersion, request: AddActionRequest): FlowVersion {
    const cloned: FlowVersion = JSON.parse(JSON.stringify(flowVersion))
    const newNode = createAction(request.action)
    const parentId = request.parentStep
    const parentNode = flowStructureUtil.getStepOrThrow(parentId, cloned)
    if (parentNode.data.kind === FlowActionKind.LOOP_ON_ITEMS && request.stepLocationRelativeToParent === StepLocationRelativeToParent.INSIDE_LOOP) {
        return addInsideLoop(cloned, parentId, newNode)
    }
    else if (parentNode.data.kind === FlowActionKind.ROUTER && request.stepLocationRelativeToParent === StepLocationRelativeToParent.INSIDE_BRANCH && !isNil(request.branchIndex)) {
        return addInsideBranch(cloned, parentId, request.branchIndex, newNode)
    }
    else {
        return addAfter(cloned, parentId, newNode)
    }
}

function addAfter(flowVersion: FlowVersion, parentId: string, newNode: FlowGraphNode): FlowVersion {
    flowVersion.graph.nodes.push(newNode)
    const existingEdge = flowStructureUtil.getSuccessorEdge(flowVersion.graph, parentId)
    if (existingEdge && existingEdge.type === FlowEdgeType.DEFAULT) {
        const oldTarget = existingEdge.target
        existingEdge.target = newNode.id
        flowVersion.graph.edges.push({
            id: `${newNode.id}-default`,
            source: newNode.id,
            target: oldTarget,
            type: FlowEdgeType.DEFAULT,
        })
    }
    else {
        flowVersion.graph.edges.push({
            id: `${parentId}-default`,
            source: parentId,
            target: newNode.id,
            type: FlowEdgeType.DEFAULT,
        })
    }
    addStructuralEdges(flowVersion, newNode)
    return flowVersion
}

function addStructuralEdges(flowVersion: FlowVersion, newNode: FlowGraphNode): void {
    if (newNode.data.kind === FlowActionKind.ROUTER) {
        flowVersion.graph.edges.push(...getDefaultBranchEdges(newNode.id))
    }
    else if (newNode.data.kind === FlowActionKind.LOOP_ON_ITEMS) {
        flowVersion.graph.edges.push({
            id: `${newNode.id}-loop`,
            source: newNode.id,
            target: null,
            type: FlowEdgeType.LOOP,
        })
    }
}

function addInsideLoop(flowVersion: FlowVersion, loopId: string, newNode: FlowGraphNode): FlowVersion {
    flowVersion.graph.nodes.push(newNode)
    const loopEdge = flowStructureUtil.getLoopEdge(flowVersion.graph, loopId)
    if (loopEdge && loopEdge.target) {
        const oldFirst = loopEdge.target
        loopEdge.target = newNode.id
        flowVersion.graph.edges.push({
            id: `${newNode.id}-default`,
            source: newNode.id,
            target: oldFirst,
            type: FlowEdgeType.DEFAULT,
        })
    }
    else if (loopEdge) {
        loopEdge.target = newNode.id
    }
    else {
        flowVersion.graph.edges.push({
            id: `${loopId}-loop`,
            source: loopId,
            target: newNode.id,
            type: FlowEdgeType.LOOP,
        })
    }
    addStructuralEdges(flowVersion, newNode)
    return flowVersion
}

function addInsideBranch(flowVersion: FlowVersion, routerId: string, branchIndex: number, newNode: FlowGraphNode): FlowVersion {
    flowVersion.graph.nodes.push(newNode)
    const branchEdges = flowStructureUtil.getBranchEdges(flowVersion.graph, routerId)
    const branchEdge = branchEdges.find((e) => e.branchIndex === branchIndex)
    if (branchEdge && branchEdge.target) {
        const oldFirst = branchEdge.target
        branchEdge.target = newNode.id
        flowVersion.graph.edges.push({
            id: `${newNode.id}-default`,
            source: newNode.id,
            target: oldFirst,
            type: FlowEdgeType.DEFAULT,
        })
    }
    else if (branchEdge) {
        branchEdge.target = newNode.id
    }
    else {
        throw new ActivepiecesError({
            code: ErrorCode.FLOW_OPERATION_INVALID,
            params: {
                message: `Branch index ${branchIndex} not found on router ${routerId}`,
            },
        })
    }
    addStructuralEdges(flowVersion, newNode)
    return flowVersion
}

// --- Delete Action ---

function remove(flowVersion: FlowVersion, request: DeleteActionRequest): FlowVersion {
    const cloned: FlowVersion = JSON.parse(JSON.stringify(flowVersion))
    for (const name of request.names) {
        removeNode(cloned, name)
    }
    return cloned
}

function removeNode(flowVersion: FlowVersion, nodeId: string): void {
    const node = flowVersion.graph.nodes.find((n) => n.id === nodeId)
    if (!node) return

    // First collect all descendants to remove (for loops/routers)
    const descendantIds = collectDescendantIds(nodeId, flowVersion)

    // Find the edge pointing TO this node
    const incomingEdge = flowStructureUtil.getPredecessorEdge(flowVersion.graph, nodeId)
    // Find this node's outgoing default edge
    const outgoingDefaultEdge = flowStructureUtil.getSuccessorEdge(flowVersion.graph, nodeId)

    if (incomingEdge && outgoingDefaultEdge) {
        incomingEdge.target = outgoingDefaultEdge.target
    }
    else if (incomingEdge) {
        // If no outgoing default, the incoming edge now points to nothing
        // If it's a branch/loop edge, set target to null; if default, remove it
        if (incomingEdge.type === FlowEdgeType.DEFAULT) {
            flowVersion.graph.edges = flowVersion.graph.edges.filter((e) => e !== incomingEdge)
        }
        else {
            (incomingEdge as BranchEdge).target = null
        }
    }

    // Remove the node and all its edges
    const allToRemove = new Set([nodeId, ...descendantIds])
    flowVersion.graph.nodes = flowVersion.graph.nodes.filter((n) => !allToRemove.has(n.id))
    flowVersion.graph.edges = flowVersion.graph.edges.filter(
        (e) => !allToRemove.has(e.source) && (!allToRemove.has(e.target!) || e === incomingEdge),
    )
    // Also remove the outgoing default edge of the deleted node
    if (outgoingDefaultEdge) {
        flowVersion.graph.edges = flowVersion.graph.edges.filter((e) => e !== outgoingDefaultEdge)
    }
}

function collectDescendantIds(nodeId: string, flowVersion: FlowVersion): string[] {
    const node = flowVersion.graph.nodes.find((n) => n.id === nodeId)
    if (!node) return []
    const descendants = flowStructureUtil.getAllChildSteps(node, flowVersion)
    return descendants.map((d) => d.id)
}

// --- Update Action ---

function update(flowVersion: FlowVersion, request: UpdateActionRequest): FlowVersion {
    return flowStructureUtil.transferFlow(flowVersion, (node) => {
        if (node.id !== request.name || !isActionNodeData(node.data)) {
            return node
        }

        const updatedData = {
            displayName: request.displayName,
            name: request.name,
            valid: false,
            skip: request.skip,
            kind: request.kind,
            settings: {
                ...node.data.settings,
                customLogoUrl: request.settings.customLogoUrl,
                ...request.settings,
            },
        }
        const valid = (isNil(request.valid) ? true : request.valid) && actionSchemaValidator.Check(updatedData)
        return {
            ...node,
            data: {
                ...updatedData,
                valid,
            } as FlowNodeData,
        }
    })
}

// --- Skip Action ---

function skip(flowVersion: FlowVersion, request: SkipActionRequest): FlowVersion {
    return flowStructureUtil.transferFlow(flowVersion, (node) => {
        if (!request.names.includes(node.id) || !isActionNodeData(node.data)) {
            return node
        }
        return {
            ...node,
            data: {
                ...node.data,
                skip: request.skip,
            } as FlowNodeData,
        }
    })
}

// --- Action Utils (used by composite-operations) ---

function mapToNewNames(flowVersion: FlowVersion, clonedNodes: FlowGraphNode[]): Record<string, string> {
    const existingNames = flowStructureUtil.getAllSteps(flowVersion)
        .map(node => node.id)

    const oldStepNames = clonedNodes.map(node => node.id)

    return oldStepNames.reduce((nameMap, oldName) => {
        const newName = flowStructureUtil.findUnusedName(existingNames)
        existingNames.push(newName)
        return { ...nameMap, [oldName]: newName }
    }, {} as Record<string, string>)
}

function replaceOldStepNameWithNewOne({
    input,
    oldStepName,
    newStepName,
}: ReplaceOldStepNameWithNewOneProps): string {
    const regex = /{{(.*?)}}/g
    return input.replace(regex, (_match, content) => {
        const replacedContent = content.replaceAll(
            new RegExp(`\\b${oldStepName}\\b`, 'g'),
            `${newStepName}`,
        )
        return `{{${replacedContent}}}`
    })
}

function clone(node: FlowGraphNode, oldNameToNewName: Record<string, string>): FlowGraphNode {
    const clonedData: FlowNodeData = JSON.parse(JSON.stringify(node.data))
    clonedData.displayName = `${node.data.displayName} Copy`
    clonedData.name = oldNameToNewName[node.id]
    if (isActionNodeData(clonedData) && 'input' in clonedData.settings) {
        const settings = clonedData.settings
        Object.keys(oldNameToNewName).forEach((oldName) => {
            settings.input = applyFunctionToValuesSync(
                settings.input,
                (value: unknown) => {
                    if (isString(value)) {
                        return replaceOldStepNameWithNewOne({
                            input: value,
                            oldStepName: oldName,
                            newStepName: oldNameToNewName[oldName],
                        })
                    }
                    return value
                },
            )
        })
    }
    if ('sampleData' in clonedData.settings && clonedData.settings.sampleData) {
        clonedData.settings.sampleData = {}
    }
    return {
        id: oldNameToNewName[node.id],
        type: node.type,
        data: clonedData,
    }
}

function getDefaultBranchEdges(source: string): BranchEdge[] {
    return [
        {
            id: `${source}-branch-0`,
            source,
            target: null,
            type: FlowEdgeType.BRANCH,
            branchIndex: 0,
            branchName: 'Branch 1',
            branchType: BranchExecutionType.CONDITION,
            conditions: [[]],
        },
        {
            id: `${source}-branch-1`,
            source,
            target: null,
            type: FlowEdgeType.BRANCH,
            branchIndex: 1,
            branchName: 'Otherwise',
            branchType: BranchExecutionType.FALLBACK,
        },
    ]
}

export const actionOperations = { add, remove, update, skip, createAction, getDefaultBranchEdges }
export const actionUtils = { mapToNewNames, clone }

type ReplaceOldStepNameWithNewOneProps = {
    input: string
    oldStepName: string
    newStepName: string
}

