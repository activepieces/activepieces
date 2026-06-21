import { aiModelUtils, chatAiUtils, CreateEmbeddingModelResult } from '@activepieces/server-utils'
import {
    AgentYield,
    AgentYieldStatus,
    AIProviderName,
    AiUsageSource,
    ContinueAgentRequest,
    ExecuteAiImage,
    ExecuteAiMode,
    ExecuteAiRequest,
    ExecuteAiResponse,
    getEffectiveProviderAndModel,
    isNil,
    RunAgentConfig,
    spreadIfDefined,
    spreadIfNotUndefined,
    tryCatch,
    tryCatchSync,
    WorkerToApiContract,
} from '@activepieces/shared'
import { GeneratedFile, generateImage, generateText, JSONParseError, jsonSchema, JSONValue, ModelMessage, NoObjectGeneratedError, Output, stepCountIs } from 'ai'
import { Logger } from 'pino'
import { ExecutionDeadlineRef } from '../sandbox/types'
import { agentOutputBuilder } from './agent/agent-output-builder'
import { OnAgentFinish, startAgentLoop } from './agent/agent-runner'
import { createAgentSession, createAgentSessionRegistry } from './agent/agent-session'
import { buildAgentToolSet, hasKnowledgeBaseFileTools } from './agent/agent-tools'
import { buildWebSearchConfig } from './agent/tools/web-search'
import { aiUsageCapture, AiUsageCaptureContext } from './ai-usage-capture'

const BUDGET_EPSILON_MS = 2_000

/**
 * The single place all single-shot AI runs on the worker. Provider credentials are resolved
 * server-side (`resolveAiProvider`) from the engine token and never enter the sandbox; the model is
 * built from the already-resolved config and the AI SDK runs here, exactly like chat. Every call
 * emits one `AiUsageEvent`. The agent entrypoints (`runAgent`/`continueAgent`) are added in a later
 * phase — they need reverse piece-tool dispatch and budget/abort semantics, so they are not an
 * `executeAi` mode.
 */
