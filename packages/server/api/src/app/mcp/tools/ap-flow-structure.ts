import {
    BranchExecutionType,
    FlowActionType,
    flowStructureUtil,
    FlowTriggerType,
    isNil,
    McpServer,
    McpToolDefinition,
    Note,
    StepLocationRelativeToParent,
} from '@activepieces/shared'
import type { FlowAction, LoopOnItemsAction, RouterAction, Step } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowService } from '../../flows/flow/flow.service'

// Canvas layout constants (ported from frontend consts.ts)
const CANVAS_STEP_HEIGHT = 60
const CANVAS_STEP_WIDTH = 232
const CANVAS_VSPACE = 60
const CANVAS_ARC = 15
const CANVAS_LOOP_VOFFSET = CANVAS_VSPACE * 1.5 + 2 * CANVAS_ARC // 120
const CANVAS_ROUTER_VOFFSET = CANVAS_LOOP_VOFFSET + 30 // 150
const CANVAS_HSPACE = 80

type CanvasBBox = { minX: number, maxX: number, height: number }

// Returns bounding box of buildFlowGraph(step) including all descendants.
// forBranch=true: if step is null/undefined, returns BIG_ADD_BUTTON bbox (for empty loop/router branches)
// forBranch=false: if step is null/undefined, returns zero-height bbox (for absent nextAction)
function getFlowBBox(step: Step | FlowAction | null | undefined, forBranch = false): CanvasBBox {
    if (!step) {
        return forBranch
            ? { minX: 0, maxX: CANVAS_STEP_WIDTH, height: CANVAS_STEP_HEIGHT + CANVAS_VSPACE }
            : { minX: 0, maxX: CANVAS_STEP_WIDTH, height: 0 }
    }

    let withChildMinX = 0
    let withChildMaxX = CANVAS_STEP_WIDTH
    let withChildHeight = CANVAS_STEP_HEIGHT + CANVAS_VSPACE

    if (step.type === FlowActionType.LOOP_ON_ITEMS) {
        const loopStep = step as LoopOnItemsAction
        const childBBox = getFlowBBox(loopStep.firstLoopAction, true)
        const childWidth = childBBox.maxX - childBBox.minX
        const childLeft = -childBBox.minX + CANVAS_STEP_WIDTH / 2
        const childRight = childBBox.maxX - CANVAS_STEP_WIDTH / 2
        const deltaLeftX = -(childWidth + CANVAS_STEP_WIDTH + CANVAS_HSPACE - CANVAS_STEP_WIDTH / 2 - childRight) / 2 - CANVAS_STEP_WIDTH / 2
        const childOffsetX = deltaLeftX + CANVAS_STEP_WIDTH + CANVAS_HSPACE + childLeft
        const subgraphEndY = CANVAS_STEP_HEIGHT + CANVAS_LOOP_VOFFSET + childBBox.height + CANVAS_ARC + CANVAS_VSPACE
        withChildMinX = Math.min(0, deltaLeftX, childOffsetX + childBBox.minX)
        withChildMaxX = Math.max(CANVAS_STEP_WIDTH, deltaLeftX + CANVAS_STEP_WIDTH, childOffsetX + childBBox.maxX)
        withChildHeight = Math.max(CANVAS_STEP_HEIGHT + CANVAS_VSPACE, subgraphEndY)
    }
    else if (step.type === FlowActionType.ROUTER) {
        const routerStep = step as RouterAction
        const children = routerStep.children
        if (children.length > 0) {
            const childBBoxes = children.map(c => getFlowBBox(c, true))
            const totalWidth = childBBoxes.reduce((sum, b) => sum + (b.maxX - b.minX), 0) + CANVAS_HSPACE * (children.length - 1)
            const firstLeft = -childBBoxes[0].minX + CANVAS_STEP_WIDTH / 2
            const lastRight = childBBoxes[children.length - 1].maxX - CANVAS_STEP_WIDTH / 2
            let deltaLeftX = -(totalWidth - firstLeft - lastRight) / 2 - firstLeft
            let routerMinX = 0
            let routerMaxX = CANVAS_STEP_WIDTH
            let maxChildHeight = 0
            for (let i = 0; i < children.length; i++) {
                const bbox = childBBoxes[i]
                const x = deltaLeftX + (-bbox.minX + CANVAS_STEP_WIDTH / 2)
                routerMinX = Math.min(routerMinX, x + bbox.minX)
                routerMaxX = Math.max(routerMaxX, x + bbox.maxX)
                maxChildHeight = Math.max(maxChildHeight, bbox.height)
                deltaLeftX += (bbox.maxX - bbox.minX) + CANVAS_HSPACE
            }
            const subgraphEndY = CANVAS_STEP_HEIGHT + CANVAS_ROUTER_VOFFSET + maxChildHeight + CANVAS_ARC + CANVAS_VSPACE
            withChildMinX = routerMinX
            withChildMaxX = routerMaxX
            withChildHeight = Math.max(CANVAS_STEP_HEIGHT + CANVAS_VSPACE, subgraphEndY)
        }
    }

    const nextBBox = getFlowBBox(step.nextAction, false)
    return {
        minX: Math.min(withChildMinX, nextBBox.minX),
        maxX: Math.max(withChildMaxX, nextBBox.maxX),
        height: withChildHeight + nextBBox.height,
    }
}

