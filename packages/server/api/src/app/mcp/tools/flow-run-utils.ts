import { formatPieceError, isNil, isObject, tryCatch, tryCatchSync, tryParseFriendlyPieceError } from '@activepieces/core-utils'
import { CodeAction, createKeyForFormInput, FlowActionType, FlowOperationType, FlowRun, FlowRunStatus, flowStructureUtil, FlowTriggerType, isFlowRunStateTerminal, McpToolResult, PieceAction, PieceRunSource, RunEnvironment, SampleDataFileType, Step, StepOutputStatus, UpdateActionRequest } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { flowService } from '../../flows/flow/flow.service'
import { flowRunService, isOutsideRetentionWindow } from '../../flows/flow-run/flow-run-service'
import { sampleDataService } from '../../flows/step-run/sample-data.service'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { pieceRunService } from '../../piece-run/piece-run.service'
import { projectService } from '../../project/project-service'
import { mcpUtils } from './mcp-utils'

const PIECE_RUN_STEP_NAME = 'step_1'

const POLL_INTERVAL_MS = 2000
const MAX_WAIT_MS = 120_000
// The actionable part of an API error (which field, what format, allowed values) often lands past
// 300 chars, so the agent never saw it. Keep the head but allow enough to carry the real guidance.
const ERROR_SUMMARY_MAX_LENGTH = 900

type PieceRunActionResult = {
    text: string
    errorSummary?: string
}

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

    const usedMockTriggerData = !isNil(triggerTestData)
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
        warning += '⚠️ This test ran on mock trigger data you supplied, not a real trigger event. A passing test here does NOT prove the live flow works: if the real trigger payload uses different field names or casing than your mock, downstream steps will read empty values in production. Verify your mock keys match a real sample (e.g. trigger the flow once for real, or check the trigger sample shape). When reporting this to the user, describe it as "tested with sample data" — NEVER claim it was "verified with real runs".\n\n'
        warning += buildTriggerShapeHint(flow.version.trigger)
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

    return { content: [{ type: 'text', text: warning + formatRunResult(completedRun) }], structuredContent: { usedMockTriggerData } }
}

