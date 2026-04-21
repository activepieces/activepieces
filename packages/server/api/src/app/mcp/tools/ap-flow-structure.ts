import {
    BranchCondition,
    BranchExecutionType,
    FlowActionType,
    flowCanvasUtils,
    flowStructureUtil,
    FlowTriggerType,
    isNil,
    McpServer,
    McpToolDefinition,
    Note,
    Permission,
    StepLocationRelativeToParent,
} from '@activepieces/shared'
import type { Step } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowService } from '../../flows/flow/flow.service'
import { mcpUtils } from './mcp-utils'

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
            return 'unconfigured (no trigger set — use ap_update_trigger)'
        case FlowTriggerType.PIECE:
            return s.triggerName ? 'invalid (use ap_update_trigger to fix — check required inputs)' : 'unconfigured (triggerName missing)'
        case FlowActionType.PIECE:
            return s.actionName ? 'invalid (use ap_update_step to fix — check required inputs)' : 'unconfigured (actionName missing)'
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

function hasSampleData(step: Step): boolean {
    if (!('sampleData' in step.settings)) {
        return false
    }
    const sampleData = step.settings.sampleData
    return typeof sampleData === 'object' && sampleData !== null && 'sampleDataFileId' in sampleData && sampleData.sampleDataFileId != null
}

function formatStepSettings(step: Step): string[] {
    const lines: string[] = []
    const settings = step.settings as Record<string, unknown>

    if (step.type === FlowTriggerType.PIECE || step.type === FlowActionType.PIECE) {
        const input = settings.input as Record<string, unknown> | undefined
        if (input && Object.keys(input).length > 0) {
            lines.push(`  input: ${mcpUtils.truncate(JSON.stringify(input), 500)}`)
        }
    }
    else if (step.type === FlowActionType.CODE) {
        const sourceCode = settings.sourceCode as { code?: string, packageJson?: string } | undefined
        if (sourceCode?.code) {
            lines.push(`  sourceCode: ${mcpUtils.truncate(sourceCode.code, 300)}`)
        }
        if (sourceCode?.packageJson && sourceCode.packageJson !== '{}') {
            lines.push(`  packageJson: ${mcpUtils.truncate(sourceCode.packageJson, 200)}`)
        }
        const input = settings.input as Record<string, unknown> | undefined
        if (input && Object.keys(input).length > 0) {
            lines.push(`  input: ${mcpUtils.truncate(JSON.stringify(input), 300)}`)
        }
    }
    else if (step.type === FlowActionType.LOOP_ON_ITEMS) {
        const items = settings.items as string | undefined
        if (items) {
            lines.push(`  loopItems: ${items}`)
        }
    }
    return lines
}

function formatBranchConditions(conditions: BranchCondition[][]): string {
    const groups = conditions.map((andGroup) => {
        const parts = andGroup.map((c) => {
            const op = c.operator ?? '?'
            const caseSensitive = 'caseSensitive' in c && c.caseSensitive ? ' [case-sensitive]' : ''
            return 'secondValue' in c
                ? `${c.firstValue} ${op} ${c.secondValue}${caseSensitive}`
                : `${c.firstValue} ${op}${caseSensitive}`
        })
        return parts.join(' AND ')
    })
    return groups.join(' OR ')
}

