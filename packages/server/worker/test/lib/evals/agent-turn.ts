import { aiProviderCredentials, AIProviderName, isNil, isObject, toError, tryCatch } from '@activepieces/core-utils'
import { AgentPhase, agentToolSkills, PersistedAgentPartType, PersistedToolCallStatus } from '@activepieces/shared'
import { activepiecesAiCost, aiUtils } from '@activepieces/server-utils'
import { LanguageModelV4StreamPart, LanguageModelV4Usage, SharedV4ProviderMetadata } from '@ai-sdk/provider'
import { hasToolCall, isLoopFinished, isStepCount, LanguageModel, StopCondition, ToolSet, wrapLanguageModel } from 'ai'
import { AgentTurnResult, runAgentTurn } from '../../../src/lib/execute/jobs/ee/agent/run-agent-turn'
import { EvalCase, RecordedToolCall } from './eval-case'
import { evalPrompts } from './prompts'
import { replay, ReplayMode, ReplayStop } from './replay'
import { MetricsRecorder, RunMetrics, runMetrics } from './run-metrics'
import { scriptedUser } from './scripted-user'
import { SeededState } from './seed'
import { evalToolSet, McpTools } from './tool-set'

async function run({ evalCase, recordedToolCalls, mcp, modelId, auth, mode, seeded = null }: { evalCase: EvalCase, recordedToolCalls: RecordedToolCall[], mcp: McpTools, modelId: string, auth: Record<string, unknown>, mode: ReplayMode, seeded?: SeededState | null }): Promise<TurnOutcome> {
    const live = mode === 'live' ? evalCase.live : null
    const before = isNil(seeded) ? '' : await renderSeeded({ mcp, seeded })
    const caseReplay = replay.create({ recordedToolCalls, faults: live?.faults })
    const user = isNil(live) ? null : scriptedUser.create({ answers: live.answers, listConnections: (pieceName) => evalToolSet.listConnections({ mcp, pieceName }), projectId: mcp.projectId })
    const recorder = runMetrics.createRecorder()
    const notes: string[] = []
    const tools = recorder.timeTools(evalToolSet.build({ mcp, caseReplay, auth, mode, user, onNote: (note) => {
        notes.push(note)
    } }))
    const phaseState: { phase: AgentPhase } = { phase: 'discovery' }
    const { model, costUsd } = withCost({ recorder, model: aiUtils.createModel({ credentials: aiProviderCredentials({ provider: AIProviderName.OPENROUTER, auth, config: {} }), modelId, billing: null }) })
    const warnings: string[] = []
    let steps = 0
    const timeoutMs = live?.timeoutMs ?? TURN_TIMEOUT_MS
    const startedAt = Date.now()
    const abortSignal = AbortSignal.timeout(timeoutMs)
    const replayEnded: StopCondition<ToolSet> = async () => caseReplay.stops().some(replay.endsTurn)
    const stopWhen: StopCondition<ToolSet>[] = [
        isLoopFinished(),
        ...TERMINAL_DISPLAY_TOOLS.filter((toolName) => isNil(user) || !scriptedUser.answersCard(toolName)).map((toolName) => hasToolCall<ToolSet>(toolName)),
        replayEnded,
        ...gradedWindow({ evalCase }),
    ]

    const { data: result, error } = await tryCatch(() => runAgentTurn({
        models: [{ model, provider: AIProviderName.OPENROUTER, modelId, thinkingBudget: TIER.thinkingBudget }],
        systemPrompt: evalPrompts.systemPrompt({ project: evalToolSet.projectOf({ mcp, mode }) }),
        messages: evalCase.messages,
        tools,
        allToolNames: Object.keys(tools),
        tier: { ...TIER, modelId },
        phaseState,
        skills: { surface: 'CHAT', guides: evalPrompts.guides(), preloaded: evalCase.preloadedSkills },
        abortSignal,
        onStepModel: () => {
            steps += 1
        },
        log: {
            debug: () => {},
            info: () => {},
            warn: (obj, msg) => {
                if (REJECTION_WARNINGS.has(msg)) {
                    warnings.push(rejectionLine({ toolName: String(obj['toolName'] ?? 'unknown tool'), reason: isNil(obj['error']) ? msg : `${msg}: ${toError(obj['error']).message}`, input: obj['input'] }))
                }
            },
            error: () => {},
        },
        stopWhen,
    }))

    const timedOut = abortSignal.aborted
    if (timedOut && isNil(live)) {
        throw new Error(`The turn did not finish within ${timeoutMs / 1000}s`)
    }
    if (isNil(result) && !timedOut) {
        throw new Error(`The turn produced no output: ${error instanceof Error ? error.message : String(error)}`)
    }
    const parts = result?.uiParts ?? []
    if (parts.length === 0 && !timedOut) {
        throw new Error(`The turn produced nothing (finish reason "${result?.finishReason}"): ${result?.streamError?.message ?? 'no error reported'}`)
    }
    const rejected = [...warnings, ...rejectedToolParts(parts)]
    const toolCalls = turnToolCalls(parts)
    const transcript = timedOut ? `${renderTranscript(parts)}\n(the turn did not finish within ${timeoutMs / 1000}s)` : renderTranscript(parts)
    const elapsedMs = Date.now() - startedAt
    const metrics = recorder.summarize({ toolCalls, rejectedToolCalls: rejected.length })
    const flowsAfter = isNil(live) ? '' : await renderFlowsAfter({ mcp, toolCalls })
    return {
        before,
        transcript: `${transcript}${flowsAfter}`,
        rejectedToolInputs: rejected,
        toolCalls,
        stops: caseReplay.stops(),
        newFixtures: caseReplay.newFixtures(),
        costUsd: costUsd(),
        steps,
        timedOut,
        elapsedMs,
        cardsShown: user?.cardsShown() ?? [],
        declinedPieces: user?.declinedPieces() ?? [],
        notes: [...notes],
        metrics,
    }
}

