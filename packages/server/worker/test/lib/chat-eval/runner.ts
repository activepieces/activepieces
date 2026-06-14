import { chatAiUtils } from '@activepieces/server-utils'
import { AIProviderName, ChatPhase, PersistedChatPartType } from '@activepieces/shared'
import { ModelMessage, ToolSet } from 'ai'
import { ChatEvalFixture } from './fixture'
import { evalPromptLoader } from './prompt-loader'
import { replayExecutor, ReplayDivergence, ReplayExecutor } from './replay-executor'
import { AssertionResult, transcriptAssertions } from './transcript-assertions'
import { chatWorkerTools } from '../../../src/lib/execute/jobs/ee/chat/chat-worker-tools'
import { ChatTurnResult, runChatTurn } from '../../../src/lib/execute/jobs/ee/chat/run-chat-turn'

const EVAL_PROJECTS = [{ id: 'eval-project', displayName: 'Eval Project', type: 'TEAM' }]

const PROVIDER_ENV_KEYS: Partial<Record<AIProviderName, string>> = {
    [AIProviderName.ANTHROPIC]: 'ANTHROPIC_API_KEY',
    [AIProviderName.OPENAI]: 'OPENAI_API_KEY',
    [AIProviderName.OPENROUTER]: 'OPENROUTER_API_KEY',
}

const silentLog = {
    info: () => {},
    warn: () => {},
    error: () => {},
}

function resolveAuth(provider: AIProviderName): Record<string, unknown> | null {
    const envKey = PROVIDER_ENV_KEYS[provider]
    const apiKey = envKey ? process.env[envKey] : undefined
    return apiKey ? { apiKey } : null
}

function buildEvalToolSet({ replay, guides, phaseState }: {
    replay: ReplayExecutor
    guides: Record<string, string>
    phaseState: { phase: ChatPhase }
}): ToolSet {
    const eventEmitter = chatWorkerTools.createEventEmitter({
        sendEvent: async () => {},
        userId: 'eval-user',
        conversationId: 'eval-conversation',
        log: silentLog,
    })
    const waitForApproval = async () => ({ approved: true })
    const noopGate = async () => {}

    const localTools = chatWorkerTools.createLocalTools({ onSetProjectContext: async () => {}, projects: EVAL_PROJECTS })
    const displayTools = chatWorkerTools.createDisplayTools({
        waitForApproval,
        displayToolTimeoutMs: 1_000,
        onConnectionSelected: async () => {},
        onGateOpened: noopGate,
        log: silentLog,
    })
    const crossProjectTools = chatWorkerTools.createCrossProjectTools({ executeTool: replay.executeTool, eventEmitter, waitForApproval, onGateOpened: noopGate, guides })
    const thinkingTools = chatWorkerTools.createThinkingTools()
    const phaseTools = chatWorkerTools.createPhaseTools({ onPhaseChange: (phase) => {
        phaseState.phase = phase
    } })

    return { ...localTools, ...displayTools, ...crossProjectTools, ...thinkingTools, ...phaseTools }
}

function renderTranscript(result: ChatTurnResult): string {
    const textLines = result.uiParts
        .filter((part) => part.type === PersistedChatPartType.TEXT)
        .map((part) => `ASSISTANT: ${'text' in part ? part.text : ''}`)
    const toolLines = result.toolCalls.map((call) => `TOOL_CALL[#${call.order}] (phase=${call.phase}): ${call.toolName}`)
    return [...textLines, ...toolLines].join('\n')
}

async function runFixture({ fixture }: { fixture: ChatEvalFixture }): Promise<RunFixtureResult> {
    const auth = resolveAuth(fixture.model.provider)
    if (!auth) {
        throw new Error(`No API key for provider "${fixture.model.provider}". Set ${PROVIDER_ENV_KEYS[fixture.model.provider] ?? 'the provider API key'} to run the live eval gate.`)
    }

    const replay = replayExecutor.create({ recordedToolCalls: fixture.recordedToolCalls })
    const phaseState: { phase: ChatPhase } = { phase: 'discovery' }
    const tools = buildEvalToolSet({ replay, guides: evalPromptLoader.loadGuides(), phaseState })

    const model = chatAiUtils.createChatModel({ provider: fixture.model.provider, auth, config: {}, modelId: fixture.model.modelId })

    const messages: ModelMessage[] = [
        ...fixture.initialMessages,
        ...fixture.userTurns.map((content) => ({ role: 'user' as const, content })),
    ]

    const abortController = new AbortController()
    const result = await runChatTurn({
        model,
        provider: fixture.model.provider,
        systemPrompt: evalPromptLoader.loadSystemPrompt(),
        messages,
        tools,
        allToolNames: Object.keys(tools),
        tier: fixture.model.tier,
        phaseState,
        abortSignal: abortController.signal,
        log: silentLog,
    })

    const assertionResults = fixture.assertions.map((assertion) => transcriptAssertions.runAssertion(result, assertion))
    const divergences = replay.getDivergences()

    return {
        result,
        assertionResults,
        divergences,
        transcript: renderTranscript(result),
        passedAssertions: assertionResults.every((r) => r.pass) && divergences.length === 0,
    }
}

export const chatEvalRunner = {
    runFixture,
    resolveAuth,
    renderTranscript,
}

export type RunFixtureResult = {
    result: ChatTurnResult
    assertionResults: AssertionResult[]
    divergences: ReplayDivergence[]
    transcript: string
    passedAssertions: boolean
}