function buildPositions(
    step: Step | FlowAction | null | undefined,
    offsetX: number,
    offsetY: number,
    positions: Map<string, { x: number, y: number }>,
): void {
    if (!step) return

    positions.set(step.name, { x: offsetX + CANVAS_STEP_WIDTH / 2, y: offsetY })

    if (step.type === FlowActionType.LOOP_ON_ITEMS) {
        const loopStep = step as LoopOnItemsAction
        const childBBox = getFlowBBox(loopStep.firstLoopAction, true)
        const childLeft = -childBBox.minX + CANVAS_STEP_WIDTH / 2
        const childRight = childBBox.maxX - CANVAS_STEP_WIDTH / 2
        const childWidth = childBBox.maxX - childBBox.minX
        const deltaLeftX = -(childWidth + CANVAS_STEP_WIDTH + CANVAS_HSPACE - CANVAS_STEP_WIDTH / 2 - childRight) / 2 - CANVAS_STEP_WIDTH / 2
        const childOffsetX = offsetX + deltaLeftX + CANVAS_STEP_WIDTH + CANVAS_HSPACE + childLeft
        const childOffsetY = offsetY + CANVAS_STEP_HEIGHT + CANVAS_LOOP_VOFFSET
        if (loopStep.firstLoopAction) {
            buildPositions(loopStep.firstLoopAction, childOffsetX, childOffsetY, positions)
        }
        const subgraphEndY = CANVAS_STEP_HEIGHT + CANVAS_LOOP_VOFFSET + childBBox.height + CANVAS_ARC + CANVAS_VSPACE
        buildPositions(step.nextAction, offsetX, offsetY + subgraphEndY, positions)
    }
    else if (step.type === FlowActionType.ROUTER) {
        const routerStep = step as RouterAction
        const children = routerStep.children
        const childBBoxes = children.map(c => getFlowBBox(c, true))
        let maxChildHeight = 0
        if (children.length > 0) {
            const totalWidth = childBBoxes.reduce((sum, b) => sum + (b.maxX - b.minX), 0) + CANVAS_HSPACE * (children.length - 1)
            const firstLeft = -childBBoxes[0].minX + CANVAS_STEP_WIDTH / 2
            const lastRight = childBBoxes[children.length - 1].maxX - CANVAS_STEP_WIDTH / 2
            let deltaLeftX = -(totalWidth - firstLeft - lastRight) / 2 - firstLeft
            const childOffsetY = offsetY + CANVAS_STEP_HEIGHT + CANVAS_ROUTER_VOFFSET
            for (let i = 0; i < children.length; i++) {
                const child = children[i]
                const bbox = childBBoxes[i]
                const branchOffsetX = offsetX + deltaLeftX + (-bbox.minX + CANVAS_STEP_WIDTH / 2)
                if (child) {
                    buildPositions(child, branchOffsetX, childOffsetY, positions)
                }
                maxChildHeight = Math.max(maxChildHeight, bbox.height)
                deltaLeftX += (bbox.maxX - bbox.minX) + CANVAS_HSPACE
            }
        }
        const subgraphEndY = CANVAS_STEP_HEIGHT + CANVAS_ROUTER_VOFFSET + maxChildHeight + CANVAS_ARC + CANVAS_VSPACE
        buildPositions(step.nextAction, offsetX, offsetY + subgraphEndY, positions)
    }
    else {
        buildPositions(step.nextAction, offsetX, offsetY + CANVAS_STEP_HEIGHT + CANVAS_VSPACE, positions)
    }
}

function computeStepPositions(trigger: Step): Map<string, { x: number, y: number }> {
    const positions = new Map<string, { x: number, y: number }>()
    buildPositions(trigger, 0, 0, positions)
    return positions
}