export async function executePieceRunAction({
    projectId,
    userId,
    pieceName,
    pieceVersion,
    actionName,
    input,
    connectionExternalId,
    conversationId,
    offload,
    source,
    returnRawOutput = false,
    log,
}: {
    projectId: string
    userId?: string
    pieceName: string
    pieceVersion?: string
    actionName: string
    input?: Record<string, unknown>
    connectionExternalId?: string
    conversationId?: string
    offload?: PieceRunOffload
    source?: PieceRunSource
    returnRawOutput?: boolean
    log: FastifyBaseLogger
}): Promise<McpToolResult | RawPieceRunActionResult> {
    const { auth: inlineAuth, ...inputWithoutAuth } = input ?? {}
    const effectiveExternalId = connectionExternalId ?? (typeof inlineAuth === 'string' ? inlineAuth : undefined)

    const authError = mcpUtils.validateAuth(effectiveExternalId)
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
        ...inputWithoutAuth,
        ...(effectiveExternalId !== undefined && { auth: `{{connections['${effectiveExternalId}']}}` }),
    }

    // createCustomApiCallAction wraps url in DynamicProperties, expecting { url: string } not a flat string
    if (actionName === 'custom_api_call' && typeof resolvedInput.url === 'string') {
        resolvedInput.url = { url: resolvedInput.url }
    }

    // Empty-able container props (OBJECT/ARRAY) like custom_api_call's required headers/queryParams
    // mean "none" when omitted — fill them so a first-shot call isn't bounced for an empty bag.
    const coercedInput = mcpUtils.coerceEmptyContainerInputs({ props: action.props, input: resolvedInput })

    const diagnosis = mcpUtils.diagnosePieceProps({
        props: action.props,
        input: coercedInput,
        pieceAuth: piece.auth,
        requireAuth: action.requireAuth,
        componentType: 'action',
    })
    if (diagnosis.unknownKeys.length > 0) {
        return { content: [{ type: 'text', text: `❌ ${diagnosis.parts.join(' ')}` }] }
    }
    if (diagnosis.missing.length > 0 || diagnosis.invalidEnums.length > 0) {
        return { content: [{ type: 'text', text: `❌ Cannot run action: ${diagnosis.parts.join(' ')}` }] }
    }

    const { data: project, error: projectError } = await tryCatch(
        () => projectService(log).getOneOrThrow(projectId),
    )
    if (projectError) {
        return mcpUtils.mcpToolError('Failed to load project', projectError)
    }

    const resolvedPieceVersion = pieceVersion ?? piece.version

    const pieceSettings: Record<string, unknown> = {
        pieceName: resolvedPieceName,
        pieceVersion: resolvedPieceVersion,
        actionName: action.name,
        input: coercedInput,
        propertySettings: {},
        errorHandlingOptions: mcpUtils.buildErrorHandlingOptions({}),
    }
    await mcpUtils.fillDefaultsForMissingOptionalProps({ settings: pieceSettings, platformId: project.platformId, log })

    const parsedAction = UpdateActionRequest.safeParse({
        type: FlowActionType.PIECE,
        name: PIECE_RUN_STEP_NAME,
        displayName: action.displayName,
        valid: true,
        settings: pieceSettings,
    })
    if (!parsedAction.success || parsedAction.data.type !== FlowActionType.PIECE) {
        const message = parsedAction.success
            ? 'expected a piece action'
            : parsedAction.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
        return { content: [{ type: 'text', text: `❌ Invalid action configuration: ${message}` }] }
    }
    const step: PieceAction = { ...parsedAction.data, lastUpdatedDate: dayjs().toISOString() }

    const { data: pieceRun, error: runError } = await tryCatch(() => pieceRunService(log).run({
        projectId,
        platformId: project.platformId,
        userId,
        source: source ?? PieceRunSource.MCP,
        step,
        connectionExternalId: effectiveExternalId,
        conversationId,
    }))
    if (runError) {
        log.error({ error: runError, project: { id: projectId } }, 'executePieceRunAction failed')
        return mcpUtils.mcpToolError('Failed to run action', runError)
    }

    if (pieceRun.status === FlowRunStatus.TIMEOUT) {
        return {
            content: [{
                type: 'text',
                text: `⏳ ${action.displayName} timed out before it finished. Run ID: ${pieceRun.id}.`,
            }],
            structuredContent: { errorSummary: 'The action timed out before it finished.' },
        }
    }

    if (pieceRun.status === FlowRunStatus.INTERNAL_ERROR) {
        return {
            content: [{
                type: 'text',
                text: `❌ ${action.displayName} failed with INTERNAL_ERROR — the engine crashed while loading or executing the piece. Run ID: ${pieceRun.id}.`,
            }],
            structuredContent: { errorSummary: 'The step couldn’t start — something went wrong loading it.' },
        }
    }

    const outcome: PieceRunOutcome = {
        succeeded: pieceRun.status === FlowRunStatus.SUCCEEDED,
        output: pieceRun.output,
        errorMessage: pieceRun.errorMessage,
    }

    // Code Mode: hand back the action's raw output payload (not the prose/offloaded summary the
    // model gets), so the in-VM code processes the FULL result. On a failed/empty run we fall
    // through to the normal formatted result so the code still sees a clear status.
    if (returnRawOutput && outcome.succeeded && outcome.output !== undefined) {
        return { rawOutput: outcome.output }
    }

    if (offload !== undefined) {
        const offloaded = await maybeOffloadLargeResult({ outcome, actionName: action.name, displayName: action.displayName, offload })
        if (offloaded !== null) {
            return offloaded
        }
    }

    const formatted = formatPieceRunActionResult({ outcome, runId: pieceRun.id, displayName: action.displayName, actionName: action.name })
    return {
        content: [{ type: 'text', text: formatted.text }],
        ...(formatted.errorSummary !== undefined ? { structuredContent: { errorSummary: formatted.errorSummary } } : {}),
    }
}