function buildFlowStructure(trigger: Step): { structure: StepInfo[], stepByName: Map<string, Step> } {
    const allSteps = flowStructureUtil.getAllSteps(trigger)
    const stepByName = new Map(allSteps.map(s => [s.name, s]))
    const structure = allSteps.map((step): StepInfo => {
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
    return { structure, stepByName }
}

function formatFlowStructure(
    flowDisplayName: string,
    flowId: string,
    structure: StepInfo[],
    stepByName: Map<string, Step>,
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
        const fullStep = stepByName.get(step.name)
        const sampleLabel = fullStep && hasSampleData(fullStep) ? ' | has sample data' : ''

        if (step.relationship === 'trigger') {
            let triggerDetail = ''
            if (fullStep && fullStep.type === FlowTriggerType.PIECE) {
                triggerDetail = ` (piece: ${fullStep.settings.pieceName}, trigger: ${fullStep.settings.triggerName ?? 'not set'})`
            }
            lines.push(`- [TRIGGER] ${step.name} | ${step.type} | "${step.displayName}"${triggerDetail} | parent: — | ${step.configStatus}${sampleLabel}${skipLabel}${canvasLabel}`)
            if (fullStep) {
                lines.push(...formatStepSettings(fullStep))
            }
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
            const s = fullStep?.settings as { pieceName?: string, actionName?: string } | undefined
            if (s?.pieceName) stepDetail = ` (piece: ${s.pieceName}, action: ${s.actionName ?? 'not set'})`
        }

        lines.push(`- ${step.name} | ${step.type} | "${step.displayName}"${stepDetail} | parent: ${step.parentName} | ${rel} | ${step.configStatus}${sampleLabel}${skipLabel}${canvasLabel}`)

        if (fullStep) {
            lines.push(...formatStepSettings(fullStep))
        }

        if (step.type === FlowActionType.ROUTER && fullStep) {
            const branches = (fullStep.settings as { branches?: { branchName?: string, branchType?: string, conditions?: BranchCondition[][] }[] })?.branches ?? []
            branches.forEach((b, i) => {
                const btype = b.branchType === BranchExecutionType.FALLBACK ? 'fallback' : 'condition'
                if (btype === 'condition' && b.conditions && b.conditions.length > 0) {
                    const condStr = formatBranchConditions(b.conditions)
                    lines.push(`  branch[${i}]: "${b.branchName ?? ''}" (${btype}) | conditions: ${condStr}`)
                }
                else {
                    lines.push(`  branch[${i}]: "${b.branchName ?? ''}" (${btype})`)
                }
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
            const routerStep = stepByName.get(step.name)
            const branches = (routerStep?.settings as { branches?: { branchName?: string }[] } | undefined)?.branches ?? []
            branches.forEach((b, i) => {
                lines.push(`  Branch ${i} of "${step.name}"${b.branchName ? ` ("${b.branchName}")` : ''}: parentStepName="${step.name}", stepLocationRelativeToParent="${StepLocationRelativeToParent.INSIDE_BRANCH}", branchIndex=${i}`)
            })
        }
    }

    lines.push('')
    lines.push('Step types: trigger = EMPTY | PIECE_TRIGGER; action = CODE | PIECE | LOOP_ON_ITEMS | ROUTER')
    lines.push('')
    lines.push('## Referencing step outputs')
    lines.push(mcpUtils.STEP_REFERENCE_HINT)
    lines.push('Use ap_test_step or ap_test_flow to generate sample data and see available output fields.')

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
        permission: Permission.READ_FLOW,
        description: 'Get the structure of a flow: step tree (parent/child), each step type, configuration status (configured/unconfigured/invalid), and valid insert locations for ap_add_step.',
        inputSchema: {
            flowId: z.string().describe('The id of the flow'),
        },
        annotations: { readOnlyHint: true, openWorldHint: false },
        execute: async ({ flowId }) => {
            try {
                const flow = await flowService(log).getOnePopulated({
                    id: String(flowId),
                    projectId: mcp.projectId,
                })
                if (isNil(flow)) {
                    return { content: [{ type: 'text', text: '❌ Flow not found' }] }
                }
                const { structure, stepByName } = buildFlowStructure(flow.version.trigger)
                const positions = flowCanvasUtils.computeStepPositions(flow.version.trigger)
                const text = formatFlowStructure(flow.version.displayName, flow.id, structure, stepByName, positions, flow.version.notes ?? [])
                return { content: [{ type: 'text', text }] }
            }
            catch (err) {
                return mcpUtils.mcpToolError('Failed to get flow structure', err)
            }
        },
    }
}