type StepInfo = {
    name: string
    type: string
    displayName: string
    parentName: string | null
    relationship: 'trigger' | 'next' | 'first_loop_action' | 'branch'
    branchIndex?: number
    branchName?: string
    valid: boolean
    skip?: boolean
    configStatus: string
}

function getConfigStatus(step: Step): string {
    if ((step as { skip?: boolean }).skip) return 'skipped'
    if (step.valid) return 'configured'
    const s = step.settings as { triggerName?: string, actionName?: string }
    switch (step.type) {
        case FlowTriggerType.EMPTY:
            return 'unconfigured (no trigger set)'
        case FlowTriggerType.PIECE:
            return s.triggerName ? 'invalid (check required inputs)' : 'unconfigured (triggerName missing)'
        case FlowActionType.PIECE:
            return s.actionName ? 'invalid (check required inputs)' : 'unconfigured (actionName missing)'
        case FlowActionType.CODE:
            return 'invalid (check sourceCode/input)'
        case FlowActionType.LOOP_ON_ITEMS:
            return 'invalid (loopItems expression missing or invalid)'
        case FlowActionType.ROUTER:
            return 'invalid (check branch conditions)'
        default:
            return 'invalid'
    }
}

function buildFlowStructure(trigger: Step): StepInfo[] {
    const allSteps = flowStructureUtil.getAllSteps(trigger)
    return allSteps.map((step): StepInfo => {
        if (flowStructureUtil.isTrigger(step.type)) {
            return {
                name: step.name,
                type: step.type,
                displayName: step.displayName,
                parentName: null,
                relationship: 'trigger',
                valid: step.valid,
                skip: (step as { skip?: boolean }).skip,
                configStatus: getConfigStatus(step),
            }
        }
        let parentName: string | null = null
        let relationship: StepInfo['relationship'] = 'next'
        let branchIndex: number | undefined
        let branchName: string | undefined
        for (const parent of allSteps) {
            if (parent.nextAction?.name === step.name) {
                parentName = parent.name
                relationship = 'next'
                break
            }
            if (parent.type === FlowActionType.LOOP_ON_ITEMS && (parent as { firstLoopAction?: { name: string } }).firstLoopAction?.name === step.name) {
                parentName = parent.name
                relationship = 'first_loop_action'
                break
            }
            if (parent.type === FlowActionType.ROUTER) {
                const children = (parent as { children?: { name: string }[] }).children
                const idx = children?.findIndex((c) => c?.name === step.name)
                if (idx !== undefined && idx >= 0) {
                    parentName = parent.name
                    relationship = 'branch'
                    branchIndex = idx
                    branchName = (parent as { settings?: { branches?: { branchName?: string }[] } }).settings?.branches?.[idx]?.branchName
                    break
                }
            }
        }
        return {
            name: step.name,
            type: step.type,
            displayName: step.displayName,
            parentName,
            relationship,
            ...(relationship === 'branch' && { branchIndex, branchName }),
            valid: step.valid,
            skip: (step as { skip?: boolean }).skip,
            configStatus: getConfigStatus(step),
        }
    })
}

