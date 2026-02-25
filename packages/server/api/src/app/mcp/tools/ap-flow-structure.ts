import {
    FlowActionType,
    flowStructureUtil,
    isNil,
    McpServer,
    McpToolDefinition,
    StepLocationRelativeToParent,
} from '@activepieces/shared'
import type { Step } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowService } from '../../flows/flow/flow.service'

type StepInfo = {
    name: string
    type: string
    displayName: string
    parentName: string | null
    relationship: 'trigger' | 'next' | 'first_loop_action' | 'branch'
    branchIndex?: number
    branchName?: string
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
        }
    })
}

function formatFlowStructure(flowDisplayName: string, flowId: string, structure: StepInfo[], trigger: Step): string {
    const lines: string[] = []
    lines.push(`# Flow: ${flowDisplayName} (id: ${flowId})`)
    lines.push('')
    lines.push('## Steps (DFS order: trigger first, then each step with parent and relationship)')
    lines.push('Format: name | type | displayName | parent | relationship')
    lines.push('')

    for (const step of structure) {
        if (step.relationship === 'trigger') {
            lines.push(`- [TRIGGER] ${step.name} | ${step.type} | "${step.displayName}" | parent: —`)
            continue
        }
        const rel =
            step.relationship === 'next'
                ? 'after parent'
                : step.relationship === 'first_loop_action'
                    ? 'inside_loop'
                    : `branch ${step.branchIndex}${step.branchName ? ` "${step.branchName}"` : ''}`
        lines.push(`- ${step.name} | ${step.type} | "${step.displayName}" | parent: ${step.parentName} | ${rel}`)
    }

    lines.push('')
    lines.push('## Valid insert locations for ap_add_code_step')
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
    return lines.join('\n')
}

export const apFlowStructureTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_flow_structure',
        description: 'Get the structure of a flow: step tree (parent/child), each step type, and valid insert locations for ap_add_code_step (parentStepName, stepLocationRelativeToParent, branchIndex).',
        inputSchema: {
            flowId: z.string().describe('The id of the flow'),
        },
        execute: async ({ flowId }) => {
            const flow = await flowService(log).getOnePopulated({
                id: flowId as string,
                projectId: mcp.projectId,
            })
            if (isNil(flow)) {
                return { content: [{ type: 'text', text: '❌ Flow not found' }] }
            }
            const structure = buildFlowStructure(flow.version.trigger)
            const text = formatFlowStructure(flow.version.displayName, flow.id, structure, flow.version.trigger)
            return { content: [{ type: 'text', text }] }
        },
    }
}