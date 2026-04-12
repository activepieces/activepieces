import {
    FlowActionType,
    flowStructureUtil,
    FlowTriggerType,
    isNil,
    McpServer,
    McpToolDefinition,
    Permission,
    Step,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowService } from '../../flows/flow/flow.service'
import { mcpUtils } from './mcp-utils'

export const apValidateFlowTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_validate_flow',
        permission: Permission.READ_FLOW,
        description: 'Validate a flow for structural issues without publishing. Checks step validity, template references, and empty branches. Returns a detailed report with all issues found. Use this before ap_lock_and_publish to catch problems early.',
        inputSchema: validateFlowInput.shape,
        annotations: { readOnlyHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const { flowId } = validateFlowInput.parse(args)

                const flow = await flowService(log).getOnePopulated({ id: flowId, projectId: mcp.projectId })
                if (isNil(flow)) {
                    return { content: [{ type: 'text', text: '❌ Flow not found.' }] }
                }

                const result = validateFlow({ trigger: flow.version.trigger })
                return { content: [{ type: 'text', text: formatValidationResult({ result, flowDisplayName: flow.version.displayName }) }] }
            }
            catch (err) {
                return mcpUtils.mcpToolError('Flow validation failed', err)
            }
        },
    }
}

const validateFlowInput = z.object({
    flowId: z.string().describe('The id of the flow to validate. Use ap_list_flows to find it.'),
})

function validateFlow({ trigger }: { trigger: Step }): ValidationResult {
    const allSteps = flowStructureUtil.getAllSteps(trigger)
    const allStepNames = new Set(allSteps.map(s => s.name))
    const issues: ValidationIssue[] = []

    if (trigger.type === FlowTriggerType.EMPTY) {
        issues.push({ category: 'step_validity', stepName: 'trigger', message: 'Trigger is not configured (use ap_update_trigger).' })
    }

    const seenSteps = new Set<string>()
    let validCount = 0
    let invalidCount = 0
    let skippedCount = 0

    for (const step of allSteps) {
        const isSkipped = 'skip' in step && step.skip === true

        if (isSkipped) {
            skippedCount++
        }
        else if (step.valid) {
            validCount++
        }
        else {
            invalidCount++
            if (!flowStructureUtil.isTrigger(step.type)) {
                issues.push({ category: 'step_validity', stepName: step.name, message: `"${step.displayName}" is invalid (use ap_update_step to fix).` })
            }
        }

        const strings = collectStringValues({ step })
        for (const str of strings) {
            const refs = extractReferencedStepNames({ value: str })
            for (const ref of refs) {
                if (!allStepNames.has(ref)) {
                    issues.push({ category: 'template_reference', stepName: step.name, message: `"${step.displayName}" references "{{${ref}...}}" which does not exist in the flow.` })
                }
                else if (!seenSteps.has(ref)) {
                    issues.push({ category: 'template_reference', stepName: step.name, message: `"${step.displayName}" references "{{${ref}...}}" which comes AFTER it in execution order.` })
                }
            }
        }

        if (step.type === FlowActionType.ROUTER) {
            const children = 'children' in step ? (step.children as (unknown | null)[]) : []
            const branches = 'settings' in step && typeof step.settings === 'object' && step.settings !== null && 'branches' in step.settings
                ? (step.settings.branches as { branchName?: string }[])
                : []
            for (let i = 0; i < children.length; i++) {
                if (isNil(children[i])) {
                    const branchName = branches[i]?.branchName ?? `Branch ${i}`
                    issues.push({ category: 'empty_branch', stepName: step.name, message: `"${step.displayName}" has empty branch: "${branchName}".` })
                }
            }
        }

        seenSteps.add(step.name)
    }

    return { totalSteps: allSteps.length, validSteps: validCount, invalidSteps: invalidCount, skippedSteps: skippedCount, issues }
}

function collectStringValues({ step }: { step: Step }): string[] {
    const result: string[] = []

    if ('settings' in step && typeof step.settings === 'object' && step.settings !== null) {
        const settings = step.settings as Record<string, unknown>

        if ('input' in settings && typeof settings.input === 'object' && settings.input !== null) {
            walkValues(settings.input, (val) => {
                if (typeof val === 'string') result.push(val)
            })
        }

        if ('items' in settings && typeof settings.items === 'string') {
            result.push(settings.items)
        }

        if ('branches' in settings && Array.isArray(settings.branches)) {
            for (const branch of settings.branches) {
                if (typeof branch === 'object' && branch !== null && 'conditions' in branch && Array.isArray(branch.conditions)) {
                    for (const group of branch.conditions) {
                        if (!Array.isArray(group)) continue
                        for (const cond of group) {
                            if (typeof cond === 'object' && cond !== null) {
                                if ('firstValue' in cond && typeof cond.firstValue === 'string') result.push(cond.firstValue)
                                if ('secondValue' in cond && typeof cond.secondValue === 'string') result.push(cond.secondValue)
                            }
                        }
                    }
                }
            }
        }
    }

    return result
}

function walkValues(obj: unknown, fn: (val: unknown) => void): void {
    if (obj === null || obj === undefined) return
    fn(obj)
    if (Array.isArray(obj)) {
        for (const item of obj) walkValues(item, fn)
    }
    else if (typeof obj === 'object') {
        for (const val of Object.values(obj)) walkValues(val, fn)
    }
}

function extractReferencedStepNames({ value }: { value: string }): string[] {
    const regex = /\{\{(\w+)/g
    const names = new Set<string>()
    let match
    while ((match = regex.exec(value)) !== null) {
        const name = match[1]
        if (name !== 'connections') {
            names.add(name)
        }
    }
    return [...names]
}

const CATEGORY_ORDER: ValidationIssue['category'][] = ['step_validity', 'template_reference', 'empty_branch']
const CATEGORY_LABELS: Record<ValidationIssue['category'], string> = {
    step_validity: 'Step Validity',
    template_reference: 'Template References',
    empty_branch: 'Empty Branches',
}

function formatValidationResult({ result, flowDisplayName }: { result: ValidationResult, flowDisplayName: string }): string {
    if (result.issues.length === 0) {
        return `✅ Flow "${flowDisplayName}" is ready to publish (${result.totalSteps} steps, all valid).`
    }

    const grouped = new Map<ValidationIssue['category'], ValidationIssue[]>()
    for (const issue of result.issues) {
        const list = grouped.get(issue.category) ?? []
        list.push(issue)
        grouped.set(issue.category, list)
    }

    const lines: string[] = []
    lines.push(`⚠️ Flow "${flowDisplayName}" has ${result.issues.length} issue(s):`)
    lines.push('')

    for (const category of CATEGORY_ORDER) {
        const issues = grouped.get(category)
        if (issues && issues.length > 0) {
            lines.push(`${CATEGORY_LABELS[category]}:`)
            for (const issue of issues) lines.push(`- ${issue.stepName}: ${issue.message}`)
            lines.push('')
        }
    }

    lines.push(`Summary: ${result.totalSteps} total, ${result.validSteps} valid, ${result.invalidSteps} invalid, ${result.skippedSteps} skipped`)

    return lines.join('\n')
}

type ValidationIssue = {
    category: 'step_validity' | 'template_reference' | 'empty_branch'
    stepName: string
    message: string
}

type ValidationResult = {
    totalSteps: number
    validSteps: number
    invalidSteps: number
    skippedSteps: number
    issues: ValidationIssue[]
}
