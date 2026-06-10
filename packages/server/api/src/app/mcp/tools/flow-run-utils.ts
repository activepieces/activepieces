import { apId, FlowActionType, FlowOperationType, FlowRun, FlowRunStatus, flowStructureUtil, FlowTriggerType, isFlowRunStateTerminal, isNil, McpToolResult, RunEnvironment, SampleDataFileType, StepLocationRelativeToParent, StepOutputStatus, tryCatch, UpdateActionRequest } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowService } from '../../flows/flow/flow.service'
import { flowRunService, isOutsideRetentionWindow } from '../../flows/flow-run/flow-run-service'
import { sampleDataService } from '../../flows/step-run/sample-data.service'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
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
}): Promise<McpToolResult> {
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
}): Promise<McpToolResult> {
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

    // createCustomApiCallAction wraps url in DynamicProperties, expecting { url: string } not a flat string
    if (actionName === 'custom_api_call' && typeof resolvedInput.url === 'string') {
        resolvedInput.url = { url: resolvedInput.url }
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

    const { data: project, error: projectError } = await tryCatch(
        () => projectService(log).getOneOrThrow(projectId),
    )
    if (projectError) {
        return mcpUtils.mcpToolError('Failed to load project', projectError)
    }

    const resolvedPieceVersion = pieceVersion ?? piece.version

    const { data: flow, error: flowError } = await tryCatch(
        () => flowService(log).create({
            projectId,
            request: { displayName: `__adhoc_${apId()}__`, projectId },
        }),
    )
    if (flowError) {
        return mcpUtils.mcpToolError('Failed to create adhoc flow', flowError)
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
            errorHandlingOptions: mcpUtils.buildErrorHandlingOptions({}),
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

        if (completedRun.status === FlowRunStatus.INTERNAL_ERROR && isNil(completedRun.steps)) {
            return {
                content: [{
                    type: 'text',
                    text: `❌ ${action.displayName} failed with INTERNAL_ERROR (no step data) — the engine crashed while loading or executing the piece. Run ID: ${completedRun.id}.`,
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

function looksEmpty(output: unknown): boolean {
    if (output === undefined || output === null) return true
    if (Array.isArray(output) && output.length === 0) return true
    if (typeof output === 'object' && output !== null) {
        const obj = output as Record<string, unknown>
        if (obj.found === false) return true
        if (Array.isArray(obj.messages) && obj.messages.length === 0) return true
        if (Array.isArray(obj.results) && obj.results.length === 0) return true
        if (typeof obj.results === 'object' && obj.results !== null) {
            const results = obj.results as Record<string, unknown>
            if (Array.isArray(results.messages) && results.messages.length === 0 && results.count === 0) return true
        }
    }
    return false
}

function formatAdhocActionResult(run: FlowRun, stepName: string, displayName: string): string {
    const steps = run.steps
    if (isNil(steps) || typeof steps !== 'object') {
        return `❌ ${displayName} — run ${run.id} completed with no step output (status: ${run.status}).`
    }
    const step = (steps as Record<string, unknown>)[stepName]
    if (isNil(step) || typeof step !== 'object') {
        return `❌ ${displayName} — run ${run.id} completed with no step output (status: ${run.status}).`
    }
    const stepRecord = step as Record<string, unknown>
    const status = stepRecord.status
    const output = stepRecord.output
    const errorMessage = stepRecord.errorMessage
    if (status === StepOutputStatus.SUCCEEDED) {
        const outStr = output === undefined
            ? '(no output)'
            : typeof output === 'string' ? output : JSON.stringify(output)
        const base = `✅ ${displayName} completed (run ${run.id}).\n\n${outStr}`
        if (looksEmpty(output)) {
            return `${base}\n\nNote: No results matched. If the user expected data, try broader parameters (e.g., wider date range, fewer filters).`
        }
        return base
    }
    const errStr = errorMessage === undefined
        ? `status: ${String(status)}`
        : typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)
    return `❌ ${displayName} failed (run ${run.id}): ${errStr}\n\nRetry suggestion: Check the error above. If it mentions missing criteria, try adding a broad filter (e.g., after_date with a recent date, or a common search term). If it mentions auth, verify the connection.`
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
    const stepEntries = !isNil(steps) && typeof steps === 'object'
        ? Object.entries(steps as Record<string, unknown>)
        : []

    lines.push('')
    if (stepEntries.length > 0) {
        lines.push('Steps:')
        for (const [name, step] of stepEntries) {
            lines.push(formatStepOutput(name, step))
        }
    }
    else {
        lines.push(`Steps: ${stepDataUnavailableReason(run)}`)
    }

    return lines.join('\n')
}

export function formatRunSummary(run: FlowRun): string {
    const env = run.environment === RunEnvironment.TESTING ? ' [TEST]' : ''
    const failed = run.failedStep ? ` | Failed: ${run.failedStep.displayName ?? run.failedStep.name}` : ''
    const dur = formatDuration(run.startTime, run.finishTime)
    const durStr = dur !== 'N/A' ? ` | ${dur}` : ''
    const expired = isStepDataExpired(run) ? ' | step data expired' : ''
    return `${statusIcon(run.status)} ${run.id} — ${run.status}${env}${durStr}${failed}${expired} | ${run.created}`
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
        parts.push(`    Error: ${errStr}`)
    }
    else if (output !== undefined) {
        const outStr = typeof output === 'string' ? output : JSON.stringify(output)
        parts.push(`    Output: ${outStr}`)
    }

    return parts.join('\n')
}

function stepDataUnavailableReason(run: FlowRun): string {
    if (!isFlowRunStateTerminal({ status: run.status, ignoreInternalError: false })) {
        return 'not yet available — run is still in progress.'
    }
    const retentionDays = system.getNumberOrThrow(AppSystemProp.EXECUTION_DATA_RETENTION_DAYS)
    if (isOutsideRetentionWindow(run.created, retentionDays)) {
        return `not available — execution data is purged after ${retentionDays} days. Re-run the flow with ap_test_flow or ap_retry_run to capture fresh step data.`
    }
    return 'not available for this run.'
}

function isStepDataExpired(run: FlowRun): boolean {
    if (!isFlowRunStateTerminal({ status: run.status, ignoreInternalError: false })) {
        return false
    }
    const retentionDays = system.getNumberOrThrow(AppSystemProp.EXECUTION_DATA_RETENTION_DAYS)
    return isOutsideRetentionWindow(run.created, retentionDays)
}

