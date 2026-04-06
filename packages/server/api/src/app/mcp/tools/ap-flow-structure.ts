import {
    BranchExecutionType,
    FlowActionType,
    flowCanvasUtils,
    flowStructureUtil,
    FlowTriggerType,
    isNil,
    McpServer,
    McpToolDefinition,
    Note,
    StepLocationRelativeToParent,
} from '@activepieces/shared'
import type { Step } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowService } from '../../flows/flow/flow.service'
import { mcpToolError } from './mcp-utils'

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
        annotations: { readOnlyHint: true, openWorldHint: false },
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
                const positions = flowCanvasUtils.computeStepPositions(flow.version.trigger)
                const text = formatFlowStructure(flow.version.displayName, flow.id, structure, flow.version.trigger, positions, flow.version.notes ?? [])
                return { content: [{ type: 'text', text }] }
            }
            catch (err) {
                return mcpToolError('Failed to get flow structure', err)
            }
        },
    }
}
