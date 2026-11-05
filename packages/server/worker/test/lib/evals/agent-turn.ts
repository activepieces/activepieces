import { aiProviderCredentials, AIProviderName, isNil, tryCatch } from '@activepieces/core-utils'
import { AgentPhase, agentToolSkills, PersistedAgentPartType } from '@activepieces/shared'
import { activepiecesAiCost, aiUtils } from '@activepieces/server-utils'
import { LanguageModelV4StreamPart, SharedV4ProviderMetadata } from '@ai-sdk/provider'
import { hasToolCall, isLoopFinished, isStepCount, LanguageModel, StopCondition, ToolSet, wrapLanguageModel } from 'ai'
import { AgentTurnResult, runAgentTurn } from '../../../src/lib/execute/jobs/ee/agent/run-agent-turn'
import { EvalCase, RecordedToolCall } from './eval-case'
import { evalPrompts } from './prompts'
import { replay, ReplayStop } from './replay'
import { evalToolSet } from './tool-set'

async function run({ evalCase, mcpToolSet, modelId, auth, recordMode }: { evalCase: EvalCase, mcpToolSet: ToolSet, modelId: string, auth: Record<string, unknown>, recordMode: boolean }): Promise<TurnOutcome> {
    const caseReplay = replay.create({ recordedToolCalls: evalCase.recordedToolCalls })
    const tools = evalToolSet.build({ mcpToolSet, replay: caseReplay, auth, recordMode })
    const phaseState: { phase: AgentPhase } = { phase: 'discovery' }
    const { model, costUsd } = pinned({ model: aiUtils.createModel({ credentials: aiProviderCredentials({ provider: AIProviderName.OPENROUTER, auth, config: {} }), modelId, billing: null }) })
    const warnings: string[] = []
    let steps = 0
    const abortSignal = AbortSignal.timeout(TURN_TIMEOUT_MS)

    const { data: result, error } = await tryCatch(() => runAgentTurn({
        models: [{ model, provider: AIProviderName.OPENROUTER, modelId, thinkingBudget: TIER.thinkingBudget }],
        systemPrompt: evalPrompts.loadSystemPrompt(),
        messages: evalCase.messages,
        tools,
        allToolNames: Object.keys(tools),
        tier: { ...TIER, modelId },
        phaseState,
        skills: { surface: 'CHAT', guides: evalPrompts.loadGuides(), preloaded: evalCase.preloadedSkills },
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
        stopWhen: [isLoopFinished(), ...TERMINAL_DISPLAY_TOOLS.map(hasToolCall), async () => caseReplay.stopped(), ...gradedWindow({ evalCase })],
    }))

    if (abortSignal.aborted) {
        throw new Error(`The turn did not finish within ${TURN_TIMEOUT_MS / 1000}s`)
    }
    if (isNil(result)) {
        throw new Error(`The turn produced no output: ${error instanceof Error ? error.message : String(error)}`)
    }
    if (result.uiParts.length === 0) {
        throw new Error(`The turn produced nothing (finish reason "${result.finishReason}"): ${result.streamError?.message ?? 'no error reported'}`)
    }
    return {
        transcript: renderTranscript(result),
        rejectedToolInputs: [...warnings, ...rejectedToolParts(result)],
        stops: caseReplay.stops(),
        newFixtures: caseReplay.newFixtures(),
        reachedTarget: reachedTarget({ evalCase, result, rejected: [...warnings, ...rejectedToolParts(result)] }),
        costUsd: costUsd(),
        steps,
    }
}

function reachedTarget({ evalCase, result, rejected }: { evalCase: EvalCase, result: AgentTurnResult, rejected: string[] }): boolean {
    const targetTool = evalCase.targetTool
    if (isNil(targetTool)) {
        return false
    }
    return result.toolCalls.some((call) => call.toolName === targetTool) || rejected.some((entry) => entry.includes(targetTool))
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

function pinned({ model }: { model: LanguageModel }): { model: LanguageModel, costUsd: () => number | null } {
    if (typeof model === 'string') {
        throw new Error(`Expected a model instance for ${model}`)
    }
    const provider = process.env[PROVIDER_ENV] ?? DEFAULT_PROVIDER
    const productionSampling = process.env[PRODUCTION_SAMPLING_ENV] === 'true'
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
                ...(productionSampling ? {} : { temperature: 0, seed: SEED }),
                providerOptions: {
                    ...params.providerOptions,
                    openrouter: { ...params.providerOptions?.['openrouter'], provider: { order: [provider], allow_fallbacks: false }, usage: { include: true } },
                },
            }),
            wrapGenerate: async ({ doGenerate }) => {
                const result = await doGenerate()
                ledger.calls += 1
                record(result.providerMetadata)
                return result
            },
            wrapStream: async ({ doStream }) => {
                const { stream, ...rest } = await doStream()
                ledger.calls += 1
                return {
                    ...rest,
                    stream: stream.pipeThrough(new TransformStream<LanguageModelV4StreamPart, LanguageModelV4StreamPart>({
                        transform: (chunk, controller) => {
                            if (chunk.type === 'finish') {
                                record(chunk.providerMetadata)
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

function rejectedToolParts(result: AgentTurnResult): string[] {
    return result.uiParts.flatMap((part) => part.type === PersistedAgentPartType.TOOL_CALL && !isNil(part.errorText) && REJECTED_PATTERN.test(part.errorText)
        ? [`${part.toolName}: ${part.errorText.slice(0, ERROR_PREVIEW_CHARS)}`]
        : [])
}

function renderTranscript(result: AgentTurnResult): string {
    return result.uiParts.flatMap((part) => {
        if (part.type === PersistedAgentPartType.TEXT) {
            return [`ASSISTANT: ${part.text}`]
        }
        if (part.type === PersistedAgentPartType.TOOL_CALL) {
            const output = part.errorText ?? JSON.stringify(part.output ?? null)
            return [`TOOL_CALL: ${part.toolName} ${truncate(JSON.stringify(part.input))}`, `TOOL_RESULT: ${truncate(output)}`]
        }
        return []
    }).join('\n')
}

function truncate(text: string): string {
    return text.length <= TRANSCRIPT_FIELD_MAX ? text : `${text.slice(0, TRANSCRIPT_FIELD_MAX)}…`
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
const TIER = { id: 'smart', thinkingBudget: 10_000 }
const SEED = 7
const MAX_STEPS_TO_TARGET = 5
const PROVIDER_ENV = 'EVALS_PROVIDER'
const PRODUCTION_SAMPLING_ENV = 'EVALS_PRODUCTION_SAMPLING'
const DEFAULT_PROVIDER = 'alibaba'
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
    stops: ReplayStop[]
    newFixtures: RecordedToolCall[]
    reachedTarget: boolean
    costUsd: number | null
    steps: number
}