function gradedWindow({ evalCase }: { evalCase: EvalCase }): StopCondition<ToolSet>[] {
    if (isNil(evalCase.cutBeforeStep)) {
        return []
    }
    const targetTool = evalCase.targetTool
    if (isNil(targetTool)) {
        return [isStepCount(1)]
    }
    const reachedTarget: StopCondition<ToolSet> = async ({ steps }) => steps.some((step) => step.toolCalls.some((call) => agentToolSkills.effectiveToolCall({ toolName: call.toolName, input: call.input }).toolName === targetTool))
    return [reachedTarget, isStepCount(MAX_STEPS_TO_TARGET)]
}

function withCost({ model, recorder }: { model: LanguageModel, recorder: MetricsRecorder }): { model: LanguageModel, costUsd: () => number | null } {
    if (typeof model === 'string') {
        throw new Error(`Expected a model instance for ${model}`)
    }
    const ledger = { calls: 0, reported: 0, totalUsd: 0 }
    const startCall = (): { settle: (outcome: { usage: LanguageModelV4Usage | null, providerMetadata: SharedV4ProviderMetadata | undefined }) => void } => {
        const startedAt = Date.now()
        let settled = false
        ledger.calls += 1
        return {
            settle: ({ usage, providerMetadata }) => {
                if (settled) {
                    return
                }
                settled = true
                const cost = activepiecesAiCost.openRouterCostOf(providerMetadata)
                if (cost !== undefined) {
                    ledger.reported += 1
                    ledger.totalUsd += cost
                }
                recorder.modelCall({ durationMs: Date.now() - startedAt, usage })
            },
        }
    }
    const wrapped = wrapLanguageModel({
        model,
        middleware: {
            transformParams: async ({ params }) => ({
                ...params,
                providerOptions: {
                    ...params.providerOptions,
                    openrouter: { ...params.providerOptions?.['openrouter'], usage: { include: true } },
                },
            }),
            wrapGenerate: async ({ doGenerate }) => {
                const call = startCall()
                const { data, error } = await tryCatch(async () => doGenerate())
                if (isNil(data)) {
                    call.settle({ usage: null, providerMetadata: undefined })
                    throw error
                }
                call.settle({ usage: data.usage, providerMetadata: data.providerMetadata })
                return data
            },
            wrapStream: async ({ doStream }) => {
                const call = startCall()
                const { data, error } = await tryCatch(async () => doStream())
                if (isNil(data)) {
                    call.settle({ usage: null, providerMetadata: undefined })
                    throw error
                }
                const { stream, ...rest } = data
                const reader = stream.getReader()
                return {
                    ...rest,
                    stream: new ReadableStream<LanguageModelV4StreamPart>({
                        pull: async (controller) => {
                            const { data: chunk, error: readError } = await tryCatch(() => reader.read())
                            if (isNil(chunk)) {
                                call.settle({ usage: null, providerMetadata: undefined })
                                controller.error(readError)
                                return
                            }
                            if (chunk.done) {
                                call.settle({ usage: null, providerMetadata: undefined })
                                controller.close()
                                return
                            }
                            if (chunk.value.type === 'finish') {
                                call.settle({ usage: chunk.value.usage, providerMetadata: chunk.value.providerMetadata })
                            }
                            controller.enqueue(chunk.value)
                        },
                        cancel: async (reason) => {
                            call.settle({ usage: null, providerMetadata: undefined })
                            await reader.cancel(reason)
                        },
                    }),
                }
            },
        },
    })
    return { model: wrapped, costUsd: () => ledger.reported === ledger.calls ? ledger.totalUsd : null }
}

