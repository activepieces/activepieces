import {
    BranchExecutionType,
    FlowActionType,
    FlowOperationType,
    flowStructureUtil,
    FlowTriggerType,
    McpToolDefinition,
    Permission,
    PieceTrigger,
    ProjectScopedMcpServer,
    RouterExecutionType,
    StepLocationRelativeToParent,
    UpdateActionRequest,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowService } from '../../flows/flow/flow.service'
import { projectService } from '../../project/project-service'
import { mcpUtils } from './mcp-utils'

const stepSpec = z.object({
    type: z.enum([FlowActionType.CODE, FlowActionType.PIECE, FlowActionType.LOOP_ON_ITEMS, FlowActionType.ROUTER]),
    displayName: z.string(),
    pieceName: z.string().optional(),
    actionName: z.string().optional(),
    input: z.record(z.string(), z.unknown()).optional(),
    auth: z.string().optional(),
    sourceCode: z.string().optional(),
    packageJson: z.string().optional(),
    loopItems: z.string().optional(),
    continueOnFailure: z.boolean().optional(),
    retryOnFailure: z.boolean().optional(),
})

const buildFlowInput = z.object({
    flowName: z.string(),
    trigger: z.object({
        pieceName: z.string(),
        triggerName: z.string(),
        input: z.record(z.string(), z.unknown()).optional(),
        auth: z.string().optional(),
    }),
    steps: z.array(stepSpec),
})

export const apBuildFlowTool = (mcp: ProjectScopedMcpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_build_flow',
        permission: Permission.WRITE_FLOW,
        description: 'Create a complete flow in one call: trigger + steps. Steps are added sequentially (trigger → step_1 → step_2 → ...). Use granular tools (ap_add_step, ap_update_step) to modify flows or add nested structures (loop contents, router branches).',
        inputSchema: {
            flowName: z.string().describe('Name for the new flow'),
            trigger: z.object({
                pieceName: z.string().describe('Trigger piece name (e.g. "@activepieces/piece-webhook")'),
                triggerName: z.string().describe('Trigger name (e.g. "catch_webhook")'),
                input: z.record(z.string(), z.unknown()).optional().describe('Trigger input config'),
                auth: z.string().optional().describe('Connection externalId for trigger auth'),
            }).describe('Trigger configuration'),
            steps: z.array(stepSpec).describe('Array of steps added sequentially after trigger. Each step supports: PIECE (pieceName+actionName+input), CODE (sourceCode+input), LOOP_ON_ITEMS (loopItems), ROUTER.'),
        },
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
        execute: async (args) => {
            let flowId: string | undefined
            const projectId = mcp.projectId
            try {
                const { flowName, trigger, steps } = buildFlowInput.parse(args)
                const triggerAuthError = mcpUtils.validateAuth(trigger.auth)
                if (triggerAuthError) {
                    return triggerAuthError
                }
                for (const step of steps) {
                    const stepAuthError = mcpUtils.validateAuth(step.auth)
                    if (stepAuthError) {
                        return stepAuthError
                    }
                }

                const [project, flow] = await Promise.all([
                    projectService(log).getOneOrThrow(projectId),
                    flowService(log).create({ projectId, request: { displayName: flowName, projectId } }),
                ])
                const platformId = project.platformId
                flowId = flow.id

                const triggerVersionResult = await mcpUtils.resolveLatestPieceVersion({ pieceName: trigger.pieceName, projectId, platformId, log })
                if (triggerVersionResult.error) {
                    await flowService(log).delete({ id: flowId, projectId }).catch((deleteErr) => {
                        log.warn({ err: deleteErr, flowId }, 'Failed to clean up orphaned flow after trigger version resolution error')
                    })
                    return triggerVersionResult.error
                }

                const triggerInput = {
                    ...(trigger.input ?? {}),
                    ...(trigger.auth ? { auth: `{{connections['${trigger.auth}']}}` } : {}),
                }
                const triggerPayload = PieceTrigger.parse({
                    name: 'trigger',
                    displayName: trigger.triggerName,
                    valid: false,
                    lastUpdatedDate: new Date().toISOString(),
                    type: FlowTriggerType.PIECE,
                    settings: {
                        pieceName: triggerVersionResult.normalizedPieceName,
                        pieceVersion: triggerVersionResult.pieceVersion,
                        triggerName: trigger.triggerName,
                        input: triggerInput,
                        propertySettings: {},
                    },
                })
                let currentFlow = await flowService(log).update({
                    id: flowId, projectId, userId: null, platformId,
                    operation: { type: FlowOperationType.UPDATE_TRIGGER, request: triggerPayload },
                })
                const skippedSteps: string[] = []

                for (const step of steps) {
                    const latestTrigger = currentFlow!.version.trigger
                    const stepName = flowStructureUtil.findUnusedName(latestTrigger)
                    const allSteps = flowStructureUtil.getAllSteps(latestTrigger)
                    const lastStep = allSteps[allSteps.length - 1]

                    let resolvedPieceVersion: string | undefined
                    let resolvedPieceName: string | undefined
                    if (step.type === FlowActionType.PIECE) {
                        if (!step.pieceName) {
                            skippedSteps.push(step.displayName)
                            continue
                        }
                        const versionResult = await mcpUtils.resolveLatestPieceVersion({ pieceName: step.pieceName, projectId, platformId, log })
                        if (versionResult.error) {
                            skippedSteps.push(step.displayName)
                            continue
                        }
                        resolvedPieceVersion = versionResult.pieceVersion
                        resolvedPieceName = versionResult.normalizedPieceName
                    }

                    const skeleton = buildSkeleton({ step, name: stepName, resolvedPieceVersion, resolvedPieceName })
                    const parseResult = UpdateActionRequest.safeParse(skeleton)
                    if (!parseResult.success) {
                        skippedSteps.push(step.displayName)
                        continue
                    }

                    currentFlow = await flowService(log).update({
                        id: flowId, projectId, userId: null, platformId,
                        operation: {
                            type: FlowOperationType.ADD_ACTION,
                            request: {
                                parentStep: lastStep.name,
                                stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
                                action: parseResult.data,
                            },
                        },
                    })
                }

                const allSteps = flowStructureUtil.getAllSteps(currentFlow.version.trigger)
                const validCount = allSteps.filter(s => s.valid).length
                const invalidSteps = allSteps.filter(s => !s.valid).map(s => s.name)
                const stepWord = allSteps.length === 1 ? 'step' : 'steps'

                const skippedHint = skippedSteps.length > 0 ? ` Skipped: ${skippedSteps.join(', ')}.` : ''
                const structured = {
                    flowId: flowId!,
                    displayName: flowName,
                    stepCount: allSteps.length,
                    validCount,
                    invalidSteps,
                    skippedSteps,
                }
                if (invalidSteps.length === 0 && skippedSteps.length === 0) {
                    return { content: [{ type: 'text', text: `✅ Flow "${flowName}" created (id: ${flowId}) with ${allSteps.length} ${stepWord}, all valid.` }], structuredContent: structured }
                }
                return { content: [{ type: 'text', text: `⚠️ Flow "${flowName}" created (id: ${flowId}) with ${allSteps.length} ${stepWord} (${validCount} valid, ${invalidSteps.length} invalid: ${invalidSteps.join(', ')}).${skippedHint} Use ap_update_step or ap_update_trigger to fix.` }], structuredContent: structured }
            }
            catch (err) {
                if (flowId) {
                    await flowService(log).delete({ id: flowId, projectId }).catch(() => undefined)
                }
                return mcpUtils.mcpToolError('Failed to build flow', err)
            }
        },
    }
}

