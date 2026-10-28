import { isNil, isObject, Permission, tryCatch } from '@activepieces/core-utils'
import { BranchExecutionType, FlowActionType, FlowCreatorType, FlowOperationType, flowStructureUtil, FlowTriggerType, McpToolContext, McpToolDefinition, PieceAudienceFilter, PieceTrigger, RouterExecutionType, Step, StepLocationRelativeToParent, SuggestionType, UpdateActionRequest } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowService } from '../../flows/flow/flow.service'
import { flowVersionValidationUtil } from '../../flows/flow-version/flow-version-validator-util'
import { domainHelper } from '../../helper/domain-helper'
import { pieceMetadataService } from '../../pieces/metadata/piece-metadata-service'
import { projectService } from '../../project/project-service'
import { buildFlowReview, FlowProblem } from './build-flow-review'
import { mcpUtils } from './mcp-utils'

const routerBranchSpec = z.object({
    branchName: z.string().describe('Display name of the branch, e.g. "Urgent"'),
    conditions: mcpUtils.BRANCH_CONDITIONS_INPUT_SCHEMA.optional().describe('Conditions for this branch (outer array = OR groups, inner array = AND conditions)'),
})

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
    branches: z.array(routerBranchSpec).optional().describe('For ROUTER steps: the condition branches, in the order they are checked. An "Otherwise" fallback branch is always added after them.'),
    fallbackBranchName: z.string().optional().describe('For ROUTER steps: name of the extra fallback branch that runs when no condition matches (added after your branches). Defaults to "Otherwise"; do not reuse one of your branch names.'),
    parentStepName: z.string().optional().describe('The step to place this one after or inside: an earlier step\'s name (e.g. "step_2") or its displayName from this same call (e.g. "Route by urgency"). If omitted, the step goes after the previous top-level step.'),
    stepLocationRelativeToParent: z.enum([
        StepLocationRelativeToParent.AFTER,
        StepLocationRelativeToParent.INSIDE_LOOP,
        StepLocationRelativeToParent.INSIDE_BRANCH,
    ]).optional().default(StepLocationRelativeToParent.AFTER).describe('Where to place the step relative to parentStepName: AFTER, INSIDE_LOOP (first step inside a loop), or INSIDE_BRANCH (first step inside a router branch, with branchIndex). Further steps in the same branch or loop go AFTER the previous step there.'),
    branchIndex: z.number().int().min(0).optional().describe('For INSIDE_BRANCH: the branch to place the step in, 0-based in the order of the router\'s branches; the fallback branch comes last. Omitted: the first branch that has no step yet.'),
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
        description: 'Create a NEW flow from scratch in one call: trigger + steps, including loops and conditions. Steps are added sequentially by default (trigger → step_1 → step_2 → ...). To nest steps inside a loop, set parentStepName to the loop step and stepLocationRelativeToParent to INSIDE_LOOP. For a condition, add a ROUTER step with its branches (each with conditions; an "Otherwise" fallback is added last), then put each branch\'s first step INSIDE_BRANCH with parentStepName = the router and branchIndex, and the rest of that branch AFTER the previous step in it. parentStepName may be an earlier step\'s displayName from the same call. Build the whole flow in this one call rather than adding steps one by one. Dropdown inputs may be given an option label (e.g. "#general"): a clear match is replaced by its value, otherwise the candidates are reported. The reply already validates the flow: it lists every step and every remaining problem as `step.field: message` — fix them all in ONE ap_apply_flow_operations call; no ap_validate_step_config / ap_validate_flow call is needed after it. For EDITING an existing flow, do NOT rebuild it — use the granular ap_add_step / ap_update_step / ap_update_trigger instead. Prefer PIECE actions and inline formula expressions (in a free-text/value input — never a dropdown/option field — wrapped `ap-formula-v1::{…}::ap-formula-v1`) over CODE steps — only emit a CODE step when no piece fits AND the logic exceeds the inline formula functions (see the build_flow guide expression ladder).',
        inputSchema: {
            flowName: z.string().describe('Name for the new flow'),
            trigger: z.object({
                pieceName: z.string().describe('Trigger piece name (e.g. "@activepieces/piece-webhook")'),
                triggerName: z.string().describe('Trigger name (e.g. "catch_webhook")'),
                input: z.record(z.string(), z.unknown()).optional().describe('Trigger input config'),
                auth: z.string().optional().describe('Connection externalId for trigger auth'),
            }).describe('Trigger configuration'),
            folderName: mcpUtils.FOLDER_NAME_SCHEMA,
            steps: z.array(stepSpec).describe('Array of steps. By default added sequentially after trigger. Use parentStepName + stepLocationRelativeToParent (+ branchIndex) to nest steps inside loops and router branches. Each step supports: PIECE (pieceName+actionName+input), CODE (sourceCode+input), LOOP_ON_ITEMS (loopItems), ROUTER (branches). Prefer PIECE and inline formula expressions (in free-text/value inputs, not dropdowns) over CODE — reach for a CODE step only when no piece fits and the transform exceeds the inline formula functions.'),
        },
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
        execute: async (args) => {
            let flowId: string | undefined
            const projectId = mcp.projectId
            try {
                const parsed = buildFlowInput.parse(args)
                const { flowName, folderName } = parsed
                const trigger = { ...parsed.trigger, auth: mcpUtils.normalizeAuth(parsed.trigger.auth) }
                const steps = parentsFirst(parsed.steps).map((step) => ({ ...step, auth: mcpUtils.normalizeAuth(step.auth) }))
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
                const triggerLabels = await buildFlowReview.resolveDropdownLabels({
                    pieceName: triggerVersionResult.normalizedPieceName,
                    pieceVersion: triggerVersionResult.pieceVersion,
                    componentName: trigger.triggerName,
                    componentType: 'trigger',
                    stepName: 'trigger',
                    input: { ...triggerUnknown.input, ...(trigger.auth ? { auth: `{{connections['${trigger.auth}']}}` } : {}) },
                    projectId, platformId, log,
                })
                const triggerInput = triggerLabels.input
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
                const resolvedLabels: string[] = [...triggerLabels.resolved]
                const labelProblems: FlowProblem[] = [...triggerLabels.problems]
                const placements = new Map<string, string>()
                let lastTopLevelStepName: string | null = null
                const topLevelStepNames = new Set<string>(['trigger'])
                const stepNameByDisplayName = new Map<string, string>()
                const skippedDisplayNames = new Set<string>()
                const actionCatalog = lazyActionCatalog({ projectId, platformId, log })
                const skip = ({ displayName, reason }: { displayName: string, reason: string }): void => {
                    skippedSteps.push(`${displayName} (${reason})`)
                    skippedDisplayNames.add(displayName)
                }

                for (const step of steps) {
                    const latestTrigger = currentFlow!.version.trigger
                    const stepName = flowStructureUtil.findUnusedName(latestTrigger)
                    const allSteps = flowStructureUtil.getAllSteps(latestTrigger)

                    let resolvedPieceVersion: string | undefined
                    let resolvedPieceName: string | undefined
                    if (step.type === FlowActionType.PIECE) {
                        const pieceName = step.pieceName ?? await pieceOwningAction({ actionName: step.actionName, catalog: actionCatalog })
                        if (isNil(pieceName)) {
                            skip({ displayName: step.displayName, reason: `pieceName is missing and no single app has the action "${step.actionName ?? ''}"` })
                            continue
                        }
                        const versionResult = await mcpUtils.resolveLatestPieceVersion({ pieceName, projectId, platformId, log })
                        if (versionResult.error) {
                            skip({ displayName: step.displayName, reason: firstText(versionResult.error) })
                            continue
                        }
                        resolvedPieceVersion = versionResult.pieceVersion
                        resolvedPieceName = versionResult.normalizedPieceName
                    }

                    const stepUnknown = await knownStepInput({ step, pieceName: resolvedPieceName, pieceVersion: resolvedPieceVersion, platformId, log })
                    const rewritten = mcpUtils.rewriteAllReferences({ input: stepUnknown.input, loopItems: step.loopItems, conditions: step.branches, trigger: latestTrigger })
                    const labels = await stepLabels({ step, stepName, pieceName: resolvedPieceName, pieceVersion: resolvedPieceVersion, input: rewritten.input, projectId, platformId, log })
                    const stepInput = await inputWithOptionalDefaults({ step, pieceName: resolvedPieceName, pieceVersion: resolvedPieceVersion, input: labels.input, platformId, log })
                    const rewrittenStep = { ...step, input: stepInput, loopItems: rewritten.loopItems, branches: rewritten.conditions }
                    const propertySettings = await stepPropertySettings({ actionName: step.actionName, pieceName: resolvedPieceName, pieceVersion: resolvedPieceVersion, input: { ...(stepInput ?? {}), ...(step.auth ? { auth: `{{connections['${step.auth}']}}` } : {}) }, projectId, platformId, log })
                    const skeleton = buildSkeleton({ step: rewrittenStep, name: stepName, resolvedPieceVersion, resolvedPieceName, propertySettings })
                    const parseResult = UpdateActionRequest.safeParse(skeleton)
                    if (!parseResult.success) {
                        skip({ displayName: step.displayName, reason: parseResult.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ') })
                        continue
                    }

                    const location = step.stepLocationRelativeToParent ?? StepLocationRelativeToParent.AFTER
                    const defaultParent = lastTopLevelStepName ?? allSteps[allSteps.length - 1].name
                    const requestedParent = resolveParentStepName({ requested: step.parentStepName, stepNameByDisplayName, existingStepNames: allSteps.map((s) => s.name) })
                    if (!isNil(step.parentStepName) && isNil(requestedParent)) {
                        const why = skippedDisplayNames.has(step.parentStepName) ? 'was skipped' : 'is not in this flow'
                        skip({ displayName: step.displayName, reason: `its parent "${step.parentStepName}" ${why}; add it after fixing the parent` })
                        continue
                    }
                    const parentStepName = requestedParent ?? defaultParent
                    const branchPlacement = branchPlacementFor({ location, branchIndex: step.branchIndex, parent: allSteps.find((s) => s.name === parentStepName) })
                    if (branchPlacement.error) {
                        skip({ displayName: step.displayName, reason: branchPlacement.error })
                        continue
                    }

                    currentFlow = await flowService(log).update({
                        id: flowId, projectId, userId: userId ?? null, platformId,
                        operation: {
                            type: FlowOperationType.ADD_ACTION,
                            request: {
                                parentStep: parentStepName,
                                stepLocationRelativeToParent: location,
                                ...(isNil(branchPlacement.branchIndex) ? {} : { branchIndex: branchPlacement.branchIndex }),
                                action: parseResult.data,
                            },
                        },
                    })

                    if (stepUnknown.unknownKeys.length > 0) {
                        unknownPropFindings.push(`${stepName} (${step.displayName}): ${stepUnknown.message}`)
                    }

                    resolvedLabels.push(...labels.resolved)
                    labelProblems.push(...labels.problems)
                    placements.set(stepName, placementText({ location, parentStepName, parent: allSteps.find((s) => s.name === parentStepName), branchIndex: branchPlacement.branchIndex }))
                    stepNameByDisplayName.set(step.displayName, stepName)
                    if (location === StepLocationRelativeToParent.AFTER && topLevelStepNames.has(parentStepName)) {
                        topLevelStepNames.add(stepName)
                        lastTopLevelStepName = stepName
                    }
                }

                const allSteps = flowStructureUtil.getAllSteps(currentFlow.version.trigger)
                const validCount = allSteps.filter(s => s.valid).length
                const invalidStepList = allSteps.filter(s => !s.valid)
                const invalidSteps = invalidStepList.map(s => s.name)
                const invalidReasons = new Map(await Promise.all(invalidStepList.map(async (step) => {
                    const { data: reasons } = await tryCatch(() => flowVersionValidationUtil(log).invalidPieceInputs({ platformId, step }))
                    return [step.name, reasons ?? []] as const
                })))
                const describedInvalidSteps = invalidStepList.map((step) => describeInvalidStep({ name: step.name, reasons: invalidReasons.get(step.name) ?? [] }))
                const problems = await buildFlowReview.findProblems({ trigger: currentFlow.version.trigger, invalidReasons, labelProblems, platformId, log })
                const stepSummaries = allSteps.map((step) => buildFlowReview.summarizeStep({ name: step.name, step, placement: placements.get(step.name) ?? '' }))
                const details = reviewDetails({ stepSummaries, resolvedLabels, problems })
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
                    flowSteps: buildFlowReview.flowStepStates({ trigger: currentFlow.version.trigger, problemStepNames: new Set(problems.map((problem) => problem.step)), skippedDisplayNames: [...skippedDisplayNames] }),
                    invalidSteps,
                    skippedSteps,
                    unknownProps: unknownPropFindings,
                    steps: stepSummaries,
                    resolvedLabels,
                    problems: problems.map((problem) => ({ ...problem, text: buildFlowReview.formatProblem(problem) })),
                }
                if (unknownPropFindings.length > 0) {
                    return { content: [{ type: 'text', text: `❌ Flow "${flowName}" created (id: ${flowId})${createdIn}, but some settings used property names that do NOT exist on the piece and were dropped — the flow does NOT behave as configured. Do NOT tell the user these settings were applied. Fix each with ap_update_step / ap_update_trigger using the correct property names:\n${unknownPropFindings.join('\n')}\n${details}\nOpen: ${flowUrl}${solutionCheckHint}` }], structuredContent: structured }
                }
                if (invalidSteps.length === 0 && skippedSteps.length === 0 && problems.length === 0) {
                    return { content: [{ type: 'text', text: `✅ Flow "${flowName}" created (id: ${flowId})${createdIn} with ${allSteps.length} ${stepWord}, all valid and checked (no need to run ap_validate_flow).\n${details}\nOpen: ${flowUrl}${solutionCheckHint}` }], structuredContent: structured }
                }
                const invalidHint = invalidSteps.length > 0 ? `, ${invalidSteps.length} invalid: ${describedInvalidSteps.join(', ')}` : ''
                return { content: [{ type: 'text', text: `⚠️ Flow "${flowName}" created (id: ${flowId})${createdIn} with ${allSteps.length} ${stepWord} (${validCount} valid${invalidHint}).${skippedHint}\n${details}\nOpen: ${flowUrl}${solutionCheckHint}` }], structuredContent: structured }
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

function lazyActionCatalog({ projectId, platformId, log }: {
    projectId: string
    platformId: string
    log: FastifyBaseLogger
}): () => Promise<ActionCatalog> {
    let loaded: Promise<ActionCatalog> | undefined
    return () => {
        loaded ??= tryCatch(() => pieceMetadataService(log).list({ projectId, platformId, includeHidden: false, suggestionType: SuggestionType.ACTION, audience: PieceAudienceFilter.ALL })).then(({ data }) => data ?? [])
        return loaded
    }
}

async function pieceOwningAction({ actionName, catalog }: {
    actionName: string | undefined
    catalog: () => Promise<ActionCatalog>
}): Promise<string | undefined> {
    if (isNil(actionName) || actionName.length === 0) {
        return undefined
    }
    const owners = (await catalog()).filter((piece) => (piece.suggestedActions ?? []).some((action) => action.name === actionName))
    return owners.length === 1 ? owners[0].name : undefined
}

function firstText(result: { content: Array<{ text: string }> }): string {
    return result.content[0]?.text.replace(/^❌\s*/, '') ?? 'unknown error'
}

function parentsFirst<T extends { displayName: string, parentStepName?: string }>(steps: T[]): T[] {
    const batchNames = new Set(steps.map((step) => step.displayName))
    const placed = new Set<string>()
    const ordered: T[] = []
    let remaining = steps
    while (remaining.length > 0) {
        const ready = remaining.filter((step) => isNil(step.parentStepName) || step.parentStepName === step.displayName || !batchNames.has(step.parentStepName) || placed.has(step.parentStepName))
        if (ready.length === 0) {
            return [...ordered, ...remaining]
        }
        ready.forEach((step) => placed.add(step.displayName))
        ordered.push(...ready)
        remaining = remaining.filter((step) => !ready.includes(step))
    }
    return ordered
}

function resolveParentStepName({ requested, stepNameByDisplayName, existingStepNames }: {
    requested: string | undefined
    stepNameByDisplayName: Map<string, string>
    existingStepNames: string[]
}): string | undefined {
    if (isNil(requested)) {
        return undefined
    }
    if (existingStepNames.includes(requested)) {
        return requested
    }
    return stepNameByDisplayName.get(requested)
}

function branchPlacementFor({ location, branchIndex, parent }: {
    location: StepLocationRelativeToParent
    branchIndex: number | undefined
    parent: Step | undefined
}): { branchIndex?: number, error?: string } {
    if (location !== StepLocationRelativeToParent.INSIDE_BRANCH) {
        return {}
    }
    if (parent?.type !== FlowActionType.ROUTER) {
        return { error: 'INSIDE_BRANCH needs parentStepName to be a ROUTER step from this flow' }
    }
    const branchCount = parent.settings.branches.length
    if (isNil(branchIndex)) {
        const firstEmptyBranch = parent.children.findIndex((child) => isNil(child))
        return firstEmptyBranch === -1
            ? { error: `INSIDE_BRANCH needs a branchIndex from 0 to ${branchCount - 1}; every branch already has a first step` }
            : { branchIndex: firstEmptyBranch }
    }
    if (branchIndex >= branchCount) {
        return { error: `INSIDE_BRANCH needs a branchIndex from 0 to ${branchCount - 1}` }
    }
    return { branchIndex }
}

function placementText({ location, parentStepName, parent, branchIndex }: {
    location: StepLocationRelativeToParent
    parentStepName: string
    parent: Step | undefined
    branchIndex: number | undefined
}): string {
    if (location === StepLocationRelativeToParent.INSIDE_LOOP) {
        return `first inside loop ${parentStepName}`
    }
    if (location === StepLocationRelativeToParent.INSIDE_BRANCH && parent?.type === FlowActionType.ROUTER && !isNil(branchIndex)) {
        return `first in ${parentStepName} branch "${parent.settings.branches[branchIndex]?.branchName ?? branchIndex}"`
    }
    return `after ${parentStepName}`
}

function reviewDetails({ stepSummaries, resolvedLabels, problems }: {
    stepSummaries: string[]
    resolvedLabels: string[]
    problems: FlowProblem[]
}): string {
    const sections = [
        `Steps:\n${stepSummaries.join('\n')}`,
        resolvedLabels.length > 0 ? `Dropdown labels replaced by their values:\n${resolvedLabels.join('\n')}` : '',
        problems.length > 0 ? `Problems (already validated). Fix them ALL in ONE ap_apply_flow_operations call, not one call per field; don't call ap_validate_flow or ap_validate_step_config, the result lists what is left:\n${problems.map(buildFlowReview.formatProblem).join('\n')}` : '',
    ]
    return sections.filter((section) => section.length > 0).join('\n')
}

async function stepLabels({ step, stepName, pieceName, pieceVersion, input, projectId, platformId, log }: {
    step: z.infer<typeof stepSpec>
    stepName: string
    pieceName: string | undefined
    pieceVersion: string | undefined
    input: Record<string, unknown> | undefined
    projectId: string
    platformId: string
    log: FastifyBaseLogger
}): Promise<{ input: Record<string, unknown> | undefined, resolved: string[], problems: FlowProblem[] }> {
    const actionName = step.actionName
    if (step.type !== FlowActionType.PIECE || isNil(pieceName) || isNil(pieceVersion) || isNil(actionName) || isNil(input)) {
        return { input, resolved: [], problems: [] }
    }
    const auth = step.auth ? { auth: `{{connections['${step.auth}']}}` } : {}
    const resolution = await buildFlowReview.resolveDropdownLabels({ pieceName, pieceVersion, componentName: actionName, componentType: 'action', stepName, input: { ...input, ...auth }, projectId, platformId, log })
    return resolution
}

function fallbackBranchName({ requested, conditionBranchNames }: { requested: string | undefined, conditionBranchNames: string[] }): string {
    const clashes = !isNil(requested) && conditionBranchNames.some((name) => name.trim().toLowerCase() === requested.trim().toLowerCase())
    return isNil(requested) || clashes ? DEFAULT_FALLBACK_BRANCH_NAME : requested
}

async function inputWithOptionalDefaults({ step, pieceName, pieceVersion, input, platformId, log }: {
    step: z.infer<typeof stepSpec>
    pieceName: string | undefined
    pieceVersion: string | undefined
    input: Record<string, unknown> | undefined
    platformId: string
    log: FastifyBaseLogger
}): Promise<Record<string, unknown> | undefined> {
    if (step.type !== FlowActionType.PIECE || isNil(pieceName) || isNil(pieceVersion) || isNil(step.actionName)) {
        return input
    }
    const settings: Record<string, unknown> = { pieceName, pieceVersion, actionName: step.actionName, input: input ?? {} }
    await mcpUtils.fillDefaultsForMissingOptionalProps({ settings, platformId, log })
    return isObject(settings.input) ? settings.input : input
}

function describeInvalidStep({ name, reasons }: { name: string, reasons: string[] }): string {
    return reasons.length === 0 ? name : `${name} (${reasons.join('; ')})`
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
        case FlowActionType.ROUTER:
            return {
                type: FlowActionType.ROUTER,
                name,
                displayName: step.displayName,
                valid: false,
                settings: {
                    executionType: RouterExecutionType.EXECUTE_FIRST_MATCH,
                    branches: [
                        ...(step.branches ?? DEFAULT_CONDITION_BRANCHES).map((branch) => ({
                            branchName: branch.branchName,
                            branchType: BranchExecutionType.CONDITION,
                            conditions: branch.conditions ?? [[]],
                        })),
                        { branchName: fallbackBranchName({ requested: step.fallbackBranchName, conditionBranchNames: (step.branches ?? DEFAULT_CONDITION_BRANCHES).map((branch) => branch.branchName) }), branchType: BranchExecutionType.FALLBACK },
                    ],
                },
            }
        default:
            return { type: step.type, name, displayName: step.displayName, valid: false, settings: {} }
    }
}

const DEFAULT_FALLBACK_BRANCH_NAME = 'Otherwise'
const DEFAULT_CONDITION_BRANCHES = [{ branchName: 'Branch 1', conditions: undefined }]

type ActionCatalog = Awaited<ReturnType<ReturnType<typeof pieceMetadataService>['list']>>