export async function executePieceRunCode({
    projectId,
    userId,
    code,
    packageJson,
    input,
    conversationId,
    source,
    log,
}: {
    projectId: string
    userId?: string
    code: string
    packageJson?: string
    input?: Record<string, unknown>
    conversationId?: string
    source?: PieceRunSource
    log: FastifyBaseLogger
}): Promise<PieceRunCodeResult> {
    const { data: project, error: projectError } = await tryCatch(
        () => projectService(log).getOneOrThrow(projectId),
    )
    if (projectError) {
        return { status: 'internal_error', errorMessage: 'Failed to load project.' }
    }

    const parsedAction = UpdateActionRequest.safeParse({
        type: FlowActionType.CODE,
        name: PIECE_RUN_STEP_NAME,
        displayName: 'Run code',
        valid: true,
        settings: {
            sourceCode: { code, packageJson: packageJson ?? '{}' },
            input: input ?? {},
            errorHandlingOptions: mcpUtils.buildErrorHandlingOptions({}),
        },
    })
    if (!parsedAction.success || parsedAction.data.type !== FlowActionType.CODE) {
        const message = parsedAction.success
            ? 'expected a code action'
            : parsedAction.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
        return { status: 'internal_error', errorMessage: `Invalid code configuration: ${message}` }
    }
    const step: CodeAction = { ...parsedAction.data, lastUpdatedDate: dayjs().toISOString() }

    const { data: pieceRun, error: runError } = await tryCatch(() => pieceRunService(log).run({
        projectId,
        platformId: project.platformId,
        userId,
        source: source ?? PieceRunSource.MCP,
        step,
        conversationId,
    }))
    if (runError) {
        log.error({ error: runError, project: { id: projectId } }, 'executePieceRunCode failed')
        return { status: 'internal_error', errorMessage: 'Failed to run code.' }
    }

    return mapCodeResult(pieceRun)
}

function mapCodeResult(run: { id: string, status: FlowRunStatus, output?: unknown, errorMessage?: string | null }): PieceRunCodeResult {
    switch (run.status) {
        case FlowRunStatus.SUCCEEDED:
            return { status: 'succeeded', runId: run.id, output: run.output }
        case FlowRunStatus.TIMEOUT:
            return { status: 'timeout', runId: run.id, errorMessage: 'Code is still running after the time limit.' }
        case FlowRunStatus.FAILED:
            return { status: 'failed', runId: run.id, errorMessage: isNil(run.errorMessage) ? 'Code failed without an error message.' : summarizeActionError(run.errorMessage) }
        default:
            return { status: 'internal_error', runId: run.id, errorMessage: isNil(run.errorMessage) ? 'The code finished without returning anything.' : run.errorMessage }
    }
}

const FORMS_PIECE_NAME = '@activepieces/piece-forms'

function buildTriggerShapeHint(trigger: Step): string {
    if (trigger.type !== FlowTriggerType.PIECE || trigger.settings.pieceName !== FORMS_PIECE_NAME) {
        return ''
    }
    const note = 'Note: the Human Input / Web Form trigger camelCases each field label to build its output key (e.g. "Full Name" → "fullName"). Reference fields as {{trigger[\'output\'].<camelCaseKey>}}, never by the original label.'
    const input = trigger.settings.input
    const formInputs = isObject(input) && Array.isArray(input.inputs) ? input.inputs : []
    const keyLines = formInputs
        .filter((field): field is { displayName: string } => isObject(field) && typeof field.displayName === 'string')
        .map((field) => `  - ${createKeyForFormInput(field.displayName)} (from "${field.displayName}")`)
    if (keyLines.length === 0) {
        return `${note}\n\n`
    }
    return `${note}\nExpected trigger output keys:\n${keyLines.join('\n')}\n\n`
}

