import { chatAiUtils } from '@activepieces/server-utils'
import { ChatPhase, PersistedChatPartType, tryCatch } from '@activepieces/shared'
import { hasToolCall, isLoopFinished, ModelMessage, ToolSet } from 'ai'
import { ChatEvalFixture } from './fixture'
import { llmJudge } from './llm-judge'
import { evalPrompts } from './prompts'
import { replayExecutor, ReplayExecutor } from './replay-executor'
import { EvalReportEntry } from './report'
import { transcriptAssertions } from './transcript-assertions'
import { chatWorkerTools } from '../../../../src/lib/execute/jobs/ee/chat/chat-worker-tools'
import { ChatTurnResult, runChatTurn } from '../../../../src/lib/execute/jobs/ee/chat/run-chat-turn'

const EVAL_PROJECTS = [{ id: 'eval-project', displayName: 'Eval Project', type: 'TEAM' }]

// These cards block on user input in production; the eval auto-approves them, so we stop the
// turn here to mirror "show card, await user" — otherwise the loop re-nudges the model to re-ask.
const TERMINAL_DISPLAY_TOOLS = ['ap_show_questions', 'ap_show_quick_replies', 'ap_show_connection_picker', 'ap_show_connection_required', 'ap_show_project_picker']

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'
const OPENROUTER_INFERENCE_ENV = 'OPENROUTER_API_KEY'
const OPENROUTER_PROVISION_ENV = 'AP_OPENROUTER_PROVISION_KEY'

const silentLog = {
    info: () => {},
    warn: () => {},
    error: () => {},
}

// A provisioning key can't call /chat/completions; it can only mint inference keys
// (the same exchange AP does in openrouter-api.ts). Mint once, reuse, delete on cleanup.
let mintedKey: { apiKey: string, hash: string | null, provisionKey: string } | null = null

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
    mintedKey = mintedKey ?? await mintInferenceKey(provisionKey)
    return { apiKey: mintedKey.apiKey }
}

async function cleanupAuth(): Promise<void> {
    if (mintedKey?.hash) {
        await tryCatch(() => fetch(`${OPENROUTER_BASE_URL}/keys/${mintedKey?.hash}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${mintedKey?.provisionKey}` },
        }))
    }
    mintedKey = null
}

async function evaluateFixture({ fixture, systemPrompt, guides }: { fixture: ChatEvalFixture, systemPrompt?: string, guides?: Record<string, string> }): Promise<EvalReportEntry> {
    const auth = await resolveAuth()
    if (!auth) {
        throw new Error(`No OpenRouter key found. Set ${OPENROUTER_INFERENCE_ENV} or ${OPENROUTER_PROVISION_ENV} to run the eval.`)
    }

    const transcript = await runTurn({ fixture, systemPrompt, guides, auth })
    const assertions = fixture.assertions.map((assertion, index) => ({
        label: assertion.type,
        ...transcriptAssertions.runAssertion(transcript.result, assertion),
    }))
    const judge = llmJudge.create({ provider: fixture.model.provider, modelId: fixture.model.modelId, auth })
    const verdicts = await Promise.all(fixture.judge.map(async (dimension) => ({
        dimension: dimension.dimension,
        expectedLabel: dimension.expectedLabel,
        ...await judge.judge({ dimension: dimension.dimension, rubric: dimension.rubric, transcript: transcript.text }),
    })))

    return {
        id: fixture.id,
        kind: fixture.kind,
        description: fixture.description,
        provider: fixture.model.provider,
        modelId: fixture.model.modelId,
        passed: assertions.every((assertion) => assertion.pass) && verdicts.every((verdict) => verdict.pass),
        assertions: assertions.map((assertion) => ({ label: assertion.label, pass: assertion.pass, reason: assertion.reason })),
        judge: verdicts,
        transcript: transcript.text,
    }
}

