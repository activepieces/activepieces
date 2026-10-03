import { aiUtils } from '@activepieces/server-utils'
import { aiProviderCredentials, tryCatch } from '@activepieces/core-utils';
import { AgentPhase, PersistedAgentPartType } from '@activepieces/shared';
import { hasToolCall, isLoopFinished, ModelMessage, ToolSet } from 'ai'
import { evalFormat } from './eval-format'
import { ChatEvalFixture } from './fixture'
import { llmJudge } from './llm-judge'
import { evalPrompts } from './prompts'
import { replayExecutor, ReplayExecutor } from './replay-executor'
import { EvalReportEntry } from './report'
import { transcriptAssertions } from './transcript-assertions'
import { agentWorkerTools } from '../../../../src/lib/execute/jobs/ee/agent/agent-worker-tools'
import { AgentTurnResult, runAgentTurn } from '../../../../src/lib/execute/jobs/ee/agent/run-agent-turn'

const EVAL_PROJECTS = [{ id: 'eval-project', displayName: 'Eval Project', type: 'TEAM' }]

// These cards block on user input in production; the eval auto-approves them, so we stop the
// turn here to mirror "show card, await user" — otherwise the loop re-nudges the model to re-ask.
const TERMINAL_DISPLAY_TOOLS = ['ap_show_questions', 'ap_show_quick_replies', 'ap_show_connection_picker', 'ap_show_connection_required', 'ap_show_project_picker']

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'
const OPENROUTER_INFERENCE_ENV = 'OPENROUTER_API_KEY'
const OPENROUTER_PROVISION_ENV = 'AP_OPENROUTER_PROVISION_KEY'
const REPEATS_ENV = 'CHAT_EVAL_REPEATS'
const JUDGE_MODEL_ENV = 'CHAT_EVAL_JUDGE_MODEL'
const JUDGE_MODEL_DEFAULT = 'anthropic/claude-opus-4.8'
const TRANSCRIPT_FIELD_MAX = 1_500
const MINTED_KEY_LIMIT_USD = 25

const silentLog = {
    info: () => {},
    warn: () => {},
    error: () => {},
}

// A provisioning key can't call /chat/completions; it can only mint inference keys
// (the same exchange AP does in openrouter-api.ts). Mint once, reuse, delete on cleanup.
// Memoize the in-flight PROMISE (not the resolved value): concurrent Promise.all fixtures call
// resolveAuth() simultaneously, so a value-level `?? await mint()` would mint a key per caller and
// leak all but the last. Sharing the promise mints exactly one; clear it on failure so a retry mints.
let mintedKeyPromise: Promise<MintedKey> | null = null

function hasProviderKey(): boolean {
    return Boolean(process.env[OPENROUTER_INFERENCE_ENV] || process.env[OPENROUTER_PROVISION_ENV])
}

async function resolveAuth(): Promise<Record<string, unknown> | null> {
    const inferenceKey = process.env[OPENROUTER_INFERENCE_ENV]
    if (inferenceKey) {
        return { apiKey: inferenceKey }
    }
    const provisionKey = process.env[OPENROUTER_PROVISION_ENV]
    if (!provisionKey) {
        return null
    }
    mintedKeyPromise = mintedKeyPromise ?? mintInferenceKey(provisionKey).catch((err) => {
        mintedKeyPromise = null
        throw err
    })
    return { apiKey: (await mintedKeyPromise).apiKey }
}

async function cleanupAuth(): Promise<void> {
    const minted = mintedKeyPromise ? await mintedKeyPromise.catch(() => null) : null
    if (minted?.hash) {
        await tryCatch(() => fetch(`${OPENROUTER_BASE_URL}/keys/${minted.hash}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${minted.provisionKey}` },
        }))
    }
    mintedKeyPromise = null
}