function rejectedToolParts(parts: AgentTurnResult['uiParts']): string[] {
    return parts.flatMap((part) => part.type === PersistedAgentPartType.TOOL_CALL && !isNil(part.errorText) && REJECTED_PATTERN.test(part.errorText)
        ? [rejectionLine({ toolName: part.toolName, reason: part.errorText, input: part.input })]
        : [])
}

function rejectionLine({ toolName, reason, input }: { toolName: string, reason: string, input: unknown }): string {
    const [summary] = reason.split(SCHEMA_DUMP_MARK)
    return `${toolName}: ${summary}, input: ${typeof input === 'string' ? input : JSON.stringify(input ?? null)}`
}

function turnToolCalls(parts: AgentTurnResult['uiParts']): TurnToolCall[] {
    return parts.flatMap((part) => part.type === PersistedAgentPartType.TOOL_CALL
        ? [{ toolName: part.toolName, input: part.input, output: part.output, errorText: part.errorText, errored: part.status === PersistedToolCallStatus.ERROR }]
        : [])
}

function renderTranscript(parts: AgentTurnResult['uiParts']): string {
    return parts.flatMap((part) => {
        if (part.type === PersistedAgentPartType.TEXT) {
            return [`ASSISTANT: ${part.text}`]
        }
        if (part.type === PersistedAgentPartType.TOOL_CALL) {
            const { toolName } = agentToolSkills.effectiveToolCall({ toolName: part.toolName, input: part.input })
            const output = replay.isStopOutput(part.output) ? STOPPED_RESULT : part.errorText ?? part.output
            return [toolCallLine({ toolName: part.toolName, input: part.input }), toolResultLine({ toolName, output })]
        }
        return []
    }).join('\n')
}

function toolCallLine({ toolName, input }: { toolName: string, input: unknown }): string {
    const call = agentToolSkills.effectiveToolCall({ toolName, input })
    return `TOOL_CALL: ${call.toolName} ${cutIfLive({ toolName: call.toolName, text: JSON.stringify(call.input ?? null) })}`
}

function toolResultLine({ toolName, output }: { toolName: string, output: unknown }): string {
    return `TOOL_RESULT: ${cutIfLive({ toolName, text: resultText(output) })}`
}

function resultText(output: unknown): string {
    if (typeof output === 'string') {
        return output
    }
    if (isObject(output) && output['isError'] !== true && !isNil(output['structuredContent'])) {
        return JSON.stringify(output['structuredContent'])
    }
    return contentText(isObject(output) ? output['content'] : output) ?? JSON.stringify(output ?? null)
}

function contentText(content: unknown): string | null {
    if (!Array.isArray(content)) {
        return null
    }
    const texts = content.flatMap((item) => isObject(item) && typeof item['text'] === 'string' ? [item['text']] : [])
    return texts.length === 0 ? null : texts.join('\n')
}

function cutIfLive({ toolName, text }: { toolName: string, text: string }): string {
    if (!replay.isLive(toolName) || text.length <= LIVE_TOOL_FIELD_MAX) {
        return text
    }
    return `${text.slice(0, LIVE_TOOL_FIELD_MAX)}${TRUNCATED_MARK}`
}

