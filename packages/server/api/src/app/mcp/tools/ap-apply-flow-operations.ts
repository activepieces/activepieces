import { isNil, Permission, PlatformId, tryCatch } from '@activepieces/core-utils'
import { toolResultView } from '@activepieces/server-utils'
import { agentToolClassification, FlowActionType, FlowOperationType, flowStructureUtil, FlowTrigger, FlowTriggerType, McpToolContext, McpToolDefinition, PopulatedFlow } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowService } from '../../flows/flow/flow.service'
import { flowVersionValidationUtil } from '../../flows/flow-version/flow-version-validator-util'
import { projectService } from '../../project/project-service'
import { apAddBranchTool } from './ap-add-branch'
import { apAddStepTool } from './ap-add-step'
import { apDeleteBranchTool } from './ap-delete-branch'
import { apDeleteStepTool } from './ap-delete-step'
import { apUpdateBranchTool } from './ap-update-branch'
import { apUpdateStepTool } from './ap-update-step'
import { apUpdateTriggerTool } from './ap-update-trigger'
import { buildFlowReview } from './build-flow-review'
import { flowValidation } from './flow-validation'
import { mcpUtils } from './mcp-utils'

export const apApplyFlowOperationsTool = ({ mcp, userId }: McpToolContext, log: FastifyBaseLogger): McpToolDefinition => {
    const toolsByType: Record<OperationType, McpToolDefinition> = {
        add_step: apAddStepTool({ mcp, userId }, log),
        update_step: apUpdateStepTool({ mcp, userId }, log),
        delete_step: apDeleteStepTool({ mcp, userId }, log),
        update_trigger: apUpdateTriggerTool({ mcp, userId }, log),
        add_branch: apAddBranchTool({ mcp, userId }, log),
        update_branch: apUpdateBranchTool({ mcp, userId }, log),
        delete_branch: apDeleteBranchTool({ mcp, userId }, log),
    }
    return {
        title: 'ap_apply_flow_operations',
        permission: Permission.WRITE_FLOW,
        description: 'Edit an existing flow with several operations in one call. They run in order and all-or-nothing: if one fails, the flow is restored and the failing operation is reported. Each operation is {type, ...the input of the tool ap_<type> without flowId}; add_step infers its stepType from pieceName/sourceCode/loopItems, and delete_branch can name the branch with branchName instead of routerStepName + branchIndex. Returns each operation\'s result and the problems left, by step. Example: {"flowId":"abc","operations":[{"type":"update_step","stepName":"step_1","input":{"subject":"Hi"}},{"type":"delete_step","stepName":"step_2"}]}',
        inputSchema: applyFlowOperationsInput.shape,
        annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
        execute: async (args) => {
            const parsed = applyFlowOperationsInput.safeParse(args)
            if (!parsed.success) {
                const message = parsed.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
                return { content: [{ type: 'text', text: `❌ Invalid input: ${message}` }], isError: true }
            }
            const { flowId, operations } = parsed.data
            const [flow, project] = await Promise.all([
                flowService(log).getOnePopulated({ id: flowId, projectId: mcp.projectId }),
                projectService(log).getOneOrThrow(mcp.projectId),
            ])
            if (isNil(flow)) {
                return { content: [{ type: 'text', text: '❌ Flow not found' }], isError: true }
            }

            const loadTrigger = async (): Promise<FlowTrigger> => (await flowService(log).getOnePopulatedOrThrow({ id: flowId, projectId: mcp.projectId })).version.trigger
            const { applied, failure } = await applyInOrder({ flowId, operations, toolsByType, disabledTools: mcp.disabledTools ?? [], loadTrigger })

            if (!isNil(failure)) {
                const failedLine = `❌ Operation ${failure.index + 1} (${failure.type}) failed: ${failure.reason}`
                const { error: rollbackError } = applied.length === 0
                    ? { error: null }
                    : await tryCatch(() => restoreDraft({ flow, projectId: mcp.projectId, platformId: project.platformId, userId, log }))
                const outcome = isNil(rollbackError)
                    ? `Nothing was changed: the flow is as it was before this call (${applied.length} earlier operation(s) undone). Fix operation ${failure.index + 1} and resend all operations.`
                    : `⚠️ Rollback failed (${rollbackError.message}). Operations 1-${applied.length} are still applied; check with ap_flow_structure.`
                return {
                    content: [{ type: 'text', text: `${failedLine}\n${outcome}` }],
                    structuredContent: { failedOperation: failure, rolledBack: isNil(rollbackError) },
                    isError: true,
                }
            }

            const updatedFlow = await flowService(log).getOnePopulatedOrThrow({ id: flowId, projectId: mcp.projectId })
            const problems = await remainingProblems({ trigger: updatedFlow.version.trigger, platformId: project.platformId, log })
            const problemLines = Object.entries(problems).map(([stepName, reasons]) => `- ${stepName}: ${reasons.join('; ')}`)
            const lines = [
                `✅ Applied ${applied.length} operation(s):`,
                ...applied.map(a => `${a.index + 1}. ${a.type}: ${a.result}`),
                problemLines.length === 0 ? 'No remaining problems; no need to call ap_validate_flow.' : 'Remaining problems (fix them all in one more ap_apply_flow_operations call):',
                ...problemLines,
            ]
            return {
                content: [{ type: 'text', text: `${lines.join('\n')}${mcpUtils.publishedFlowWarning(flow.publishedVersionId)}` }],
                structuredContent: { applied, problems, flowId, displayName: updatedFlow.version.displayName, flowSteps: buildFlowReview.flowStepStates({ trigger: updatedFlow.version.trigger, problemStepNames: new Set(Object.keys(problems)) }) },
            }
        },
    }
}

