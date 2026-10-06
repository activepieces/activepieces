import { AIProviderName, isNil, isObject, omit, tryCatch } from '@activepieces/core-utils'
import { AgentPhase, BeginAgentTaskResponse, chatBilling, FinishAgentTaskRequest, PersistedAgentPart, PersistedAgentPartType, PersistedToolCallStatus, SubagentActivity, SubagentTaskArtifact, SubagentTimelineEntry, TASK_COMPLETION_TOOL_NAME } from '@activepieces/shared'
import { hasToolCall, isLoopFinished, LanguageModel, ModelMessage, tool, ToolSet } from 'ai'
import { z } from 'zod'
import { AgentTurnResult, runAgentTurn, RunAgentTurnParams } from '../run-agent-turn'
import { createPhaseTools } from './session-tools'
import { taskContext } from './task-context'
import { AgentEventEmitter } from './tool-primitives'

export function createTaskSubagentTools({ tools, taskPrompt, ...rest }: Omit<TaskDeps, 'workerTools' | 'taskPrompt'> & {
    tools: ToolSet
    taskPrompt: string | undefined
}): ToolSet {
    if (isNil(taskPrompt)) {
        return {}
    }
    const deps: TaskDeps = {
        ...rest,
        taskPrompt,
        workerTools: Object.fromEntries(Object.entries(tools).filter(([name]) => !NOT_FOR_TASKS.includes(name))),
    }
    return {
        [TASK_TOOL_NAME]: tool({
            description: 'Hand one self-contained goal to a focused sub-agent with its own fresh context and the same tools you have (read, search, build, update, execute; risky actions still ask the user for approval). Use it when it buys something: goals that can run in parallel (several calls in one step run at once), like the separate flows of a multi-flow solution; or noisy preparation with a short answer (going through many records or runs, investigating a failure). Build a single flow and make small edits yourself. It cannot ask the user anything: when it needs something only the user can give it finishes as blocked and says what. Pass taskId to continue a task you started earlier in this conversation (after a block, or for a follow-up on what it built).',
            inputSchema: taskInput,
            toModelOutput: ({ output }) => ({ type: 'text', value: JSON.stringify(omit(output, ['activity', 'billedToolCalls'])) }),
            execute: async ({ title, brief, taskId }, { toolCallId }) => runTask({ deps, title, brief, taskId, progressId: toolCallId }),
        }),
    }
}

async function runTask({ deps, title, brief, taskId, progressId }: {
    deps: TaskDeps
    title: string
    brief: string
    taskId?: string
    progressId: string
}): Promise<TaskRunOutput> {
    const { workerTools, model, provider, tier, modelId, taskPrompt, creditsLeftFor, beginTask, finishTask, eventEmitter, abortSignal, log } = deps
    if (abortSignal.aborted) {
        return { status: 'failed', summary: 'Stopped before it started.' }
    }
    const { data: begun, error } = await tryCatch(() => beginTask({ title, ...(isNil(taskId) ? {} : { taskId }) }))
    if (error || isNil(begun)) {
        return { status: 'failed', summary: `Could not start this task: ${error instanceof Error ? error.message : 'unknown error'}` }
    }
    const startedAt = new Date()
    const report = (activity: SubagentActivity) => eventEmitter.emitSubagentProgress({ toolCallId: progressId, data: { ...activity, taskId: begun.taskId } })
    report({ title, status: 'running', stepCount: 0, startedAt: startedAt.toISOString() })
    const finish: { result?: TaskResult } = {}
    const priorMessages = begun.messages.filter(isModelMessage)
    const messages: ModelMessage[] = [...priorMessages, { role: 'user', content: brief }]
    const phaseState: { phase: AgentPhase } = { phase: 'build' }
    const taskTools = {
        ...workerTools,
        ...createPhaseTools({ onPhaseChange: (phase) => {
            phaseState.phase = phase
        } }),
        ...finishTool(finish),
    }
    const turnParams: RunAgentTurnParams = {
        model,
        provider,
        systemPrompt: taskPrompt,
        messages,
        tools: taskTools,
        allToolNames: Object.keys(taskTools),
        tier,
        modelId,
        phaseState,
        abortSignal,
        log,
        creditsLeft: creditsLeftFor(progressId),
        stopWhen: [isLoopFinished(), hasToolCall(TASK_COMPLETION_TOOL_NAME)],
        sinks: {
            drainStream: async (result) => {
                await result.consumeStream()
            },
            onProgress: ({ uiParts }) => report(runningActivity({ title, uiParts, startedAt })),
        },
    }
    const workTurn = await workUntilSettled({ title, turnParams, finished: () => !isNil(finish.result) })
    const turn = isNil(finish.result) && endedCleanly({ turn: workTurn, abortSignal })
        ? await continueTurn({ title, turnParams, previous: workTurn, request: REPORT_REQUEST, overrides: { tools: finishTool(finish), allToolNames: [TASK_COMPLETION_TOOL_NAME], stepCeiling: 1 } })
        : workTurn
    const result = finish.result ?? fallbackResult(turn)
    const activity = finalActivity({ title, turn, result, startedAt })
    await saveTaskResult({
        finishTask,
        log,
        request: {
            taskId: begun.taskId,
            claimId: begun.claimId,
            status: STATUS_BY_RESULT[result.status],
            messages: [...messages, ...turn.accumulatedResponseMessages],
            summary: result.summary,
            artifacts: result.artifacts,
        },
    })
    report(activity)
    return {
        taskId: begun.taskId,
        status: result.status,
        summary: result.summary,
        artifacts: result.artifacts,
        ...(isNil(result.needs) ? {} : { needs: result.needs }),
        activity,
        billedToolCalls: billedToolCalls(turn.uiParts),
    }
}