async function runTurn({ fixture, systemPrompt, guides, auth }: { fixture: ChatEvalFixture, systemPrompt?: string, guides?: Record<string, string>, auth: Record<string, unknown> }): Promise<{ result: ChatTurnResult, text: string }> {
    const replay = replayExecutor.create({ recordedToolCalls: fixture.recordedToolCalls })
    const phaseState: { phase: ChatPhase } = { phase: 'discovery' }
    const tools = buildEvalToolSet({ replay, guides: guides ?? evalPrompts.loadGuides(), phaseState })
    const model = chatAiUtils.createChatModel({ provider: fixture.model.provider, auth, config: {}, modelId: fixture.model.modelId })
    const messages: ModelMessage[] = [
        ...fixture.initialMessages,
        ...fixture.userTurns.map((content) => ({ role: 'user' as const, content })),
    ]

    const capturedErrors: unknown[] = []
    const { data: result, error: turnError } = await tryCatch(() => runChatTurn({
        model,
        provider: fixture.model.provider,
        systemPrompt: systemPrompt ?? evalPrompts.loadSystemPrompt(),
        messages,
        tools,
        allToolNames: Object.keys(tools),
        tier: fixture.model.tier,
        phaseState,
        abortSignal: new AbortController().signal,
        log: { info: () => {}, warn: () => {}, error: (obj) => obj.err !== undefined && capturedErrors.push(obj.err) },
        stopWhen: [isLoopFinished(), ...TERMINAL_DISPLAY_TOOLS.map(hasToolCall)],
    }))

    if (!result) {
        const cause = capturedErrors[0] ?? turnError
        throw new Error(`Chat turn produced no output. Underlying provider error: ${cause instanceof Error ? cause.message : String(cause)}`, { cause: cause instanceof Error ? cause : undefined })
    }
    return { result, text: renderTranscript(result) }
}

function buildEvalToolSet({ replay, guides, phaseState }: { replay: ReplayExecutor, guides: Record<string, string>, phaseState: { phase: ChatPhase } }): ToolSet {
    const eventEmitter = chatWorkerTools.createEventEmitter({ sendEvent: async () => {}, userId: 'eval-user', conversationId: 'eval-conversation', log: silentLog })
    const waitForApproval = async () => ({ approved: true })
    const noopGate = async () => {}

    return {
        ...chatWorkerTools.createLocalTools({ onSetProjectContext: async () => {}, projects: EVAL_PROJECTS }),
        ...chatWorkerTools.createDisplayTools({ waitForApproval, displayToolTimeoutMs: 1_000, onConnectionSelected: async () => {}, onGateOpened: noopGate, log: silentLog }),
        ...chatWorkerTools.createCrossProjectTools({ executeTool: replay.executeTool, eventEmitter, waitForApproval, onGateOpened: noopGate, guides }),
        ...chatWorkerTools.createThinkingTools(),
        ...chatWorkerTools.createPhaseTools({ onPhaseChange: (phase) => { phaseState.phase = phase } }),
    }
}

// Render parts in the order the model produced them — text and tool calls interleaved —
// so the judge sees the real sequence, not all text then all tools.
function renderTranscript(result: ChatTurnResult): string {
    return result.uiParts
        .map((part) => {
            if (part.type === PersistedChatPartType.TEXT) {
                return `ASSISTANT: ${part.text}`
            }
            if (part.type === PersistedChatPartType.TOOL_CALL) {
                return `TOOL_CALL: ${part.toolName}`
            }
            return null
        })
        .filter((line): line is string => line !== null)
        .join('\n')
}

async function mintInferenceKey(provisionKey: string): Promise<{ apiKey: string, hash: string | null, provisionKey: string }> {
    const res = await fetch(`${OPENROUTER_BASE_URL}/keys`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${provisionKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'activepieces-chat-eval (ephemeral)', limit: 5 }),
    })
    if (!res.ok) {
        throw new Error(`[OpenRouter] failed to mint an inference key from ${OPENROUTER_PROVISION_ENV}: ${res.status} ${await res.text()}`)
    }
    const body: { key: string, data?: { hash?: string } } = await res.json()
    return { apiKey: body.key, hash: body.data?.hash ?? null, provisionKey }
}

export const chatEvalRunner = {
    evaluateFixture,
    hasProviderKey,
    cleanupAuth,
}