function buildSkeleton({ step, name, resolvedPieceVersion, resolvedPieceName }: {
    step: z.infer<typeof stepSpec>
    name: string
    resolvedPieceVersion?: string
    resolvedPieceName?: string
}): Record<string, unknown> {
    const resolvedInput = {
        ...(step.input ?? {}),
        ...(step.auth ? { auth: `{{connections['${step.auth}']}}` } : {}),
    }

    switch (step.type) {
        case FlowActionType.CODE:
            return {
                type: FlowActionType.CODE,
                name,
                displayName: step.displayName,
                valid: false,
                settings: {
                    sourceCode: {
                        code: step.sourceCode ?? 'export const code = async (inputs) => { return {} }',
                        packageJson: step.packageJson ?? '{}',
                    },
                    input: step.input ?? {},
                    errorHandlingOptions: mcpUtils.buildErrorHandlingOptions({ continueOnFailure: step.continueOnFailure, retryOnFailure: step.retryOnFailure }),
                },
            }
        case FlowActionType.PIECE:
            return {
                type: FlowActionType.PIECE,
                name,
                displayName: step.displayName,
                valid: false,
                settings: {
                    pieceName: resolvedPieceName ?? step.pieceName ?? '',
                    pieceVersion: resolvedPieceVersion ?? '',
                    actionName: step.actionName ?? '',
                    input: resolvedInput,
                    propertySettings: {},
                    errorHandlingOptions: mcpUtils.buildErrorHandlingOptions({ continueOnFailure: step.continueOnFailure, retryOnFailure: step.retryOnFailure }),
                },
            }
        case FlowActionType.LOOP_ON_ITEMS:
            return {
                type: FlowActionType.LOOP_ON_ITEMS,
                name,
                displayName: step.displayName,
                valid: false,
                settings: { items: step.loopItems ?? '' },
            }
        case FlowActionType.ROUTER:
            return {
                type: FlowActionType.ROUTER,
                name,
                displayName: step.displayName,
                valid: false,
                settings: {
                    branches: [
                        { branchName: 'Branch 1', branchType: BranchExecutionType.CONDITION, conditions: [[]] },
                        { branchName: 'Otherwise', branchType: BranchExecutionType.FALLBACK },
                    ],
                    executionType: RouterExecutionType.EXECUTE_FIRST_MATCH,
                },
            }
        default:
            return { type: step.type, name, displayName: step.displayName, valid: false, settings: {} }
    }
}