async function saveTaskResult({ finishTask, log, request }: {
    finishTask: TaskDeps['finishTask']
    log: TaskDeps['log']
    request: Omit<FinishAgentTaskRequest, 'platformId' | 'conversationId'>
}): Promise<void> {
    const { error } = await tryCatch(() => finishTask(request))
    if (isNil(error)) {
        return
    }
    const { error: retryError } = await tryCatch(() => finishTask(request))
    if (!isNil(retryError)) {
        log.error({ error: retryError, task: { id: request.taskId } }, '[taskSubagent] Could not save the task result, so it cannot be resumed')
    }
}

async function workUntilSettled({ title, turnParams, finished }: {
    title: string
    turnParams: RunAgentTurnParams
    finished: () => boolean
}): Promise<AgentTurnResult> {
    const first = await taskContext.run({ title, fn: () => runAgentTurn(turnParams) })
    return continueAfterInterruptions({ title, turnParams, finished, turn: first, continuationsLeft: MAX_CONTINUATIONS })
}

async function continueAfterInterruptions({ title, turnParams, finished, turn, continuationsLeft }: {
    title: string
    turnParams: RunAgentTurnParams
    finished: () => boolean
    turn: AgentTurnResult
    continuationsLeft: number
}): Promise<AgentTurnResult> {
    const shouldContinue = !finished() && continuationsLeft > 0 && interruptedTransiently({ turn, abortSignal: turnParams.abortSignal })
    if (!shouldContinue) {
        return turn
    }
    const continued = await continueTurn({ title, turnParams, previous: turn, request: CONTINUE_REQUEST, overrides: {} })
    return continueAfterInterruptions({ title, turnParams, finished, turn: continued, continuationsLeft: continuationsLeft - 1 })
}

async function continueTurn({ title, turnParams, previous, request, overrides }: {
    title: string
    turnParams: RunAgentTurnParams
    previous: AgentTurnResult
    request: string
    overrides: Partial<RunAgentTurnParams>
}): Promise<AgentTurnResult> {
    const requestMessage: ModelMessage = { role: 'user', content: request }
    const next = await taskContext.run({
        title,
        fn: () => runAgentTurn({
            ...turnParams,
            ...overrides,
            messages: [...turnParams.messages, ...previous.accumulatedResponseMessages, requestMessage],
            priorToolCalls: [...(turnParams.priorToolCalls ?? []), ...billedToolCalls(previous.uiParts)],
            sinks: withEarlierParts({ sinks: turnParams.sinks, earlierParts: previous.uiParts }),
        }),
    })
    return {
        ...next,
        uiParts: [...previous.uiParts, ...next.uiParts],
        accumulatedResponseMessages: [...previous.accumulatedResponseMessages, requestMessage, ...next.accumulatedResponseMessages],
    }
}

