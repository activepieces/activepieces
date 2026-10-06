import { isNil, Permission } from '@activepieces/core-utils'
import { FlowActionType, FlowCreatorType, FlowOperationType, flowStructureUtil, FlowTriggerType, McpToolContext, McpToolDefinition, PieceTrigger, StepLocationRelativeToParent, UpdateActionRequest } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowService } from '../../flows/flow/flow.service'
import { domainHelper } from '../../helper/domain-helper'
import { projectService } from '../../project/project-service'
import { mcpUtils } from './mcp-utils'

const stepSpec = z.object({
    type: z.enum([FlowActionType.CODE, FlowActionType.PIECE, FlowActionType.LOOP_ON_ITEMS]),
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
    parentStepName: z.string().optional().describe('Name of the parent step to nest this step inside (e.g. the loop step name). If omitted, step is added after the previous step.'),
    stepLocationRelativeToParent: z.enum([
        StepLocationRelativeToParent.AFTER,
        StepLocationRelativeToParent.INSIDE_LOOP,
        StepLocationRelativeToParent.INSIDE_BRANCH,
    ]).optional().default(StepLocationRelativeToParent.AFTER).describe('Where to place the step relative to parentStepName. Use INSIDE_LOOP for steps inside a loop.'),
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
    folderName: mcpUtils.FOLDER_NAME_SCHEMA,
})