async function applyInOrder({ flowId, operations, toolsByType, disabledTools, loadTrigger }: {
    flowId: string
    operations: Operation[]
    toolsByType: Record<OperationType, McpToolDefinition>
    disabledTools: string[]
    loadTrigger: () => Promise<FlowTrigger>
}): Promise<{ applied: AppliedOperation[], failure: FailedOperation | null }> {
    const applied: AppliedOperation[] = []
    for (const [index, { type, ...fields }] of operations.entries()) {
        const toolName = `ap_${type}`
        if (disabledTools.includes(toolName)) {
            return { applied, failure: { index, type, reason: `${toolName} is disabled on this MCP server.` } }
        }
        const targeted = type === 'delete_branch' || type === 'update_branch' ? await withBranchTarget({ type, fields, loadTrigger }) : fields
        const { data, error } = await tryCatch(() => toolsByType[type].execute({ ...targeted, flowId }))
        const result = isNil(error) && !isNil(data) ? data : mcpUtils.mcpToolError('Invalid operation', error)
        const text = toolResultView.textOf(result) ?? ''
        if (result.isError === true || agentToolClassification.hasFailureTextPrefix(text)) {
            return { applied, failure: { index, type, reason: text.replace(/^❌\s*/, '') } }
        }
        applied.push({ index, type, result: text.split('\n')[0] })
    }
    return { applied, failure: null }
}

async function restoreDraft({ flow, projectId, platformId, userId, log }: {
    flow: PopulatedFlow
    projectId: string
    platformId: PlatformId
    userId: string | undefined
    log: FastifyBaseLogger
}): Promise<void> {
    const { version } = flow
    await flowService(log).update({
        id: flow.id,
        projectId,
        platformId,
        userId: userId ?? null,
        operation: {
            type: FlowOperationType.IMPORT_FLOW,
            request: {
                displayName: version.displayName,
                trigger: version.trigger,
                schemaVersion: version.schemaVersion ?? null,
                notes: version.notes ?? null,
            },
        },
    })
    if (version.trigger.type === FlowTriggerType.PIECE && !isNil(version.trigger.settings.sampleData)) {
        await flowService(log).update({
            id: flow.id,
            projectId,
            platformId,
            userId: userId ?? null,
            operation: {
                type: FlowOperationType.UPDATE_SAMPLE_DATA_INFO,
                request: { stepName: version.trigger.name, sampleDataSettings: version.trigger.settings.sampleData },
            },
        })
    }
}

