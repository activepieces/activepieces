import { apId, FlowActionType, FlowOperationType, FlowRun, FlowRunStatus, flowStructureUtil, FlowTriggerType, isFlowRunStateTerminal, isNil, RunEnvironment, SampleDataFileType, StepLocationRelativeToParent, StepOutputStatus, UpdateActionRequest } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowService } from '../../flows/flow/flow.service'
import { flowRunService } from '../../flows/flow-run/flow-run-service'
import { sampleDataService } from '../../flows/step-run/sample-data.service'
import { projectService } from '../../project/project-service'
import { mcpUtils } from './mcp-utils'

const POLL_INTERVAL_MS = 2000
const MAX_WAIT_MS = 120_000

export async function executeFlowTest({ flowId, projectId, stepName, triggerTestData, log }: {
    flowId: string
    projectId: string
    stepName?: string
    triggerTestData?: Record<string, unknown>
    log: FastifyBaseLogger
}): Promise<{ content: [{ type: 'text', text: string }] }> {
    let flow = await flowService(log).getOnePopulated({ id: flowId, projectId })
    if (isNil(flow)) {
        return { content: [{ type: 'text', text: '❌ Flow not found' }] }
    }

    if (!flow.version.trigger.valid) {
        return { content: [{ type: 'text', text: '❌ Flow trigger is not configured. Use ap_update_trigger to set up the trigger before testing.' }] }
    }

    let warning = ''
    if (stepName) {
        const step = flowStructureUtil.getStep(stepName, flow.version.trigger)
        if (isNil(step)) {
            const allSteps = flowStructureUtil.getAllSteps(flow.version.trigger).map(s => s.name).join(', ')
            return { content: [{ type: 'text', text: `❌ Step "${stepName}" not found. Available steps: ${allSteps}` }] }
        }
    }
    else {
        const invalidSteps = flowStructureUtil.getAllSteps(flow.version.trigger)
            .filter(s => !s.valid && !flowStructureUtil.isTrigger(s.type))
            .map(s => s.displayName)
        if (invalidSteps.length > 0) {
            warning = `⚠️ These steps are not fully configured: ${invalidSteps.join(', ')}. Results may be incomplete.\n\n`
        }
    }

    if (triggerTestData) {
        const project = await projectService(log).getOneOrThrow(projectId)
        const sampleDataSettings = await sampleDataService(log).saveSampleDataFileIdsInStep({
            projectId,
            flowVersionId: flow.version.id,
            stepName: flow.version.trigger.name,
            payload: triggerTestData,
            type: SampleDataFileType.OUTPUT,
        })
        const updatedFlow = await flowService(log).update({
            id: flow.id,
            projectId,
            userId: null,
            platformId: project.platformId,
            operation: {
                type: FlowOperationType.UPDATE_SAMPLE_DATA_INFO,
                request: { stepName: flow.version.trigger.name, sampleDataSettings },
            },
        })
        flow = updatedFlow
    }

    const flowRun = await flowRunService(log).test({
        projectId,
        flowVersionId: flow.version.id,
        stepNameToTest: stepName,
    })

    const completedRun = await pollForRunCompletion(log, flowRun.id, projectId)

    if (!isFlowRunStateTerminal({ status: completedRun.status, ignoreInternalError: false })) {
        return {
            content: [{
                type: 'text',
                text: `⏳ Test still running after 120s. Run ID: ${completedRun.id} (status: ${completedRun.status}). Use ap_get_run to check results later.`,
            }],
        }
    }

    if (completedRun.status === FlowRunStatus.INTERNAL_ERROR && isNil(completedRun.steps)) {
        return {
            content: [{
                type: 'text',
                text: '❌ Test failed with INTERNAL_ERROR (no step data). Check that all steps are properly configured using ap_flow_structure.',
            }],
        }
    }

    return { content: [{ type: 'text', text: warning + formatRunResult(completedRun) }] }
}

type McpToolTextResult = { content: [{ type: 'text', text: string }] }