function withEarlierParts({ sinks, earlierParts }: { sinks: RunAgentTurnParams['sinks'], earlierParts: PersistedAgentPart[] }): RunAgentTurnParams['sinks'] {
    if (isNil(sinks)) {
        return sinks
    }
    const onProgress = sinks.onProgress
    return {
        ...sinks,
        ...(isNil(onProgress) ? {} : { onProgress: (progress: Parameters<typeof onProgress>[0]) => onProgress({ ...progress, uiParts: [...earlierParts, ...progress.uiParts] }) }),
    }
}

function interruptedTransiently({ turn, abortSignal }: { turn: AgentTurnResult, abortSignal: AbortSignal }): boolean {
    return !abortSignal.aborted && !outOfBudget(turn) && (turn.streamError !== null || turn.truncatedAfterRetries)
}

function endedCleanly({ turn, abortSignal }: { turn: AgentTurnResult, abortSignal: AbortSignal }): boolean {
    return !abortSignal.aborted && turn.streamError === null && !outOfBudget(turn)
}

function outOfBudget(turn: AgentTurnResult): boolean {
    return turn.creditsExhausted || turn.budgetExceeded
}

function finishTool(finish: { result?: TaskResult }): ToolSet {
    return {
        [TASK_COMPLETION_TOOL_NAME]: tool({
            description: 'Call this exactly once, as your last action, to hand your result back. status: done when the goal is achieved, blocked when only the user can unblock you (say what in needs), failed when you tried and could not. summary: a few plain sentences the main assistant can relay. artifacts: only what you created or changed (flows, tables, records, agents) with ids and names, empty when you only read.',
            inputSchema: taskResult,
            execute: async (result) => {
                finish.result = result
                return { content: [{ type: 'text', text: 'Result recorded.' }] }
            },
        }),
    }
}

function fallbackResult(turn: AgentTurnResult): TaskResult {
    const lastMessage = lastText(turn.uiParts)
    return {
        status: 'failed',
        summary: lastMessage.length > 0 ? lastMessage : 'The task stopped without reporting a result. Check its work before relying on it.',
        artifacts: [],
    }
}

function runningActivity({ title, uiParts, startedAt }: { title: string, uiParts: PersistedAgentPart[], startedAt: Date }): SubagentActivity {
    const timeline = timelineFrom(uiParts)
    const statuses = timeline.flatMap((entry) => entry.kind === 'status' ? [entry.text] : [])
    return {
        title,
        status: 'running',
        statusLine: statuses[statuses.length - 1],
        timeline,
        stepCount: uiParts.filter((part) => part.type === PersistedAgentPartType.TOOL_CALL).length,
        pieces: piecesFrom(uiParts),
        startedAt: startedAt.toISOString(),
    }
}

function finalActivity({ title, turn, result, startedAt }: { title: string, turn: AgentTurnResult, result: TaskResult, startedAt: Date }): SubagentActivity {
    const stoppedEarly = turn.streamError !== null || outOfBudget(turn) || turn.truncatedAfterRetries
    return {
        ...runningActivity({ title, uiParts: turn.uiParts, startedAt }),
        status: stoppedEarly ? 'failed' : result.status,
        artifacts: result.artifacts,
        summary: result.summary,
        ...(isNil(result.needs) ? {} : { needs: result.needs }),
        durationMs: Date.now() - startedAt.getTime(),
    }
}

function timelineFrom(parts: PersistedAgentPart[]): SubagentTimelineEntry[] {
    return parts.flatMap((part): SubagentTimelineEntry[] => {
        if (part.type !== PersistedAgentPartType.THINKING_STATUS) {
            return []
        }
        const text = part.text.trim()
        return text.length > 0 ? [{ kind: 'status', text }] : []
    })
}

function billedToolCalls(parts: PersistedAgentPart[]): { toolName: string, output: unknown }[] {
    return parts.flatMap((part) => part.type === PersistedAgentPartType.TOOL_CALL && part.status === PersistedToolCallStatus.COMPLETED && chatBilling.isFlatBilledToolCall({ toolName: part.toolName, output: part.output })
        ? [{ toolName: part.toolName, output: billingOutput(part.output) }]
        : [])
}