export function aiExecutionService({ log, apiClient, executionDeadline }: AiExecutionServiceParams): AiExecutionService {
    const sessions = createAgentSessionRegistry()

    async function executeAi(request: ExecuteAiRequest): Promise<ExecuteAiResponse> {
        const { provider, auth, config } = await apiClient.resolveAiProvider({
            engineToken: request.engineToken,
            provider: request.provider,
        })
        const context: AiUsageCaptureContext = {
            source: AiUsageSource.FLOW,
            provider,
            model: request.model,
            ...spreadIfDefined('flowId', request.flowId),
            ...spreadIfDefined('runId', request.runId),
            ...spreadIfDefined('stepName', request.stepName),
            ...spreadIfDefined('actionName', request.actionName),
        }

        switch (request.mode) {
            case ExecuteAiMode.IMAGE:
                return runImage({ request, provider, auth, config, context })
            case ExecuteAiMode.TEXT:
                return runText({ request, provider, auth, config, context })
        }
    }

    async function runText({ request, provider, auth, config, context }: RunParams): Promise<ExecuteAiResponse> {
        // Web search is provider-native: tool-based for OpenAI/Anthropic/Google, a request-level
        // provider option for OpenRouter/Activepieces. Built worker-side (same builder as the agent
        // loop), and the OpenAI responses-API switch it requires is derived here — never trusted off
        // a sandbox-supplied flag.
        const webSearch = buildWebSearchConfig({
            provider: request.provider,
            model: request.model,
            webSearchEnabled: request.webSearchEnabled === true,
            webSearchOptions: request.webSearchOptions,
        })
        const { provider: effectiveProvider } = getEffectiveProviderAndModel({ provider: request.provider, model: request.model })
        const model = chatAiUtils.createChatModel({
            provider,
            auth,
            config,
            modelId: request.model,
            openaiResponsesModel: request.webSearchEnabled === true && effectiveProvider === AIProviderName.OPENAI,
        })
        // When a JSON schema is supplied (e.g. agent piece-tool prop-resolution), run the same
        // `generateText` + `Output.object` the engine used to run in-sandbox, and return the structured
        // `object`. Otherwise this is a plain text completion. One SDK primitive, one code path.
        const structuredOutput = isNil(request.schema) ? undefined : Output.object({ schema: jsonSchema(request.schema) })
        const providerOptions = { ...toProviderOptions(request.providerOptions), ...webSearch.providerOptions }
        try {
            const result = await generateText({
                model,
                ...buildCallSettings(request),
                ...buildPrompt(request),
                ...spreadIfDefined('output', structuredOutput),
                ...spreadIfNotUndefined('tools', webSearch.tools),
                ...(isNil(webSearch.tools) ? {} : { stopWhen: stepCountIs(webSearch.maxUses) }),
                ...(Object.keys(providerOptions).length === 0 ? {} : { providerOptions }),
            })

            const event = aiUsageCapture.buildTextEvent({
                context,
                usage: result.usage,
                finishReason: result.finishReason,
                warnings: result.warnings,
                providerMetadata: result.providerMetadata,
                toolCalls: result.steps.flatMap((step) => step.toolCalls.map((toolCall) => ({ toolName: toolCall.toolName, toolCallId: toolCall.toolCallId }))),
                genParams: buildGenParams(request),
            })
            aiUsageCapture.report({ apiClient, engineToken: request.engineToken, event, log })

            return {
                text: result.text,
                finishReason: result.finishReason,
                ...spreadIfNotUndefined('object', isNil(structuredOutput) ? undefined : result.output),
                ...spreadIfNotUndefined('usage', mapUsageForResponse(result.usage)),
                ...spreadIfNotUndefined('sources', isNil(webSearch.tools) ? undefined : [...result.sources]),
                ...spreadIfNotUndefined('images', mapGeneratedFiles(result.files)),
            }
        }
        catch (error) {
            const recovered = isNil(structuredOutput) ? undefined : recoverFencedJson(error)
            if (!isNil(recovered)) {
                // The model DID run (the SDK only failed to parse its output), so this call still
                // consumed tokens — emit the usage event from the error's attached usage.
                if (NoObjectGeneratedError.isInstance(error)) {
                    const event = aiUsageCapture.buildTextEvent({
                        context,
                        usage: error.usage,
                        finishReason: error.finishReason,
                        genParams: buildGenParams(request),
                    })
                    aiUsageCapture.report({ apiClient, engineToken: request.engineToken, event, log })
                }
                return { object: recovered }
            }
            throw error
        }
    }

    async function runImage({ request, provider, auth, config, context }: RunParams): Promise<ExecuteAiResponse> {
        const model = aiModelUtils.createImageModel({ provider, auth, config, modelId: request.model })
        const inputImages = request.inputImages ?? []
        const result = await generateImage({
            model,
            prompt: inputImages.length === 0
                ? request.prompt ?? ''
                : { text: request.prompt ?? '', images: inputImages.map((image) => Buffer.from(image, 'base64')) },
            ...spreadIfDefined('n', request.n),
            ...spreadIfNotUndefined('size', request.size as `${number}x${number}` | undefined),
            ...spreadIfNotUndefined('aspectRatio', request.aspectRatio as `${number}:${number}` | undefined),
            ...spreadIfNotUndefined('providerOptions', toProviderOptions(request.providerOptions)),
        })

        const event = aiUsageCapture.buildImageEvent({
            context,
            imageCount: result.images.length,
            warnings: result.warnings,
            providerMetadata: result.providerMetadata,
        })
        aiUsageCapture.report({ apiClient, engineToken: request.engineToken, event, log })

        return {
            images: result.images.map((image) => ({ base64: image.base64, mediaType: image.mediaType })),
        }
    }

    async function runAgent(config: RunAgentConfig): Promise<AgentYield> {
        const { provider, auth, config: providerConfig } = await apiClient.resolveAiProvider({
            engineToken: config.engineToken,
            provider: config.provider,
        })
        // OpenAI's web-search tool needs the responses API. Derived here (worker-owned) from the
        // run's own web-search setting rather than trusted off a sandbox-supplied flag.
        const { provider: effectiveProvider } = getEffectiveProviderAndModel({ provider: config.provider, model: config.model })
        const model = chatAiUtils.createChatModel({
            provider,
            auth,
            config: providerConfig,
            modelId: config.model,
            openaiResponsesModel: config.webSearchEnabled && effectiveProvider === AIProviderName.OPENAI,
        })

        const abortController = new AbortController()
        const budgetTimer = armBudgetTimer(abortController)
        const session = createAgentSession({
            agentRunId: config.agentRunId,
            abortController,
            onDispose: () => {
                if (budgetTimer) {
                    clearTimeout(budgetTimer)
                }
                sessions.remove(config.agentRunId)
            },
        })
        sessions.add(session)

        const outputBuilder = agentOutputBuilder(config.prompt)
        const embeddingConfig = buildEmbeddingConfig({ config, provider, auth, providerConfig, log })
        let toolSet
        try {
            toolSet = await buildAgentToolSet({ config, session, outputBuilder, apiClient, embeddingConfig, log })
        }
        catch (error) {
            session.dispose()
            return { status: AgentYieldStatus.FAILED, agentRunId: config.agentRunId, errorMessage: error instanceof Error ? error.message : String(error) }
        }
        outputBuilder.setToolMap(toolSet.toolKeyToAgentTool)

        startAgentLoop({
            model,
            system: toolSet.system,
            prompt: toolSet.prompt,
            tools: toolSet.tools,
            maxSteps: config.maxSteps,
            ...spreadIfNotUndefined('providerOptions', toolSet.providerOptions),
            session,
            outputBuilder,
            onFinish: buildUsageEmitter({ config, provider }),
            onProgress: (output) => reportStepProgress({ apiClient, config, output, log }),
            log,
        })

        return drainYield(session)
    }

    async function continueAgent({ agentRunId, toolResults }: ContinueAgentRequest): Promise<AgentYield> {
        const session = sessions.get(agentRunId)
        if (isNil(session)) {
            return { status: AgentYieldStatus.FAILED, agentRunId, errorMessage: 'Agent session not found (it may have already completed or been torn down)' }
        }
        const yieldPromise = session.waitForYield()
        session.resolveToolResults(toolResults)
        return drainYield(session, await yieldPromise)
    }

    function armBudgetTimer(abortController: AbortController): ReturnType<typeof setTimeout> | undefined {
        const deadline = executionDeadline.epochMs
        if (isNil(deadline)) {
            return undefined
        }
        const remainingMs = deadline - Date.now() - BUDGET_EPSILON_MS
        if (remainingMs <= 0) {
            abortController.abort()
            return undefined
        }
        return setTimeout(() => abortController.abort(), remainingMs)
    }

    function buildUsageEmitter({ config, provider }: { config: RunAgentConfig, provider: string }): OnAgentFinish {
        return (event) => {
            const captureContext: AiUsageCaptureContext = {
                source: AiUsageSource.FLOW,
                provider,
                model: config.model,
                stepName: config.stepName,
                actionName: 'run_agent',
            }
            const usageEvent = aiUsageCapture.buildTextEvent({
                context: captureContext,
                usage: event.totalUsage,
                finishReason: event.finishReason,
                warnings: event.warnings,
                providerMetadata: event.providerMetadata,
                toolCalls: event.steps.flatMap((step) => step.toolCalls.map((toolCall) => ({ toolName: toolCall.toolName, toolCallId: toolCall.toolCallId }))),
            })
            aiUsageCapture.report({ apiClient, engineToken: config.engineToken, event: usageEvent, log })
        }
    }

    return {
        executeAi,
        runAgent,
        continueAgent,
        disposeAllSessions: () => sessions.disposeAll(),
    }
}