export async function executeAdhocAction({
    projectId,
    pieceName,
    pieceVersion,
    actionName,
    input,
    connectionExternalId,
    log,
}: {
    projectId: string
    pieceName: string
    pieceVersion?: string
    actionName: string
    input?: Record<string, unknown>
    connectionExternalId?: string
    log: FastifyBaseLogger
}): Promise<McpToolTextResult> {
    const authError = mcpUtils.validateAuth(connectionExternalId)
    if (authError) {
        return authError
    }

    const normalizedPieceName = mcpUtils.normalizePieceName(pieceName)
    if (isNil(normalizedPieceName)) {
        return mcpUtils.mcpToolError('Validation failed', new Error('pieceName is required'))
    }

    const lookup = await mcpUtils.lookupPieceComponent({
        pieceName: normalizedPieceName,
        componentName: actionName,
        componentType: 'action',
        projectId,
        log,
    })
    if ('error' in lookup && lookup.error) {
        return lookup.error
    }
    const { piece, component: action, pieceName: resolvedPieceName } = lookup

    const resolvedInput: Record<string, unknown> = {
        ...(input ?? {}),
        ...(connectionExternalId !== undefined && { auth: `{{connections['${connectionExternalId}']}}` }),
    }

    const diagnosis = mcpUtils.diagnosePieceProps({
        props: action.props,
        input: resolvedInput,
        pieceAuth: piece.auth,
        requireAuth: action.requireAuth,
        componentType: 'action',
    })
    if (diagnosis.missing.length > 0) {
        return { content: [{ type: 'text', text: `❌ Cannot run action: ${diagnosis.parts.join(' ')}` }] }
    }

    let project
    try {
        project = await projectService(log).getOneOrThrow(projectId)
    }
    catch (err) {
        return mcpUtils.mcpToolError('Failed to load project', err)
    }

    const resolvedPieceVersion = pieceVersion ?? piece.version

    let flow
    try {
        flow = await flowService(log).create({
            projectId,
            request: { displayName: `__adhoc_${apId()}__`, projectId },
        })
    }
    catch (err) {
        return mcpUtils.mcpToolError('Failed to create adhoc flow', err)
    }

    try {
        const triggerName = flow.version.trigger.name

        const flowWithTrigger = await flowService(log).update({
            id: flow.id,
            projectId,
            userId: null,
            platformId: project.platformId,
            operation: {
                type: FlowOperationType.UPDATE_TRIGGER,
                request: {
                    name: triggerName,
                    displayName: 'Manual',
                    valid: true,
                    type: FlowTriggerType.EMPTY,
                    settings: {},
                },
            },
        })

        const stepName = flowStructureUtil.findUnusedName(flowWithTrigger.version.trigger)

        const pieceSettings: Record<string, unknown> = {
            pieceName: resolvedPieceName,
            pieceVersion: resolvedPieceVersion,
            actionName: action.name,
            input: resolvedInput,
            propertySettings: {},
            errorHandlingOptions: { continueOnFailure: { value: false }, retryOnFailure: { value: false } },
        }
        await mcpUtils.fillDefaultsForMissingOptionalProps({ settings: pieceSettings, platformId: project.platformId, log })

        const parsedAction = UpdateActionRequest.safeParse({
            type: FlowActionType.PIECE,
            name: stepName,
            displayName: action.displayName,
            valid: true,
            settings: pieceSettings,
        })
        if (!parsedAction.success) {
            const message = parsedAction.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
            return { content: [{ type: 'text', text: `❌ Invalid action configuration: ${message}` }] }
        }

        const flowWithStep = await flowService(log).update({
            id: flow.id,
            projectId,
            userId: null,
            platformId: project.platformId,
            operation: {
                type: FlowOperationType.ADD_ACTION,
                request: {
                    parentStep: triggerName,
                    stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
                    action: parsedAction.data,
                },
            },
        })

        const flowRun = await flowRunService(log).test({
            projectId,
            flowVersionId: flowWithStep.version.id,
            stepNameToTest: stepName,
        })

        const completedRun = await pollForRunCompletion(log, flowRun.id, projectId)

        if (!isFlowRunStateTerminal({ status: completedRun.status, ignoreInternalError: false })) {
            return {
                content: [{
                    type: 'text',
                    text: `⏳ Action still running after 120s. Run ID: ${completedRun.id} (status: ${completedRun.status}). Use ap_get_run to check results later.`,
                }],
            }
        }

        return { content: [{ type: 'text', text: formatAdhocActionResult(completedRun, stepName, action.displayName) }] }
    }
    catch (err) {
        log.error({ err, projectId, flowId: flow.id }, 'executeAdhocAction failed')
        return mcpUtils.mcpToolError('Failed to run action', err)
    }
    finally {
        flowService(log).delete({ id: flow.id, projectId }).catch(err => {
            log.warn({ err, flowId: flow.id }, 'adhoc flow cleanup failed')
        })
    }
}

