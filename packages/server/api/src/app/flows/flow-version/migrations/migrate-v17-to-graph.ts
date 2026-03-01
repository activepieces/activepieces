import {
    BranchExecutionType,
    FlowActionKind,
    FlowVersion,
} from '@activepieces/shared'
import { Migration } from '.'

export const migrateV17ToGraph: Migration = {
    targetSchemaVersion: '16',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const oldTrigger = (flowVersion as unknown as { trigger: LegacyStep }).trigger
        const nodes: GraphNode[] = []
        const edges: GraphEdge[] = []

        nodes.push({
            id: oldTrigger.name,
            type: 'trigger',
            data: {
                kind: oldTrigger.type,
                displayName: oldTrigger.displayName,
                valid: oldTrigger.valid,
                settings: oldTrigger.settings,
            },
        })

        walkChain(oldTrigger.name, oldTrigger.nextAction, nodes, edges)

        const result = {
            ...flowVersion,
            graph: { nodes, edges },
            schemaVersion: '17',
        }
        delete (result as Record<string, unknown>).trigger
        delete (result as Record<string, unknown>).steps
        return result as unknown as FlowVersion
    },
}

function walkChain(
    previousNodeId: string,
    firstStep: LegacyStep | null | undefined,
    nodes: GraphNode[],
    edges: GraphEdge[],
): void {
    let current = firstStep
    let prevId = previousNodeId
    while (current) {
        const node = buildNode(current, nodes, edges)
        nodes.push(node)
        edges.push({
            id: `${prevId}->${node.id}`,
            source: prevId,
            target: node.id,
            type: 'default',
        })
        prevId = node.id
        current = current.nextAction
    }
}

function buildNode(
    step: LegacyStep,
    nodes: GraphNode[],
    edges: GraphEdge[],
): GraphNode {
    if (step.type === FlowActionKind.ROUTER) {
        return buildRouterNode(step, nodes, edges)
    }
    if (step.type === FlowActionKind.LOOP_ON_ITEMS) {
        return buildLoopNode(step, nodes, edges)
    }
    return {
        id: step.name,
        type: 'action',
        data: {
            kind: step.type,
            displayName: step.displayName,
            valid: step.valid,
            skip: step.skip,
            settings: step.settings,
        },
    }
}

function buildRouterNode(
    step: LegacyStep,
    nodes: GraphNode[],
    edges: GraphEdge[],
): GraphNode {
    const oldBranches = (step.settings?.branches ?? []) as LegacyBranch[]
    const oldChildren = step.children ?? []

    const settings = { ...step.settings }
    delete settings.branches

    for (let i = 0; i < oldBranches.length; i++) {
        const branch = oldBranches[i]
        const child = oldChildren[i] ?? null
        const firstChildId = child ? child.name : null

        const branchEdge: GraphEdge = {
            id: `${step.name}-branch-${i}`,
            source: step.name,
            target: firstChildId,
            type: 'branch',
            branchIndex: i,
            branchName: branch.branchName,
            branchType: branch.branchType as BranchExecutionType,
        }
        if (branch.conditions) {
            branchEdge.conditions = branch.conditions as unknown[][]
        }
        edges.push(branchEdge)

        if (child) {
            walkChain(step.name, child, nodes, edges)
            // Remove the extra default edge from step.name -> child since we have the branch edge
            const extraEdgeIdx = edges.findIndex(
                (e) => e.type === 'default' && e.source === step.name && e.target === child.name,
            )
            if (extraEdgeIdx !== -1) {
                edges.splice(extraEdgeIdx, 1)
            }
        }
    }

    return {
        id: step.name,
        type: 'action',
        data: {
            kind: FlowActionKind.ROUTER,
            displayName: step.displayName,
            valid: step.valid,
            skip: step.skip,
            settings,
        },
    }
}

function buildLoopNode(
    step: LegacyStep,
    nodes: GraphNode[],
    edges: GraphEdge[],
): GraphNode {
    const firstChild = step.firstLoopAction
    const firstChildId = firstChild ? firstChild.name : null

    edges.push({
        id: `${step.name}-loop`,
        source: step.name,
        target: firstChildId,
        type: 'loop',
    })

    if (firstChild) {
        walkChain(step.name, firstChild, nodes, edges)
        // Remove the extra default edge from step.name -> firstChild since we have the loop edge
        const extraEdgeIdx = edges.findIndex(
            (e) => e.type === 'default' && e.source === step.name && e.target === firstChild.name,
        )
        if (extraEdgeIdx !== -1) {
            edges.splice(extraEdgeIdx, 1)
        }
    }

    return {
        id: step.name,
        type: 'action',
        data: {
            kind: FlowActionKind.LOOP_ON_ITEMS,
            displayName: step.displayName,
            valid: step.valid,
            skip: step.skip,
            settings: step.settings,
        },
    }
}

type LegacyStep = {
    name: string
    type: string
    displayName: string
    valid: boolean
    settings: Record<string, unknown>
    skip?: boolean
    nextAction?: LegacyStep
    children?: (LegacyStep | null)[]
    firstLoopAction?: LegacyStep
}

type LegacyBranch = {
    branchName: string
    branchType: string
    conditions?: unknown
}

type GraphNode = {
    id: string
    type: string
    data: Record<string, unknown>
}

type GraphEdge = {
    id: string
    source: string
    target: string | null
    type: string
    branchIndex?: number
    branchName?: string
    branchType?: BranchExecutionType
    conditions?: unknown[][]
}