/**
 * Decision #7: the worker streams live frames straight to the API (the same `updateStepProgress` the
 * engine's forwarding handler calls) — no `flowExecutorContext` needed, just `runId`/`projectId` from
 * the config and the partial `AgentResult` from the worker's output builder. Fire-and-forget: a
 * dropped frame must never fail the run. The engine still persists the authoritative final state.
 */
function reportStepProgress({ apiClient, config, output, log }: ReportStepProgressParams): void {
    void tryCatch(() => apiClient.updateStepProgress({
        projectId: config.projectId,
        stepResponse: {
            runId: config.runId,
            success: true,
            input: {},
            output,
            standardError: '',
            standardOutput: '',
        },
    })).then(({ error }) => {
        if (error) {
            log.debug({ err: error, agentRunId: config.agentRunId }, '[aiExecutionService] Dropped agent progress frame')
        }
    })
}

async function drainYield(session: { waitForYield(): Promise<AgentYield>, dispose(): void }, settled?: AgentYield): Promise<AgentYield> {
    const result = settled ?? await session.waitForYield()
    if (result.status !== AgentYieldStatus.NEED_TOOLS) {
        session.dispose()
    }
    return result
}

function buildEmbeddingConfig({ config, provider, auth, providerConfig, log }: BuildEmbeddingConfigParams): CreateEmbeddingModelResult | undefined {
    if (!hasKnowledgeBaseFileTools(config)) {
        return undefined
    }
    const { data, error } = tryCatchSync(() => aiModelUtils.createEmbeddingModel({ provider, auth, config: providerConfig }))
    if (error) {
        log.warn({ err: error }, '[aiExecutionService] Failed to build embedding model for knowledge base; file search disabled')
        return undefined
    }
    return data
}