async function renderFlowsAfter({ mcp, toolCalls }: { mcp: McpTools, toolCalls: TurnToolCall[] }): Promise<string> {
    const rendered = await renderFlows({ mcp, flowIds: changedFlowIds(toolCalls) })
    return rendered.length === 0 ? '' : `\n${FLOWS_AFTER_MARK}\n${rendered.join('\n')}`
}

async function renderSeeded({ mcp, seeded }: { mcp: McpTools, seeded: SeededState }): Promise<string> {
    if (seeded.flows.length === 0 && seeded.tables.length === 0) {
        return ''
    }
    const flowLines = seeded.flows.map((flow) => `flow "${flow.name}" (id: ${flow.id})`)
    const tableLines = seeded.tables.map((table) => `table "${table.name}" (id: ${table.id}, ${table.records} record(s))`)
    const structures = await renderFlows({ mcp, flowIds: seeded.flows.map((flow) => flow.id) })
    return `${SEEDED_MARK}\n${[...flowLines, ...tableLines, ...structures].join('\n')}\n`
}

async function renderFlows({ mcp, flowIds }: { mcp: McpTools, flowIds: string[] }): Promise<string[]> {
    const execute = mcp.toolSet[FLOW_STRUCTURE_TOOL]?.execute
    if (isNil(execute) || flowIds.length === 0) {
        return []
    }
    const flows = await Promise.all(flowIds.map(async (flowId) => {
        const { data } = await tryCatch(async () => execute({ flowId }, { toolCallId: FLOW_STRUCTURE_TOOL, messages: [], context: {} }))
        const isError = isNil(data) || (isObject(data) && data['isError'] === true)
        return isError ? [] : [`FLOW ${flowId}:\n${isObject(data) ? contentText(data['content']) ?? resultText(data) : resultText(data)}`]
    }))
    return flows.flat()
}

function changedFlowIds(toolCalls: TurnToolCall[]): string[] {
    return [...new Set(toolCalls.flatMap(changedFlowIdsOf))]
}

function changedFlowIdsOf(call: TurnToolCall): string[] {
    const { toolName, input } = agentToolSkills.effectiveToolCall({ toolName: call.toolName, input: call.input })
    if (call.errored || replay.isStopOutput(call.output)) {
        return []
    }
    const structured = isObject(call.output) && isObject(call.output['structuredContent']) ? call.output['structuredContent'] : {}
    const fromOutput = typeof structured['flowId'] === 'string' ? [structured['flowId']] : []
    if (CREATE_FLOW_TOOLS.has(toolName)) {
        return fromOutput
    }
    if (toolName === DUPLICATE_FLOW_TOOL) {
        return fromOutput.length > 0 || !succeeded(call) ? fromOutput : duplicatedFlowId(call)
    }
    if (!EDIT_FLOW_TOOLS.has(toolName) || !succeeded(call)) {
        return []
    }
    return isObject(input) && typeof input['flowId'] === 'string' ? [input['flowId']] : []
}

function succeeded(call: TurnToolCall): boolean {
    const { output } = call
    if (evalToolSet.readResult(output).failed) {
        return false
    }
    return !(isObject(output) && (!isNil(output['error']) || output['success'] === false))
}

function duplicatedFlowId(call: TurnToolCall): string[] {
    const text = contentText(isObject(call.output) ? call.output['content'] : null) ?? ''
    const copyLine = text.split('\n').map((line) => line.trim()).find((line) => line.startsWith(DUPLICATE_COPY_PREFIX))
    const copyId = copyLine?.match(TRAILING_ID_PATTERN)?.[1]
    return isNil(copyId) ? [] : [copyId]
}

async function resolveAuth(): Promise<Record<string, unknown>> {
    const inferenceKey = process.env[OPENROUTER_INFERENCE_ENV]
    if (!isNil(inferenceKey) && inferenceKey.length > 0) {
        return { apiKey: inferenceKey }
    }
    const provisionKey = process.env[OPENROUTER_PROVISION_ENV]
    if (isNil(provisionKey) || provisionKey.length === 0) {
        throw new Error(`No OpenRouter key found. Set ${OPENROUTER_INFERENCE_ENV} or ${OPENROUTER_PROVISION_ENV} in .env.dev.`)
    }
    mintedKey = mintedKey ?? mintInferenceKey({ provisionKey })
    return { apiKey: (await mintedKey).apiKey }
}