async function evaluateFixture({ fixture, systemPrompt, guides, repeats = repeatsFromEnv() }: { fixture: ChatEvalFixture, systemPrompt?: string, guides?: Record<string, string>, repeats?: number }): Promise<EvalReportEntry> {
    const auth = await resolveAuth()
    if (!auth) {
        throw new Error(`No OpenRouter key found. Set ${OPENROUTER_INFERENCE_ENV} or ${OPENROUTER_PROVISION_ENV} to run the eval.`)
    }

    const judgeModelId = process.env[JUDGE_MODEL_ENV] || JUDGE_MODEL_DEFAULT
    const judge = llmJudge.create({ provider: fixture.model.provider, modelId: judgeModelId, auth })
    const runs = await runSequentially({ times: Math.max(1, repeats), run: () => evaluateOnce({ fixture, systemPrompt, guides, auth, judge }) })
    const passes = runs.filter((run) => run.passed).length
    const shown = runs.find((run) => !run.passed) ?? runs[0]

    return {
        id: fixture.id,
        kind: fixture.kind,
        description: fixture.description,
        provider: fixture.model.provider,
        modelId: fixture.model.modelId,
        judgeModelId,
        runs: runs.length,
        passes,
        passed: passes * 2 > runs.length,
        assertions: shown.assertions,
        judge: shown.judge,
        transcript: shown.transcript,
    }
}

