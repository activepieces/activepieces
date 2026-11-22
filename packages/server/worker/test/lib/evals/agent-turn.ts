import { aiProviderCredentials, AIProviderName, isNil, tryCatch } from '@activepieces/core-utils'
import { AgentPhase, agentToolSkills, PersistedAgentPartType, PersistedToolCallStatus } from '@activepieces/shared'
import { activepiecesAiCost, aiUtils } from '@activepieces/server-utils'
import { LanguageModelV4StreamPart, SharedV4ProviderMetadata } from '@ai-sdk/provider'
import { hasToolCall, isLoopFinished, isStepCount, LanguageModel, StopCondition, ToolSet, wrapLanguageModel } from 'ai'
import { AgentTurnResult, runAgentTurn } from '../../../src/lib/execute/jobs/ee/agent/run-agent-turn'
import { EvalCase, RecordedToolCall } from './eval-case'
import { evalPrompts } from './prompts'
import { replay, ReplayMode, ReplayStop } from './replay'
import { MetricsRecorder, RunMetrics, runMetrics } from './run-metrics'
import { scriptedUser } from './scripted-user'
import { evalToolSet, McpTools } from './tool-set'

async function run({ evalCase, recordedToolCalls, mcp, modelId, auth, mode }: { evalCase: EvalCase, recordedToolCalls: RecordedToolCall[], mcp: McpTools, modelId: string, auth: Record<string, unknown>, mode: ReplayMode }): Promise<TurnOutcome> {
    const live = mode === 'live' ? evalCase.live : null
    const caseReplay = replay.create({ recordedToolCalls, faults: live?.faults })
    const user = isNil(live) ? null : scriptedUser.create({ answers: live.answers, listConnections: (pieceName) => evalToolSet.listConnections({ mcp, pieceName }) })
    const recorder = runMetrics.createRecorder()
    const tools = recorder.timeTools(evalToolSet.build({ mcp, caseReplay, auth, mode, user }))
    const phaseState: { phase: AgentPhase } = { phase: 'discovery' }
    const { model, costUsd } = withCost({ recorder, model: aiUtils.createModel({ credentials: aiProviderCredentials({ provider: AIProviderName.OPENROUTER, auth, config: {} }), modelId, billing: null }) })
    const warnings: string[] = []
    let steps = 0
    const timeoutMs = live?.timeoutMs ?? TURN_TIMEOUT_MS
    const startedAt = Date.now()
    const abortSignal = AbortSignal.timeout(timeoutMs)

    const { data: result, error } = await tryCatch(() => runAgentTurn({
        models: [{ model, provider: AIProviderName.OPENROUTER, modelId, thinkingBudget: TIER.thinkingBudget }],
        systemPrompt: evalPrompts.systemPrompt(),
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
                    warnings.push(`${msg}: ${String(obj['toolName'] ?? 'unknown tool')}`)
                }
            },
            error: () => {},
        },
        stopWhen: [isLoopFinished(), ...TERMINAL_DISPLAY_TOOLS.filter((toolName) => isNil(user) || !scriptedUser.answersCard(toolName)).map(hasToolCall), async () => caseReplay.stops().some(replay.endsTurn), ...gradedWindow({ evalCase })],
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
    return {
        transcript: timedOut ? `${renderTranscript(parts)}\n(the turn did not finish within ${timeoutMs / 1000}s)` : renderTranscript(parts),
        rejectedToolInputs: rejected,
        toolCalls,
        stops: caseReplay.stops(),
        newFixtures: caseReplay.newFixtures(),
        costUsd: costUsd(),
        steps,
        timedOut,
        elapsedMs: Date.now() - startedAt,
        cardsShown: user?.cardsShown() ?? [],
        metrics: recorder.summarize({ toolCalls, rejectedToolCalls: rejected.length }),
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
    const record = (providerMetadata: SharedV4ProviderMetadata | undefined): void => {
        const cost = activepiecesAiCost.openRouterCostOf(providerMetadata)
        if (cost !== undefined) {
            ledger.reported += 1
            ledger.totalUsd += cost
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
                const startedAt = Date.now()
                const result = await doGenerate()
                ledger.calls += 1
                record(result.providerMetadata)
                recorder.modelCall({ durationMs: Date.now() - startedAt, usage: result.usage })
                return result
            },
            wrapStream: async ({ doStream }) => {
                const startedAt = Date.now()
                const { stream, ...rest } = await doStream()
                ledger.calls += 1
                return {
                    ...rest,
                    stream: stream.pipeThrough(new TransformStream<LanguageModelV4StreamPart, LanguageModelV4StreamPart>({
                        transform: (chunk, controller) => {
                            if (chunk.type === 'finish') {
                                record(chunk.providerMetadata)
                                recorder.modelCall({ durationMs: Date.now() - startedAt, usage: chunk.usage })
                            }
                            controller.enqueue(chunk)
                        },
                    })),
                }
            },
        },
    })
    return { model: wrapped, costUsd: () => ledger.reported === ledger.calls ? ledger.totalUsd : null }
}

function rejectedToolParts(parts: AgentTurnResult['uiParts']): string[] {
    return parts.flatMap((part) => part.type === PersistedAgentPartType.TOOL_CALL && !isNil(part.errorText) && REJECTED_PATTERN.test(part.errorText)
        ? [`${part.toolName}: ${part.errorText.slice(0, ERROR_PREVIEW_CHARS)}`]
        : [])
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
            const output = replay.isStopOutput(part.output) ? STOPPED_RESULT : part.errorText ?? JSON.stringify(part.output ?? null)
            return [`TOOL_CALL: ${part.toolName} ${truncate(JSON.stringify(part.input))}`, `TOOL_RESULT: ${truncate(output)}`]
        }
        return []
    }).join('\n')
}

function truncate(text: string): string {
    return text.length <= TRANSCRIPT_FIELD_MAX ? text : `${text.slice(0, TRANSCRIPT_FIELD_MAX)}${TRUNCATED_MARK}`
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
const TRANSCRIPT_FIELD_MAX = 2_000
const ERROR_PREVIEW_CHARS = 160
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
}

type MintedKey = { apiKey: string, hash: string | null, provisionKey: string }

export type TurnOutcome = {
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
    metrics: RunMetrics
}

export type TurnToolCall = {
    toolName: string
    input: unknown
    output: unknown
    errorText: string | undefined
    errored: boolean
}