async function cleanupAuth(): Promise<void> {
    const minted = isNil(mintedKey) ? null : await mintedKey.catch(() => null)
    mintedKey = null
    if (isNil(minted) || isNil(minted.hash)) {
        return
    }
    await tryCatch(() => fetch(`${OPENROUTER_BASE_URL}/keys/${minted.hash}`, { method: 'DELETE', headers: { Authorization: `Bearer ${minted.provisionKey}` } }))
}

async function mintInferenceKey({ provisionKey }: { provisionKey: string }): Promise<MintedKey> {
    const res = await fetch(`${OPENROUTER_BASE_URL}/keys`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${provisionKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'activepieces-evals (ephemeral)', limit: MINTED_KEY_LIMIT_USD }),
    })
    if (!res.ok) {
        throw new Error(`OpenRouter could not mint an inference key from ${OPENROUTER_PROVISION_ENV}: ${res.status} ${await res.text()}`)
    }
    const body: { key: string, data?: { hash?: string } } = await res.json()
    return { apiKey: body.key, hash: body.data?.hash ?? null, provisionKey }
}

let mintedKey: Promise<MintedKey> | null = null

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'
const OPENROUTER_INFERENCE_ENV = 'OPENROUTER_API_KEY'
const OPENROUTER_PROVISION_ENV = 'AP_OPENROUTER_PROVISION_KEY'
const MINTED_KEY_LIMIT_USD = 25
const TURN_TIMEOUT_MS = 5 * 60_000
const LIVE_TOOL_FIELD_MAX = 2_000
const FLOW_STRUCTURE_TOOL = 'ap_flow_structure'
const DUPLICATE_FLOW_TOOL = 'ap_duplicate_flow'
const CREATE_FLOW_TOOLS = new Set(['ap_build_flow', 'ap_create_flow'])
const EDIT_FLOW_TOOLS = new Set([
    'ap_add_branch',
    'ap_add_step',
    'ap_apply_flow_operations',
    'ap_delete_branch',
    'ap_delete_step',
    'ap_manage_notes',
    'ap_move_flow_to_folder',
    'ap_rename_flow',
    'ap_update_branch',
    'ap_update_step',
    'ap_update_trigger',
])
const DUPLICATE_COPY_PREFIX = 'Copy:'
const TRAILING_ID_PATTERN = /\(id: ([A-Za-z0-9_-]+)\)$/
const SEEDED_MARK = '--- SEEDED BEFORE THE TURN (the test harness created these in the project before the user message; compare them with the flows after the turn) ---'
const FLOWS_AFTER_MARK = '--- FLOWS AFTER THE TURN (read by the test harness once the turn ended) ---'
const SCHEMA_DUMP_MARK = '\nInput schema:'
const STOPPED_RESULT = '(not run: this is a replayed test, writes never run and the test ends the turn here)'
const TRUNCATED_MARK = '… (the test cut this text short, the real call was complete)'
const TIER = { id: 'smart', thinkingBudget: 10_000 }
const MAX_STEPS_TO_TARGET = 5
const TERMINAL_DISPLAY_TOOLS = ['ap_show_questions', 'ap_show_quick_replies', 'ap_show_connection_picker', 'ap_show_connection_required', 'ap_show_project_picker']
const REJECTION_WARNINGS = new Set(['Repairing malformed tool call', 'Model called a tool that is not active in this phase'])
const REJECTED_PATTERN = /Invalid input|InvalidToolInput|There is no tool named|Pass the tool name as/

export const evalAgentTurn = {
    run,
    resolveAuth,
    cleanupAuth,
    withCost,
    toolCallLine,
    toolResultLine,
    changedFlowIds,
}

type MintedKey = { apiKey: string, hash: string | null, provisionKey: string }

export type TurnOutcome = {
    before: string
    transcript: string
    rejectedToolInputs: string[]
    toolCalls: TurnToolCall[]
    stops: ReplayStop[]
    newFixtures: RecordedToolCall[]
    costUsd: number | null
    steps: number
    timedOut: boolean
    elapsedMs: number
    cardsShown: string[]
    declinedPieces: string[]
    notes: string[]
    metrics: RunMetrics
}

export type TurnToolCall = {
    toolName: string
    input: unknown
    output: unknown
    errorText: string | undefined
    errored: boolean
}
