import { aiUtils } from '@activepieces/server-utils'
import { AIProviderName, aiProviderCredentials, spreadIfDefined, tryCatch } from '@activepieces/core-utils';
import { AgentPhase, PersistedAgentPartType } from '@activepieces/shared';
import { hasToolCall, isLoopFinished, ModelMessage, ToolSet } from 'ai'
import { evalCalibration } from './calibration'
import { costCapture } from './cost-capture'
import { evalFormat, JudgeAgreement } from './eval-format'
import { ChatEvalFixture, ChatEvalFixtureModel } from './fixture'
import { llmJudge } from './llm-judge'
import { evalPrompts } from './prompts'
import { replayExecutor, ReplayExecutor } from './replay-executor'
import { EvalReportEntry } from './report'
import { transcriptAssertions } from './transcript-assertions'
import { agentWorkerTools, GateDecision } from '../../../../src/lib/execute/jobs/ee/agent/agent-worker-tools'
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
const JUDGE_MODEL_DEFAULT = 'typesafe/jev-1.13'
const TRANSCRIPT_FIELD_MAX = 4_000
const TRANSCRIPT_STRING_MAX = 300
const MINTED_KEY_LIMIT_USD = 25
const TURN_TIMEOUT_MS = 5 * 60_000

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

async function evaluateFixture({ fixture, systemPrompt, guides, modelId, repeats = repeatsFromEnv(), onStage }: { fixture: ChatEvalFixture, systemPrompt?: string, guides?: Record<string, string>, modelId?: string, repeats?: number, onStage?: (stage: string) => void }): Promise<EvalReportEntry> {
    const auth = await resolveAuth()
    if (!auth) {
        throw new Error(`No OpenRouter key found. Set ${OPENROUTER_INFERENCE_ENV} or ${OPENROUTER_PROVISION_ENV} to run the eval.`)
    }

    const model = effectiveModel({ fixture, modelId })
    const judge = llmJudge.create({ provider: model.provider, modelId: judgeModelId(), auth })
    const times = Math.max(1, repeats)
    const runs = await runSequentially({ times, run: (index) => {
        const repeatNote = times > 1 ? `repeat ${index + 1}/${times}, ` : ''
        return evaluateOnce({ fixture, model, systemPrompt, guides, auth, judge, onStage: (stage) => onStage?.(`${repeatNote}${stage}`) }).catch((error: unknown) => crashedRun({ error }))
    } })
    const passes = runs.filter((run) => run.passed).length
    const assertionsHeldEveryRun = runs.every((run) => run.assertions.every((assertion) => assertion.pass))
    const shown = runs.find((run) => !run.passed) ?? runs[0]

    return {
        id: fixture.id,
        kind: fixture.kind,
        description: fixture.description,
        provider: model.provider,
        modelId: model.modelId,
        judgeModelId: judgeModelId(),
        runs: runs.length,
        passes,
        passed: assertionsHeldEveryRun && passes * 2 > runs.length,
        assertions: shown.assertions,
        judge: shown.judge,
        transcript: shown.transcript,
        costUsd: evalFormat.sumCost({ costs: runs.map((run) => run.costUsd) }),
        knownCostUsd: runs.reduce((total, run) => total + (run.costUsd ?? 0), 0),
        judgeCostUsd: judge.costUsd(),
        runVerdicts: runs.map((run) => ({ passed: run.passed, assertions: run.assertions, judge: run.judge })),
    }
}

async function measureJudgeAgreement(): Promise<JudgeAgreement | null> {
    const cases = evalCalibration.loadLabelled()
    if (cases.length === 0) {
        return null
    }
    const auth = await resolveAuth()
    if (!auth) {
        return null
    }
    const judge = llmJudge.create({ provider: AIProviderName.OPENROUTER, modelId: judgeModelId(), auth })
    const verdicts = await Promise.all(cases.map(async (calibrationCase) => {
        const verdict = await judge.judge({ dimension: calibrationCase.dimension, rubric: calibrationCase.rubric, transcript: calibrationCase.transcript })
        return { humanLabel: calibrationCase.humanLabel, judgePass: verdict.pass, draft: evalCalibration.isDraft(calibrationCase) }
    }))
    return evalFormat.judgeAgreement({ verdicts })
}