// An empty result is the classic thrash trigger: the old note ("try broader parameters") pushed the
// agent to re-run the SAME action with looser filters. When the action was a find-one, the real fix
// is usually a different INSTRUMENT — switch to the app's list_*/search_* action — so redirect there.
function emptyResultNote(actionName?: string): string {
    const cardinality = isNil(actionName) ? 'other' : mcpUtils.classifyActionCardinality(actionName)
    if (cardinality === 'single') {
        return `Note: empty result. "${actionName}" returns a SINGLE match — if you meant to enumerate records, switch to this app's list/search action (e.g. list_records) rather than retrying this one. Otherwise confirm a connection (auth) is set and any required object/list id is resolved before treating this as "no data".`
    }
    return 'Note: empty result. Before concluding there\'s no data: confirm a connection (auth) is set and any required object/list id is resolved; if you intended to enumerate, use a list/search action. Retrying the same call with looser filters rarely helps.'
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

function summarizeActionError(errorMessage: unknown): string {
    const friendly = tryParseFriendlyPieceError(errorMessage) ?? formatPieceError(errorMessage)
    const base = friendly.apiMessage ?? friendly.message
    const withStatus = isNil(friendly.status) ? base : `${base} (${friendly.status})`
    return withStatus.length > ERROR_SUMMARY_MAX_LENGTH
        ? `${withStatus.slice(0, ERROR_SUMMARY_MAX_LENGTH)}…`
        : withStatus
}

function isHttpEnvelope(output: unknown): output is { status: number, headers?: unknown, body: unknown } {
    return isObject(output) && typeof output['status'] === 'number' && 'body' in output
}

// custom_api_call returns the full HTTP envelope { status, headers, body }. The headers
// (cloudflare/CORS/rate-limit noise) and the wrapping balloon the result and bury the data.
// Keep just the body as the payload and surface the status compactly in the summary line.
function slimCustomApiCallOutput(output: unknown): { payload: unknown, statusNote: string } {
    if (!isHttpEnvelope(output)) {
        return { payload: output, statusNote: '' }
    }
    const ok = output.status >= 200 && output.status < 300
    return { payload: output.body, statusNote: ok ? '' : ` (HTTP ${output.status})` }
}

// A large successful result (e.g. a 1.4MB Attio query) is offloaded to a file via the caller's
// handler, which returns a compact preview + fileId in place of the blob. Returns null to fall
// through to normal formatting (result small, empty, failed, or persistence declined/failed).
async function maybeOffloadLargeResult({ outcome, actionName, displayName, offload }: {
    outcome: PieceRunOutcome
    actionName: string
    displayName: string
    offload: PieceRunOffload
}): Promise<McpToolResult | null> {
    if (!outcome.succeeded) {
        return null
    }
    const { payload, statusNote } = actionName === 'custom_api_call'
        ? slimCustomApiCallOutput(outcome.output)
        : { payload: outcome.output, statusNote: '' }
    if (payload === undefined || looksEmpty(payload)) {
        return null
    }
    const { data: serialized } = tryCatchSync(() => JSON.stringify(payload))
    if (isNil(serialized)) {
        return null
    }
    const byteSize = Buffer.byteLength(serialized, 'utf8')
    if (byteSize <= offload.thresholdBytes) {
        return null
    }
    const { data: text, error } = await tryCatch(() => offload.handle({ payload, byteSize, label: displayName, statusNote }))
    if (error || isNil(text)) {
        return null
    }
    return { content: [{ type: 'text', text }] }
}

function formatPieceRunActionResult({ outcome, runId, displayName, actionName }: {
    outcome: PieceRunOutcome
    runId: string
    displayName: string
    actionName?: string
}): PieceRunActionResult {
    if (outcome.succeeded) {
        const { payload, statusNote } = actionName === 'custom_api_call'
            ? slimCustomApiCallOutput(outcome.output)
            : { payload: outcome.output, statusNote: '' }
        const outStr = payload === undefined
            ? '(no output)'
            : typeof payload === 'string' ? payload : JSON.stringify(payload)
        const base = `✅ ${displayName} completed (run ${runId})${statusNote}.\n\n${outStr}`
        if (looksEmpty(payload)) {
            return { text: `${base}\n\n${emptyResultNote(actionName)}` }
        }
        return { text: base }
    }
    const summary = isNil(outcome.errorMessage) ? 'The step failed without an error message.' : summarizeActionError(outcome.errorMessage)
    return {
        text: `❌ ${displayName} failed (run ${runId}): ${summary}\n\nRetry suggestion: Check the error above. If it mentions missing criteria, try adding a broad filter (e.g., after_date with a recent date, or a common search term). If it mentions auth, verify the connection.`,
        errorSummary: summary,
    }
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
        parts.push(`    Error: ${summarizeActionError(errorMessage)}`)
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

type PieceRunOutcome = {
    succeeded: boolean
    output: unknown
    errorMessage?: string | null
}

export type PieceRunCodeResult = {
    status: 'succeeded' | 'failed' | 'timeout' | 'internal_error'
    output?: unknown
    errorMessage?: string
    runId?: string
}

export type PieceRunOffload = {
    thresholdBytes: number
    handle: (args: { payload: unknown, byteSize: number, label: string, statusNote: string }) => Promise<string | null>
}

// The raw action output payload returned (instead of a model-facing McpToolResult) when
// executePieceRunAction is called with returnRawOutput — the full raw result a bridged caller
// consumes. Distinct shape so callers can tell it apart from a formatted/offloaded result.
export type RawPieceRunActionResult = {
    rawOutput: unknown
}