export const apBuildFlowTool = ({ mcp, userId }: McpToolContext, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_build_flow',
        permission: Permission.WRITE_FLOW,
        description: 'Create a NEW flow from scratch in one call: trigger + steps. Steps are added sequentially by default (trigger → step_1 → step_2 → ...). To nest steps inside a loop, set parentStepName to the loop step name and stepLocationRelativeToParent to INSIDE_LOOP. ROUTER steps are NOT supported here (branches and conditions cannot be configured in one call) — build the rest of the flow first, then add the router with ap_add_step and configure branches with ap_add_branch / ap_update_branch. For EDITING an existing flow, do NOT rebuild it — use the granular ap_add_step / ap_update_step / ap_update_trigger instead. Prefer PIECE actions and inline formula expressions (in a free-text/value input — never a dropdown/option field — wrapped `ap-formula-v1::{…}::ap-formula-v1`) over CODE steps — only emit a CODE step when no piece fits AND the logic exceeds the inline formula functions (see the build_flow guide expression ladder).',
        inputSchema: {
            flowName: z.string().describe('Name for the new flow'),
            trigger: z.object({
                pieceName: z.string().describe('Trigger piece name (e.g. "@activepieces/piece-webhook")'),
                triggerName: z.string().describe('Trigger name (e.g. "catch_webhook")'),
                input: z.record(z.string(), z.unknown()).optional().describe('Trigger input config'),
                auth: z.string().optional().describe('Connection externalId for trigger auth'),
            }).describe('Trigger configuration'),
            folderName: mcpUtils.FOLDER_NAME_SCHEMA,
            steps: z.array(stepSpec).describe('Array of steps. By default added sequentially after trigger. Use parentStepName + stepLocationRelativeToParent to nest steps inside loops. Each step supports: PIECE (pieceName+actionName+input), CODE (sourceCode+input), LOOP_ON_ITEMS (loopItems). Prefer PIECE and inline formula expressions (in free-text/value inputs, not dropdowns) over CODE — reach for a CODE step only when no piece fits and the transform exceeds the inline formula functions. ROUTER is not supported here — add it afterwards with ap_add_step + ap_add_branch.'),
        },
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
        execute: async (args) => {
            let flowId: string | undefined
            const projectId = mcp.projectId
            try {
                const { flowName, trigger, steps, folderName } = buildFlowInput.parse(args)
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

                const [platformId, folder] = await Promise.all([
                    projectService(log).getPlatformId(projectId),
                    mcpUtils.resolveFolder({ projectId, folderName, log }),
                ])
                if (folder.error) {
                    return folder.error
                }
                const flow = await flowService(log).create({
                    projectId,
                    ownerId: userId,
                    createdBy: { type: FlowCreatorType.MCP, id: mcp.id },
                    request: { displayName: flowName, projectId, folderId: folder.folderId },
                })
                flowId = flow.id
                const createdIn = `${mcpUtils.folderSuffix(folder.folderName)}, externalId ${flow.externalId}`
                const solutionCheckHint = isNil(folder.folderName) ? '' : `\nOnce every flow and table in this folder is built, check how they fit together with ap_validate_flow({ folderName: ${JSON.stringify(folder.folderName)} }).`

                const triggerVersionResult = await mcpUtils.resolveLatestPieceVersion({ pieceName: trigger.pieceName, projectId, platformId, log })
                if (triggerVersionResult.error) {
                    await flowService(log).delete({ id: flowId, projectId, userId }).catch((deleteErr) => {
                        log.warn({ error: deleteErr, flow: { id: flowId } }, 'Failed to clean up orphaned flow after trigger version resolution error')
                    })
                    return triggerVersionResult.error
                }

                const triggerUnknown = await mcpUtils.dropUnknownInputProps({ pieceName: triggerVersionResult.normalizedPieceName, pieceVersion: triggerVersionResult.pieceVersion, componentName: trigger.triggerName, componentType: 'trigger', input: trigger.input, platformId, log })
                const triggerInput = {
                    ...triggerUnknown.input,
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
                        propertySettings: await mcpUtils.resolveDynamicPropertySettings({ pieceName: triggerVersionResult.normalizedPieceName, pieceVersion: triggerVersionResult.pieceVersion, componentName: trigger.triggerName, componentType: 'trigger', input: triggerInput, projectId, platformId, log }),
                    },
                })
                let currentFlow = await flowService(log).update({
                    id: flowId, projectId, userId: userId ?? null, platformId,
                    operation: { type: FlowOperationType.UPDATE_TRIGGER, request: triggerPayload },
                })
                const unknownPropFindings: string[] = []
                if (triggerUnknown.unknownKeys.length > 0) {
                    unknownPropFindings.push(`trigger: ${triggerUnknown.message}`)
                }

                const skippedSteps: string[] = []
                let lastTopLevelStepName: string | null = null

                for (const step of steps) {
                    const latestTrigger = currentFlow!.version.trigger
                    const stepName = flowStructureUtil.findUnusedName(latestTrigger)
                    const allSteps = flowStructureUtil.getAllSteps(latestTrigger)

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

                    const stepUnknown = await knownStepInput({ step, pieceName: resolvedPieceName, pieceVersion: resolvedPieceVersion, platformId, log })
                    const rewritten = mcpUtils.rewriteAllReferences({ input: stepUnknown.input, loopItems: step.loopItems, trigger: latestTrigger })
                    const rewrittenStep = { ...step, input: rewritten.input, loopItems: rewritten.loopItems }
                    const propertySettings = await stepPropertySettings({ actionName: step.actionName, pieceName: resolvedPieceName, pieceVersion: resolvedPieceVersion, input: { ...(rewritten.input ?? {}), ...(step.auth ? { auth: `{{connections['${step.auth}']}}` } : {}) }, projectId, platformId, log })
                    const skeleton = buildSkeleton({ step: rewrittenStep, name: stepName, resolvedPieceVersion, resolvedPieceName, propertySettings })
                    const parseResult = UpdateActionRequest.safeParse(skeleton)
                    if (!parseResult.success) {
                        skippedSteps.push(step.displayName)
                        continue
                    }

                    const location = step.stepLocationRelativeToParent ?? StepLocationRelativeToParent.AFTER
                    let parentStepName: string
                    if (step.parentStepName) {
                        const found = allSteps.find((s) => s.name === step.parentStepName)
                        parentStepName = found ? found.name : (lastTopLevelStepName ?? allSteps[allSteps.length - 1].name)
                    }
                    else {
                        parentStepName = lastTopLevelStepName ?? allSteps[allSteps.length - 1].name
                    }

                    currentFlow = await flowService(log).update({
                        id: flowId, projectId, userId: userId ?? null, platformId,
                        operation: {
                            type: FlowOperationType.ADD_ACTION,
                            request: {
                                parentStep: parentStepName,
                                stepLocationRelativeToParent: location,
                                action: parseResult.data,
                            },
                        },
                    })

                    if (stepUnknown.unknownKeys.length > 0) {
                        unknownPropFindings.push(`${stepName} (${step.displayName}): ${stepUnknown.message}`)
                    }

                    if (location === StepLocationRelativeToParent.AFTER) {
                        lastTopLevelStepName = stepName
                    }
                }

                const allSteps = flowStructureUtil.getAllSteps(currentFlow.version.trigger)
                const validCount = allSteps.filter(s => s.valid).length
                const invalidSteps = allSteps.filter(s => !s.valid).map(s => s.name)
                const stepWord = allSteps.length === 1 ? 'step' : 'steps'

                const skippedHint = skippedSteps.length > 0 ? ` Skipped: ${skippedSteps.join(', ')}.` : ''
                const flowUrl = await domainHelper.getPublicUrl({ path: `/projects/${projectId}/flows/${flowId}` })
                const structured = {
                    flowId: flowId!,
                    externalId: flow.externalId,
                    folderName: folder.folderName ?? null,
                    flowUrl,
                    displayName: flowName,
                    stepCount: allSteps.length,
                    validCount,
                    invalidSteps,
                    skippedSteps,
                    unknownProps: unknownPropFindings,
                }
                if (unknownPropFindings.length > 0) {
                    return { content: [{ type: 'text', text: `❌ Flow "${flowName}" created (id: ${flowId})${createdIn}, but some settings used property names that do NOT exist on the piece and were dropped — the flow does NOT behave as configured. Do NOT tell the user these settings were applied. Fix each with ap_update_step / ap_update_trigger using the correct property names:\n${unknownPropFindings.join('\n')}\nOpen: ${flowUrl}${solutionCheckHint}` }], structuredContent: structured }
                }
                if (invalidSteps.length === 0 && skippedSteps.length === 0) {
                    return { content: [{ type: 'text', text: `✅ Flow "${flowName}" created (id: ${flowId})${createdIn} with ${allSteps.length} ${stepWord}, all valid. Open: ${flowUrl}${solutionCheckHint}` }], structuredContent: structured }
                }
                return { content: [{ type: 'text', text: `⚠️ Flow "${flowName}" created (id: ${flowId})${createdIn} with ${allSteps.length} ${stepWord} (${validCount} valid, ${invalidSteps.length} invalid: ${invalidSteps.join(', ')}).${skippedHint} Use ap_update_step or ap_update_trigger to fix. Open: ${flowUrl}${solutionCheckHint}` }], structuredContent: structured }
            }
            catch (err) {
                if (flowId) {
                    await flowService(log).delete({ id: flowId, projectId, userId }).catch(() => undefined)
                }
                return mcpUtils.mcpToolError('Failed to build flow', err)
            }
        },
    }
}