function formatFlowStructure(
    flowDisplayName: string,
    flowId: string,
    structure: StepInfo[],
    trigger: Step,
    positions: Map<string, { x: number, y: number }>,
    notes: Note[],
): string {
    const lines: string[] = []
    lines.push(`# Flow: ${flowDisplayName} (id: ${flowId})`)
    lines.push('')
    lines.push('## Steps (DFS order: trigger first, then each step with parent and relationship)')
    lines.push('Format: name | type | displayName | parent | relationship | configStatus | canvas')
    lines.push('')

    for (const step of structure) {
        const skipLabel = step.skip ? ' [SKIPPED]' : ''
        const pos = positions.get(step.name)
        const canvasLabel = pos ? ` | canvas: (${Math.round(pos.x)}, ${Math.round(pos.y)})` : ''

        if (step.relationship === 'trigger') {
            let triggerDetail = ''
            if (trigger.type === FlowTriggerType.PIECE) {
                const s = trigger.settings as { pieceName?: string, triggerName?: string }
                triggerDetail = s.pieceName ? ` (piece: ${s.pieceName}, trigger: ${s.triggerName ?? 'not set'})` : ''
            }
            lines.push(`- [TRIGGER] ${step.name} | ${step.type} | "${step.displayName}"${triggerDetail} | parent: — | ${step.configStatus}${skipLabel}${canvasLabel}`)
            continue
        }

        const rel =
            step.relationship === 'next'
                ? 'after parent'
                : step.relationship === 'first_loop_action'
                    ? 'inside_loop'
                    : `branch ${step.branchIndex}${step.branchName ? ` "${step.branchName}"` : ''}`

        let stepDetail = ''
        if (step.type === FlowActionType.PIECE) {
            const fullStep = flowStructureUtil.getStep(step.name, trigger)
            const s = fullStep?.settings as { pieceName?: string, actionName?: string } | undefined
            if (s?.pieceName) stepDetail = ` (piece: ${s.pieceName}, action: ${s.actionName ?? 'not set'})`
        }

        lines.push(`- ${step.name} | ${step.type} | "${step.displayName}"${stepDetail} | parent: ${step.parentName} | ${rel} | ${step.configStatus}${skipLabel}${canvasLabel}`)

        if (step.type === FlowActionType.ROUTER) {
            const fullStep = flowStructureUtil.getStep(step.name, trigger)
            const branches = (fullStep as { settings?: { branches?: { branchName?: string, branchType?: string }[] } } | undefined)?.settings?.branches ?? []
            branches.forEach((b, i) => {
                const btype = b.branchType === BranchExecutionType.FALLBACK ? 'fallback' : 'condition'
                lines.push(`  branch[${i}]: "${b.branchName ?? ''}" (${btype})`)
            })
        }
    }

    lines.push('')
    lines.push('## Valid insert locations for ap_add_step')
    lines.push('Use parentStepName + stepLocationRelativeToParent (and branchIndex when INSIDE_BRANCH).')
    lines.push('')

    const triggerStep = structure[0]
    if (triggerStep) {
        lines.push(`- After trigger: parentStepName="${triggerStep.name}", stepLocationRelativeToParent="${StepLocationRelativeToParent.AFTER}"`)
    }

    for (const step of structure) {
        if (step.relationship === 'trigger') continue
        lines.push(`- After "${step.name}": parentStepName="${step.name}", stepLocationRelativeToParent="${StepLocationRelativeToParent.AFTER}"`)
        if (step.type === FlowActionType.LOOP_ON_ITEMS) {
            lines.push(`  Inside loop of "${step.name}": parentStepName="${step.name}", stepLocationRelativeToParent="${StepLocationRelativeToParent.INSIDE_LOOP}"`)
        }
        if (step.type === FlowActionType.ROUTER) {
            const fullStep = flowStructureUtil.getStep(step.name, trigger)
            const branches = (fullStep as { settings?: { branches?: { branchName?: string }[] } } | undefined)?.settings?.branches ?? []
            branches.forEach((b, i) => {
                lines.push(`  Branch ${i} of "${step.name}"${b.branchName ? ` ("${b.branchName}")` : ''}: parentStepName="${step.name}", stepLocationRelativeToParent="${StepLocationRelativeToParent.INSIDE_BRANCH}", branchIndex=${i}`)
            })
        }
    }

    lines.push('')
    lines.push('Step types: trigger = EMPTY | PIECE_TRIGGER; action = CODE | PIECE | LOOP_ON_ITEMS | ROUTER')

    lines.push('')
    lines.push('## Canvas Notes')
    if (notes.length === 0) {
        lines.push('No canvas notes.')
    }
    else {
        for (const note of notes) {
            const content = note.content.replace(/<[^>]*>/g, '').slice(0, 80)
            lines.push(`- id: ${note.id} | "${content}" | color: ${note.color} | pos: (${Math.round(note.position.x)}, ${Math.round(note.position.y)}) | size: ${note.size.width}×${note.size.height}`)
        }
    }

    return lines.join('\n')
}

export const apFlowStructureTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_flow_structure',
        description: 'Get the structure of a flow: step tree (parent/child), each step type, configuration status (configured/unconfigured/invalid), and valid insert locations for ap_add_step.',
        inputSchema: {
            flowId: z.string().describe('The id of the flow'),
        },
        execute: async ({ flowId }) => {
            try {
                const flow = await flowService(log).getOnePopulated({
                    id: flowId as string,
                    projectId: mcp.projectId,
                })
                if (isNil(flow)) {
                    return { content: [{ type: 'text', text: '❌ Flow not found' }] }
                }
                const structure = buildFlowStructure(flow.version.trigger)
                const positions = computeStepPositions(flow.version.trigger)
                const text = formatFlowStructure(flow.version.displayName, flow.id, structure, flow.version.trigger, positions, flow.version.notes ?? [])
                return { content: [{ type: 'text', text }] }
            }
            catch (err) {
                const message = err instanceof Error ? err.message : String(err)
                return {
                    content: [{
                        type: 'text',
                        text: `❌ Failed to get flow structure: ${message}`,
                    }],
                }
            }
        },
    }
}