function crashedRun({ error }: { error: unknown }): SingleRun {
    return { passed: false, assertions: [crashCheck({ error, when: 'This repeat crashed before it could be graded' })], judge: [], transcript: '', costUsd: null }
}

function crashCheck({ error, when }: { error: unknown, when: string }): { label: string, pass: boolean, reason: string } {
    return { label: 'runCompleted', pass: false, reason: `${when}: ${error instanceof Error ? error.message : String(error)}` }
}

function failedEntry({ fixture, error }: { fixture: ChatEvalFixture, error: unknown }): EvalReportEntry {
    const assertions = [crashCheck({ error, when: 'The fixture could not start' })]
    return {
        id: fixture.id,
        kind: fixture.kind,
        description: fixture.description,
        provider: fixture.model.provider,
        modelId: fixture.model.modelId,
        judgeModelId: judgeModelId(),
        runs: 1,
        passes: 0,
        passed: false,
        assertions,
        judge: [],
        transcript: '',
        costUsd: null,
        knownCostUsd: 0,
        judgeCostUsd: null,
        runVerdicts: [{ passed: false, assertions, judge: [] }],
    }
}

function effectiveModel({ fixture, modelId }: { fixture: ChatEvalFixture, modelId?: string }): ChatEvalFixtureModel {
    if (!modelId) {
        return fixture.model
    }
    return { ...fixture.model, modelId, tier: { ...fixture.model.tier, modelId } }
}

function judgeModelId(): string {
    return process.env[JUDGE_MODEL_ENV] || JUDGE_MODEL_DEFAULT
}