async function stepPropertySettings({ actionName, pieceName, pieceVersion, input, projectId, platformId, log }: {
    actionName: string | undefined
    pieceName: string | undefined
    pieceVersion: string | undefined
    input: Record<string, unknown>
    projectId: string
    platformId: string
    log: FastifyBaseLogger
}): Promise<Record<string, unknown>> {
    const isPieceAction = !isNil(pieceName) && !isNil(pieceVersion) && !isNil(actionName)
    if (!isPieceAction) {
        return {}
    }
    return mcpUtils.resolveDynamicPropertySettings({ pieceName, pieceVersion, componentName: actionName, componentType: 'action', input, projectId, platformId, log })
}

async function knownStepInput({ step, pieceName, pieceVersion, platformId, log }: {
    step: z.infer<typeof stepSpec>
    pieceName: string | undefined
    pieceVersion: string | undefined
    platformId: string
    log: FastifyBaseLogger
}): Promise<{ input: Record<string, unknown> | undefined, unknownKeys: string[], message: string }> {
    const actionName = step.actionName
    const isPieceAction = step.type === FlowActionType.PIECE && !isNil(pieceName) && !isNil(pieceVersion) && !isNil(actionName)
    if (!isPieceAction) {
        return { input: step.input, unknownKeys: [], message: '' }
    }
    return mcpUtils.dropUnknownInputProps({ pieceName, pieceVersion, componentName: actionName, componentType: 'action', input: step.input, platformId, log })
}

function buildSkeleton({ step, name, resolvedPieceVersion, resolvedPieceName, propertySettings }: {
    step: z.infer<typeof stepSpec>
    name: string
    resolvedPieceVersion?: string
    resolvedPieceName?: string
    propertySettings: Record<string, unknown>
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
                    useDeno: true,
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
                    propertySettings,
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
        default:
            return { type: step.type, name, displayName: step.displayName, valid: false, settings: {} }
    }
}