async function remainingProblems({ trigger, platformId, log }: {
    trigger: FlowTrigger
    platformId: PlatformId
    log: FastifyBaseLogger
}): Promise<Record<string, string[]>> {
    const { issues } = flowValidation.validateFlow({ trigger })
    const skipped = flowStructureUtil.getSkippedStepNames({ trigger })
    const invalidSteps = flowStructureUtil.getAllSteps(trigger).filter(step => !step.valid && !skipped.has(step.name))
    const fieldProblems = await Promise.all(invalidSteps.map(async (step) => {
        const { data } = await tryCatch(() => flowVersionValidationUtil(log).invalidPieceInputs({ platformId, step }))
        return { stepName: step.name, reasons: data ?? [] }
    }))
    const stepsWithFieldProblems = new Set(fieldProblems.filter(p => p.reasons.length > 0).map(p => p.stepName))
    const issueProblems = issues
        .filter(issue => issue.severity !== 'info')
        .filter(issue => !(issue.category === 'step_validity' && stepsWithFieldProblems.has(issue.stepName)))
        .map(issue => ({ stepName: issue.stepName, reasons: [issue.message] }))
    return [...fieldProblems, ...issueProblems]
        .filter(p => p.reasons.length > 0)
        .reduce<Record<string, string[]>>((acc, p) => ({ ...acc, [p.stepName]: [...(acc[p.stepName] ?? []), ...p.reasons] }), {})
}

async function withBranchTarget({ type, fields, loadTrigger }: {
    type: 'delete_branch' | 'update_branch'
    fields: Record<string, unknown>
    loadTrigger: () => Promise<FlowTrigger>
}): Promise<Record<string, unknown>> {
    const branchName = type === 'delete_branch' && isNil(fields['branchIndex']) && typeof fields['branchName'] === 'string' ? fields['branchName'].trim().toLowerCase() : undefined
    if (typeof fields['routerStepName'] === 'string' && isNil(branchName)) {
        return fields
    }
    const routerRef = [fields['routerStepName'], fields['stepName'], fields['parentStepName'], fields['routerName']].find((value): value is string => typeof value === 'string')
    const routers = flowStructureUtil.getAllSteps(await loadTrigger()).flatMap((step) => step.type === FlowActionType.ROUTER ? [step] : [])
    const withBranch = isNil(branchName) ? [] : routers.filter((router) => router.settings.branches.some((branch) => branch.branchName.trim().toLowerCase() === branchName))
    const router = routers.find((candidate) => candidate.name === routerRef || candidate.displayName === routerRef)
        ?? (withBranch.length === 1 ? withBranch[0] : undefined)
        ?? (routers.length === 1 ? routers[0] : undefined)
    if (isNil(router)) {
        return fields
    }
    const branchIndex = isNil(branchName) ? -1 : router.settings.branches.findIndex((branch) => branch.branchName.trim().toLowerCase() === branchName)
    return { ...fields, routerStepName: router.name, ...(branchIndex === -1 ? {} : { branchIndex }) }
}

const OPERATION_TYPES = ['add_step', 'update_step', 'delete_step', 'update_trigger', 'add_branch', 'update_branch', 'delete_branch'] as const

const applyFlowOperationsInput = z.object({
    flowId: z.string().describe('The id of the flow'),
    operations: z.array(z.looseObject({
        type: z.enum(OPERATION_TYPES).describe('Which edit tool this operation runs: ap_<type>'),
    })).min(1).describe('Edits applied in order; each sees the result of the ones before it. Each holds the fields of ap_<type> except flowId.'),
})

type OperationType = typeof OPERATION_TYPES[number]
type Operation = z.infer<typeof applyFlowOperationsInput>['operations'][number]
type AppliedOperation = { index: number, type: OperationType, result: string }
type FailedOperation = { index: number, type: OperationType, reason: string }