function billingOutput(output: unknown): Record<string, unknown> {
    return isObject(output) && output['billedAtCost'] === true ? { billedAtCost: true } : {}
}

function piecesFrom(parts: PersistedAgentPart[]): string[] {
    const names = parts.flatMap((part) => part.type === PersistedAgentPartType.TOOL_CALL ? pieceNamesIn(part.input) : [])
    return [...new Set(names)]
}

function pieceNamesIn(input: unknown): string[] {
    if (!isObject(input)) {
        return []
    }
    const own = typeof input['pieceName'] === 'string' ? [input['pieceName']] : []
    const trigger = pieceNamesIn(input['trigger'])
    const steps = Array.isArray(input['steps']) ? input['steps'].flatMap(pieceNamesIn) : []
    return [...trigger, ...own, ...steps]
}

function lastText(parts: PersistedAgentPart[]): string {
    const texts = parts.flatMap((part) => part.type === PersistedAgentPartType.TEXT && part.text.trim().length > 0 ? [part.text.trim()] : [])
    return texts[texts.length - 1] ?? ''
}

function isModelMessage(value: unknown): value is ModelMessage {
    return isObject(value) && typeof value['role'] === 'string' && 'content' in value
}

const taskInput = z.object({
    title: z.string().min(1).describe('A short plain name for the task the user will see, e.g. "Build Save order" or "Research Twilio WhatsApp"'),
    brief: z.string().min(1).describe('Everything the sub-agent needs, self-contained: the goal and when it is done, what it owns (and must not change), ids and decisions already made, connections to use. For a resumed task, the new instruction or the user\'s answer.'),
    taskId: z.string().optional().describe('Continue a task from earlier in this conversation instead of starting a new one'),
})

const taskResult = z.object({
    status: z.enum(['done', 'blocked', 'failed']),
    summary: z.string().describe('A few plain sentences: what you did and what the main assistant should tell the user'),
    artifacts: z.array(SubagentTaskArtifact).describe('Only what you created or changed. Empty when you only read.'),
    needs: z.string().optional().describe('When blocked: exactly what you need from the user'),
})

const STATUS_BY_RESULT: Record<TaskResult['status'], FinishAgentTaskRequest['status']> = {
    done: 'DONE',
    blocked: 'BLOCKED',
    failed: 'FAILED',
}

const TASK_TOOL_NAME = 'ap_run_task'
const REPORT_REQUEST = `You stopped without reporting. Call ${TASK_COMPLETION_TOOL_NAME} now with your result.`
const CONTINUE_REQUEST = 'You were cut off. Continue from where you stopped.'
const MAX_CONTINUATIONS = 2

const NOT_FOR_TASKS = [
    TASK_TOOL_NAME,
    'ap_show_questions',
    'ap_show_quick_replies',
    'ap_show_connection_picker',
    'ap_show_connection_required',
    'ap_show_project_picker',
    'ap_show_mcp_reconnect',
    'ap_show_showcase',
    'ap_set_build_plan',
    'ap_select_project',
    'ap_deselect_project',
    'ap_remember',
    'ap_generate_image',
    'ap_test_flow',
    'ap_test_step',
    'ap_lock_and_publish',
    'ap_change_flow_status',
]

type TaskResult = z.infer<typeof taskResult>

type TaskDeps = {
    workerTools: ToolSet
    model: LanguageModel
    provider: AIProviderName
    tier: RunAgentTurnParams['tier']
    modelId: string
    taskPrompt: string
    creditsLeftFor: (runKey: string) => RunAgentTurnParams['creditsLeft']
    beginTask: (input: { title: string, taskId?: string }) => Promise<BeginAgentTaskResponse>
    finishTask: (input: Omit<FinishAgentTaskRequest, 'platformId' | 'conversationId'>) => Promise<void>
    eventEmitter: AgentEventEmitter
    abortSignal: AbortSignal
    log: RunAgentTurnParams['log']
}

type TaskRunOutput = {
    taskId?: string
    status: TaskResult['status']
    summary: string
    artifacts?: TaskResult['artifacts']
    needs?: string
    activity?: SubagentActivity
    billedToolCalls?: { toolName: string, output: unknown }[]
}