function repeatsFromEnv(): number {
    const parsed = Number(process.env[REPEATS_ENV])
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

async function runSequentially<T>({ times, run }: { times: number, run: () => Promise<T> }): Promise<T[]> {
    const results: T[] = []
    for (let i = 0; i < times; i++) {
        results.push(await run())
    }
    return results
}

async function evaluateOnce({ fixture, systemPrompt, guides, auth, judge }: { fixture: ChatEvalFixture, systemPrompt?: string, guides?: Record<string, string>, auth: Record<string, unknown>, judge: Judge }): Promise<SingleRun> {
    const transcript = await runTurn({ fixture, systemPrompt, guides, auth })
    const assertions = fixture.assertions.map((assertion) => {
        const outcome = transcriptAssertions.runAssertion(transcript.result, assertion)
        return { label: assertion.type, pass: outcome.pass, reason: outcome.reason }
    })
    const verdicts = await Promise.all(fixture.judge.map(async (dimension) => {
        const verdict = await judge.judge({ dimension: dimension.dimension, rubric: dimension.rubric, transcript: transcript.text })
        // "pass" = the judge's label matched what this dimension EXPECTS. A capability fixture can
        // expect FAIL (documenting a known limitation), so a literal PASS-only check would peg it
        // permanently red and hide whether a prompt change moved it.
        return {
            dimension: dimension.dimension,
            expectedLabel: dimension.expectedLabel,
            pass: verdict.pass === (dimension.expectedLabel === 'pass'),
            reason: verdict.reason,
        }
    }))
    return {
        passed: assertions.every((assertion) => assertion.pass) && verdicts.every((verdict) => verdict.pass),
        assertions,
        judge: verdicts,
        transcript: transcript.text,
    }
}

async function runTurn({ fixture, systemPrompt, guides, auth }: { fixture: ChatEvalFixture, systemPrompt?: string, guides?: Record<string, string>, auth: Record<string, unknown> }): Promise<{ result: AgentTurnResult, text: string }> {
    const replay = replayExecutor.create({ recordedToolCalls: fixture.recordedToolCalls })
    const phaseState: { phase: AgentPhase } = { phase: 'discovery' }
    const tools = buildEvalToolSet({ replay, guides: guides ?? evalPrompts.loadGuides(), phaseState })
    const model = aiUtils.createModel({ credentials: aiProviderCredentials({ provider: fixture.model.provider, auth, config: {} }), modelId: fixture.model.modelId })
    const messages: ModelMessage[] = [
        ...fixture.initialMessages,
        ...fixture.userTurns.map((content) => ({ role: 'user' as const, content })),
    ]

    const capturedErrors: unknown[] = []
    const { data: result, error: turnError } = await tryCatch(() => runAgentTurn({
        model,
        provider: fixture.model.provider,
        systemPrompt: systemPrompt ?? evalPrompts.loadSystemPrompt(),
        messages,
        tools,
        allToolNames: Object.keys(tools),
        tier: fixture.model.tier,
        modelId: fixture.model.tier.modelId,
        phaseState,
        abortSignal: new AbortController().signal,
        log: {
            debug: () => {},
            info: () => {},
            warn: () => {},
            error: (obj) => {
                const captured = obj.err ?? obj.error
                if (captured !== undefined) {
                    capturedErrors.push(captured)
                }
            },
        },
        stopWhen: [isLoopFinished(), ...TERMINAL_DISPLAY_TOOLS.map(hasToolCall)],
    }))

    if (!result) {
        const cause = capturedErrors[0] ?? turnError
        throw new Error(`Chat turn produced no output. Underlying provider error: ${cause instanceof Error ? cause.message : String(cause)}`, { cause: cause instanceof Error ? cause : undefined })
    }
    return { result, text: renderTranscript(result) }
}

function buildEvalToolSet({ replay, guides, phaseState }: { replay: ReplayExecutor, guides: Record<string, string>, phaseState: { phase: AgentPhase } }): ToolSet {
    const eventEmitter = agentWorkerTools.createEventEmitter({ sendEvent: async () => {}, userId: 'eval-user', conversationId: 'eval-conversation', log: silentLog })
    const waitForApproval = async () => ({ approved: true })
    const noopGate = async () => {}

    return {
        ...agentWorkerTools.createLocalTools({ onSetProjectContext: async () => {}, projects: EVAL_PROJECTS }),
        ...agentWorkerTools.createDisplayTools({ waitForApproval, displayToolTimeoutMs: 1_000, onConnectionSelected: async () => {}, onGateOpened: noopGate, log: silentLog }),
        ...agentWorkerTools.createCrossProjectTools({ executeTool: replay.executeTool, eventEmitter, waitForApproval, onGateOpened: noopGate, guides }),
        ...agentWorkerTools.createThinkingTools(),
        ...agentWorkerTools.createPhaseTools({ onPhaseChange: (phase) => { phaseState.phase = phase } }),
    }
}

// Render parts in the order the model produced them — text and tool calls interleaved —
// so the judge sees the real sequence, not all text then all tools.
function renderTranscript(result: AgentTurnResult): string {
    return result.uiParts
        .map((part) => {
            if (part.type === PersistedAgentPartType.TEXT) {
                return `ASSISTANT: ${part.text}`
            }
            if (part.type === PersistedAgentPartType.TOOL_CALL) {
                const result = part.errorText ?? JSON.stringify(part.output ?? null)
                return [
                    `TOOL_CALL: ${part.toolName} ${evalFormat.truncate({ text: JSON.stringify(part.input), max: TRANSCRIPT_FIELD_MAX })}`,
                    `TOOL_RESULT: ${evalFormat.truncate({ text: result, max: TRANSCRIPT_FIELD_MAX })}`,
                ].join('\n')
            }
            return null
        })
        .filter((line): line is string => line !== null)
        .join('\n')
}

async function mintInferenceKey(provisionKey: string): Promise<MintedKey> {
    const res = await fetch(`${OPENROUTER_BASE_URL}/keys`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${provisionKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'activepieces-agent-eval (ephemeral)', limit: MINTED_KEY_LIMIT_USD }),
    })
    if (!res.ok) {
        throw new Error(`[OpenRouter] failed to mint an inference key from ${OPENROUTER_PROVISION_ENV}: ${res.status} ${await res.text()}`)
    }
    const body: { key: string, data?: { hash?: string } } = await res.json()
    return { apiKey: body.key, hash: body.data?.hash ?? null, provisionKey }
}

export const agentEvalRunner = {
    evaluateFixture,
    repeatsFromEnv,
    hasProviderKey,
    cleanupAuth,
}

type MintedKey = { apiKey: string, hash: string | null, provisionKey: string }

type Judge = ReturnType<typeof llmJudge.create>

type SingleRun = Pick<EvalReportEntry, 'passed' | 'assertions' | 'judge' | 'transcript'>