/**
 * Some models wrap structured output in a ```json fence, which the AI SDK surfaces as a
 * `NoObjectGeneratedError` whose `cause` is a `JSONParseError`. Recover the object by stripping the
 * fence — same fallback the engine's in-sandbox prop-resolution used.
 */
function recoverFencedJson(error: unknown): unknown {
    if (NoObjectGeneratedError.isInstance(error) && JSONParseError.isInstance(error.cause) && typeof error.text === 'string' && error.text.startsWith('```json') && error.text.endsWith('```')) {
        return JSON.parse(error.text.replace('```json', '').replace('```', ''))
    }
    return undefined
}

function buildCallSettings(request: ExecuteAiRequest): CallSettings {
    return {
        ...spreadIfDefined('system', request.system),
        ...spreadIfDefined('maxOutputTokens', request.maxOutputTokens),
        ...spreadIfDefined('temperature', request.temperature),
    }
}

function buildPrompt(request: ExecuteAiRequest): { messages: ModelMessage[] } | { prompt: string } {
    if (request.messages) {
        return { messages: request.messages as ModelMessage[] }
    }
    return { prompt: request.prompt ?? '' }
}

function buildGenParams(request: ExecuteAiRequest): Record<string, unknown> {
    return {
        ...spreadIfDefined('temperature', request.temperature),
        ...spreadIfDefined('maxOutputTokens', request.maxOutputTokens),
    }
}

function mapGeneratedFiles(files: GeneratedFile[] | undefined): ExecuteAiImage[] | undefined {
    if (isNil(files) || files.length === 0) {
        return undefined
    }
    return files.map((file) => ({ base64: file.base64, mediaType: file.mediaType }))
}

function mapUsageForResponse(usage: { inputTokens?: number, outputTokens?: number, totalTokens?: number, reasoningTokens?: number, cachedInputTokens?: number } | undefined): ExecuteAiResponse['usage'] | undefined {
    if (!usage) {
        return undefined
    }
    return {
        ...spreadIfDefined('inputTokens', usage.inputTokens),
        ...spreadIfDefined('outputTokens', usage.outputTokens),
        ...spreadIfDefined('totalTokens', usage.totalTokens),
        ...spreadIfDefined('reasoningTokens', usage.reasoningTokens),
        ...spreadIfDefined('cachedInputTokens', usage.cachedInputTokens),
    }
}

function toProviderOptions(providerOptions: Record<string, unknown> | undefined): Record<string, Record<string, JSONValue>> | undefined {
    if (!providerOptions) {
        return undefined
    }
    return providerOptions as Record<string, Record<string, JSONValue>>
}

type AiExecutionServiceParams = {
    log: Logger
    apiClient: WorkerToApiContract
    executionDeadline: ExecutionDeadlineRef
}

type RunParams = {
    request: ExecuteAiRequest
    provider: Parameters<typeof chatAiUtils.createChatModel>[0]['provider']
    auth: Record<string, unknown>
    config: Record<string, unknown>
    context: AiUsageCaptureContext
}

type CallSettings = {
    system?: string
    maxOutputTokens?: number
    temperature?: number
}

type BuildEmbeddingConfigParams = {
    config: RunAgentConfig
    provider: AIProviderName
    auth: Record<string, unknown>
    providerConfig: Record<string, unknown>
    log: Logger
}

type ReportStepProgressParams = {
    apiClient: WorkerToApiContract
    config: RunAgentConfig
    output: unknown
    log: Logger
}

export type AiExecutionService = {
    executeAi(request: ExecuteAiRequest): Promise<ExecuteAiResponse>
    runAgent(input: RunAgentConfig): Promise<AgentYield>
    continueAgent(input: ContinueAgentRequest): Promise<AgentYield>
    disposeAllSessions(): void
}