function formatAdhocActionResult(run: FlowRun, stepName: string, displayName: string): string {
    const steps = run.steps as Record<string, unknown> | undefined | null
    const step = !isNil(steps) && typeof steps === 'object' ? steps[stepName] : undefined
    if (isNil(step) || typeof step !== 'object') {
        return `❌ ${displayName} — run ${run.id} completed with no step output (status: ${run.status}).`
    }
    const { status, output, errorMessage } = step as { status?: unknown, output?: unknown, errorMessage?: unknown }
    if (status === StepOutputStatus.SUCCEEDED) {
        const outStr = output === undefined
            ? '(no output)'
            : typeof output === 'string' ? output : JSON.stringify(output, null, 2)
        return `✅ ${displayName} completed (run ${run.id}).\n\n${mcpUtils.truncate(outStr, 4000)}`
    }
    const errStr = errorMessage === undefined
        ? `status: ${String(status)}`
        : typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)
    return `❌ ${displayName} failed (run ${run.id}): ${mcpUtils.truncate(errStr, 2000)}`
}

export async function pollForRunCompletion(log: FastifyBaseLogger, runId: string, projectId: string): Promise<FlowRun> {
    const start = Date.now()
    while (Date.now() - start < MAX_WAIT_MS) {
        const run = await flowRunService(log).getOnePopulatedOrThrow({ id: runId, projectId })
        if (isFlowRunStateTerminal({ status: run.status, ignoreInternalError: false })) {
            return run
        }
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))
    }
    return flowRunService(log).getOnePopulatedOrThrow({ id: runId, projectId })
}

export function formatRunResult(run: FlowRun): string {
    const lines: string[] = []
    lines.push(`${statusIcon(run.status)} Run ${run.id} — ${run.status} (${formatDuration(run.startTime, run.finishTime)})`)
    lines.push(`  Flow: ${run.flowId} | Environment: ${run.environment}`)

    if (run.failedStep) {
        lines.push(`  Failed at: ${run.failedStep.displayName ?? run.failedStep.name}`)
    }

    const steps = run.steps
    if (!isNil(steps) && typeof steps === 'object') {
        lines.push('')
        lines.push('Steps:')
        for (const [name, step] of Object.entries(steps)) {
            lines.push(formatStepOutput(name, step))
        }
    }

    return lines.join('\n')
}

export function formatRunSummary(run: FlowRun): string {
    const env = run.environment === RunEnvironment.TESTING ? ' [TEST]' : ''
    const failed = run.failedStep ? ` | Failed: ${run.failedStep.displayName ?? run.failedStep.name}` : ''
    const dur = formatDuration(run.startTime, run.finishTime)
    const durStr = dur !== 'N/A' ? ` | ${dur}` : ''
    return `${statusIcon(run.status)} ${run.id} — ${run.status}${env}${durStr}${failed} | ${run.created}`
}

function statusIcon(status: FlowRunStatus): string {
    if (status === FlowRunStatus.SUCCEEDED) return '✅'
    if (status === FlowRunStatus.RUNNING || status === FlowRunStatus.QUEUED || status === FlowRunStatus.PAUSED) return '⏳'
    return '❌'
}

function formatDuration(startTime?: string | null, finishTime?: string | null): string {
    if (!startTime || !finishTime) return 'N/A'
    return `${((new Date(finishTime).getTime() - new Date(startTime).getTime()) / 1000).toFixed(1)}s`
}

function formatStepOutput(name: string, step: unknown): string {
    if (isNil(step) || typeof step !== 'object') {
        return `  - ${name}: (no data)`
    }

    const { status, duration, output, errorMessage } = step as Record<string, unknown>

    const icon = status === StepOutputStatus.SUCCEEDED ? '✅'
        : status === StepOutputStatus.FAILED ? '❌'
            : '⏳'
    const dur = typeof duration === 'number' ? ` (${(duration / 1000).toFixed(1)}s)` : ''

    const parts = [`  - ${icon} ${name}${dur}`]

    if (status === StepOutputStatus.FAILED && errorMessage !== undefined) {
        const errStr = typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)
        parts.push(`    Error: ${mcpUtils.truncate(errStr, 300)}`)
    }
    else if (output !== undefined) {
        const outStr = typeof output === 'string' ? output : JSON.stringify(output)
        parts.push(`    Output: ${mcpUtils.truncate(outStr, 500)}`)
    }

    return parts.join('\n')
}