function repeatsFromEnv(): number {
    const parsed = Number(process.env[REPEATS_ENV])
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

async function runSequentially<T>({ times, run }: { times: number, run: (index: number) => Promise<T> }): Promise<T[]> {
    const results: T[] = []
    for (let i = 0; i < times; i++) {
        results.push(await run(i))
    }
    return results
}

async function evaluateOnce({ fixture, model, systemPrompt, guides, auth, judge, onStage }: { fixture: ChatEvalFixture, model: ChatEvalFixtureModel, systemPrompt?: string, guides?: Record<string, string>, auth: Record<string, unknown>, judge: Judge, onStage: (stage: string) => void }): Promise<SingleRun> {
    onStage('agent turn, step 1')
    const transcript = await runTurn({ fixture, model, systemPrompt, guides, auth, onStep: (step) => onStage(`agent turn, step ${step}`) })
    onStage(fixture.judge.length > 0 ? `judging ${fixture.judge.length} check(s)` : 'checking')
    const assertions = fixture.assertions.map((assertion) => {
        const outcome = transcriptAssertions.runAssertion(transcript.result, assertion)
        return { label: assertion.type, pass: outcome.pass, reason: outcome.reason }
    })
    const verdicts = await Promise.all(fixture.judge.map(async (dimension) => {
        const verdict = await judge.judge({ dimension: dimension.dimension, rubric: dimension.rubric, transcript: transcript.text })
        // "pass" = the judge's label matched what this dimension EXPECTS. A capability fixture can
        // expect FAIL (documenting a known limitation), so a literal PASS-only check would peg it
        // permanently red and hide whether a prompt change moved it.
        const pass = verdict.pass === (dimension.expectedLabel === 'pass')
        return {
            dimension: dimension.dimension,
            expectedLabel: dimension.expectedLabel,
            pass,
            reason: verdict.reason,
            ...spreadIfDefined('failure', pass ? undefined : verdict.failure),
        }
    }))
    return {
        passed: assertions.every((assertion) => assertion.pass) && verdicts.every((verdict) => verdict.pass),
        assertions,
        judge: verdicts,
        transcript: transcript.text,
        costUsd: transcript.costUsd,
    }
}

async function runTurn({ fixture, model, systemPrompt, guides, auth, onStep }: { fixture: ChatEvalFixture, model: ChatEvalFixtureModel, systemPrompt?: string, guides?: Record<string, string>, auth: Record<string, unknown>, onStep: (step: number) => void }): Promise<{ result: AgentTurnResult, text: string, costUsd: number | null }> {
    const replay = replayExecutor.create({ recordedToolCalls: fixture.recordedToolCalls })
    const phaseState: { phase: AgentPhase } = { phase: 'discovery' }
    const tools = buildEvalToolSet({ replay })
    const tracked = costCapture.track({ model: aiUtils.createModel({ credentials: aiProviderCredentials({ provider: model.provider, auth, config: {} }), modelId: model.modelId }) })
    const messages: ModelMessage[] = [
        ...fixture.initialMessages,
        ...fixture.userTurns.map((content) => ({ role: 'user' as const, content })),
    ]

    const capturedErrors: unknown[] = []
    const abortSignal = AbortSignal.timeout(TURN_TIMEOUT_MS)
    let steps = 0
    const { data: result, error: turnError } = await tryCatch(() => runAgentTurn({
        models: [{ model: tracked.model, provider: model.provider, modelId: model.tier.modelId, thinkingBudget: model.tier.thinkingBudget }],
        systemPrompt: systemPrompt ?? evalPrompts.loadSystemPrompt(),
        messages,
        tools,
        allToolNames: Object.keys(tools),
        tier: model.tier,
        phaseState,
        skills: { surface: 'CHAT', guides: guides ?? evalPrompts.loadGuides() },
        abortSignal,
        onStepModel: () => {
            steps += 1
            onStep(steps)
        },
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

    if (abortSignal.aborted) {
        throw new Error(`The chat turn did not finish within ${TURN_TIMEOUT_MS / 1000}s`)
    }
    if (!result) {
        const cause = capturedErrors[0] ?? turnError
        throw new Error(`Chat turn produced no output. Underlying provider error: ${cause instanceof Error ? cause.message : String(cause)}`, { cause: cause instanceof Error ? cause : undefined })
    }
    return { result, text: renderTranscript(result), costUsd: tracked.costUsd() }
}

function buildEvalToolSet({ replay }: { replay: ReplayExecutor }): ToolSet {
    const eventEmitter = agentWorkerTools.createEventEmitter({ sendEvent: async () => {}, userId: 'eval-user', conversationId: 'eval-conversation', log: silentLog })
    const approveGate = async (): Promise<GateDecision> => ({ outcome: 'approved' })
    const dismissCard = async (): Promise<GateDecision> => ({ outcome: 'declined' })
    const noopGate = async () => {}

    return {
        ...agentWorkerTools.createLocalTools({ onSetProjectContext: async () => ({ success: true }), projects: EVAL_PROJECTS }),
        ...agentWorkerTools.createDisplayTools({ waitForApproval: dismissCard, displayToolTimeoutMs: 1_000, onConnectionSelected: async () => {}, onGateOpened: noopGate }),
        ...agentWorkerTools.createCrossProjectTools({ executeTool: replay.executeTool, eventEmitter, waitForApproval: approveGate, onGateOpened: noopGate, taintState: agentWorkerTools.createTaintState({ carried: false }) }),
        ...agentWorkerTools.createThinkingTools(),
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
                const result = part.errorText ?? JSON.stringify(shortenLongStrings(part.output ?? null))
                return [
                    `TOOL_CALL: ${part.toolName} ${evalFormat.truncate({ text: JSON.stringify(shortenLongStrings(part.input)), max: TRANSCRIPT_FIELD_MAX })}`,
                    `TOOL_RESULT: ${evalFormat.truncate({ text: result, max: TRANSCRIPT_FIELD_MAX })}`,
                ].join('\n')
            }
            return null
        })
        .filter((line): line is string => line !== null)
        .join('\n')
}

function shortenLongStrings(value: unknown): unknown {
    if (typeof value === 'string') {
        return evalFormat.truncate({ text: value, max: TRANSCRIPT_STRING_MAX })
    }
    if (Array.isArray(value)) {
        return value.map(shortenLongStrings)
    }
    if (typeof value === 'object' && value !== null) {
        return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, shortenLongStrings(inner)]))
    }
    return value
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
    measureJudgeAgreement,
    failedEntry,
    repeatsFromEnv,
    judgeModelId,
    hasProviderKey,
    cleanupAuth,
}

type MintedKey = { apiKey: string, hash: string | null, provisionKey: string }

type Judge = ReturnType<typeof llmJudge.create>

type SingleRun = Pick<EvalReportEntry, 'passed' | 'assertions' | 'judge' | 'transcript' | 'costUsd'>
