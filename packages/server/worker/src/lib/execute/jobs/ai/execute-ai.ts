import { AIProviderName, isNil, spreadIfDefined, tryCatch } from '@activepieces/core-utils'
import { aiUtils, FlowStepMetadata } from '@activepieces/server-utils'
import { AiStepAction, EngineResponseStatus, ExecuteAiJobData, getEffectiveProviderAndModel, WorkerJobType } from '@activepieces/shared'
import { generateText, ModelMessage, stepCountIs } from 'ai'
import { JobContext, JobHandler, JobResult, JobResultKind } from '../../types'
import { resolveAiFiles } from './ai-files'
import { extractStructuredData } from './extract-structured-data'
import { generateImageStep } from './generate-image'

export const executeAiJob: JobHandler<ExecuteAiJobData, JobResult> = {
    jobType: WorkerJobType.EXECUTE_AI,
    async execute(ctx: JobContext, data: ExecuteAiJobData): Promise<JobResult> {
        const { data: output, error } = await tryCatch(() => callTheModel({ ctx, data }))
        const stepOutput = isNil(error) ? { output } : { failure: toFailureMessage(error) }
        if (isNil(data.waitpointId)) {
            return { kind: JobResultKind.SYNCHRONOUS, status: EngineResponseStatus.OK, response: stepOutput }
        }
        const handedBack = await handBackToTheFlow({ ctx, data, waitpointId: data.waitpointId, output: stepOutput })
        if (!isNil(error)) {
            ctx.log.warn({ flowRun: { id: data.flowRunId }, requestId: data.requestId, error }, '[executeAiJob] Handed the failure back to the flow')
        }
        return { kind: JobResultKind.FIRE_AND_FORGET, status: handedBack ? EngineResponseStatus.OK : EngineResponseStatus.INTERNAL_ERROR }
    },
}

async function handBackToTheFlow({ ctx, data, waitpointId, output }: {
    ctx: JobContext
    data: ExecuteAiJobData
    waitpointId: string
    output: unknown
}): Promise<boolean> {
    for (let attempt = 1; attempt <= RESUME_ATTEMPTS; attempt++) {
        const { error } = await tryCatch(() => ctx.apiClient.resumeAiStep({
            projectId: data.projectId,
            flowRunId: data.flowRunId,
            waitpointId,
            output,
        }))
        if (isNil(error)) {
            return true
        }
        ctx.log.warn({ flowRun: { id: data.flowRunId }, requestId: data.requestId, attempt, error }, '[executeAiJob] Could not hand the answer back to the flow')
        await waitBeforeRetry(attempt)
    }
    ctx.log.error({ flowRun: { id: data.flowRunId }, requestId: data.requestId }, '[executeAiJob] Gave up handing the answer back, so the step stays paused until its backstop fires')
    return false
}

async function waitBeforeRetry(attempt: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, attempt * RETRY_DELAY_MS))
}

async function callTheModel({ ctx, data }: { ctx: JobContext, data: ExecuteAiJobData }): Promise<unknown> {
    const resolved = await ctx.apiClient.resolveAiProvider({
        projectId: data.projectId,
        platformId: data.platformId,
        provider: data.provider,
        ...spreadIfDefined('providerConfigId', data.providerConfigId),
    })
    const { provider, auth, config } = resolved
    const flowStep = flowStepMetadata(data)
    if (data.action === AiStepAction.enum.EXTRACT_STRUCTURED_DATA) {
        return { answer: await extractStructuredData({ data, resolved, flowStep, files: await resolveAiFiles({ ctx, data }) }) }
    }
    if (data.action === AiStepAction.enum.GENERATE_IMAGE) {
        return { answer: await generateImageStep({ ctx, data, resolved, flowStep, inputImages: await resolveAiFiles({ ctx, data }) }) }
    }
    const webSearchEnabled = data.webSearch?.enabled ?? false
    const webSearchOptions = data.webSearch?.options
    const { provider: effectiveProvider } = getEffectiveProviderAndModel({ provider, model: data.modelId })
    const tools = aiUtils.buildWebSearchToolsOrThrow({ provider, model: data.modelId, auth, webSearchEnabled, options: webSearchOptions })
    const model = aiUtils.createModel({
        provider,
        auth,
        config,
        modelId: data.modelId,
        flowStep,
        openaiResponsesModel: webSearchEnabled && (effectiveProvider ?? provider) === AIProviderName.OPENAI,
        webSearchEnabled,
        webSearchOptions,
    })

    const response = await generateText({
        model,
        messages: buildMessages(data),
        tools,
        ...spreadIfDefined('maxOutputTokens', data.maxOutputTokens),
        ...spreadIfDefined('temperature', data.temperature),
        ...spreadIfDefined('providerOptions', reasoningEffortFor({ action: data.action, provider })),
        ...spreadIfDefined('stopWhen', Object.keys(tools).length === 0 ? undefined : stepCountIs(webSearchOptions?.maxUses ?? DEFAULT_WEB_SEARCH_STEPS)),
    })

    return toStepOutput({ data, text: response.text ?? '', sources: response.sources })
}

function flowStepMetadata(data: ExecuteAiJobData): FlowStepMetadata {
    return {
        projectId: data.projectId,
        platformId: data.platformId,
        flowId: data.flowId,
        runId: data.flowRunId,
    }
}

function buildMessages(data: ExecuteAiJobData): ModelMessage[] {
    const history = (data.conversation ?? []) as ModelMessage[]
    switch (data.action) {
        case AiStepAction.enum.ASK_AI:
            return [...history, { role: 'user', content: data.prompt ?? '' }]
        case AiStepAction.enum.SUMMARIZE_TEXT:
            return [{ role: 'user', content: `${data.prompt} Summarize the following text : ${data.text ?? ''}` }]
        case AiStepAction.enum.CLASSIFY_TEXT:
            return [{ role: 'user', content: classificationPrompt(data) }]
        case AiStepAction.enum.EXTRACT_STRUCTURED_DATA:
        case AiStepAction.enum.GENERATE_IMAGE:
            throw new Error(`${data.action} does not build plain messages`)
    }
}

function classificationPrompt(data: ExecuteAiJobData): string {
    return `As a text classifier, your task is to assign one of the following categories to the provided text: ${(data.categories ?? []).join(', ')}. Please respond with only the selected category as a single word, and nothing else.
      Text to classify: "${data.text ?? ''}"`
}

function reasoningEffortFor({ action, provider }: { action: AiStepAction, provider: AIProviderName }): Record<string, Record<string, string>> | undefined {
    if (action !== AiStepAction.enum.SUMMARIZE_TEXT || provider !== AIProviderName.OPENAI) {
        return undefined
    }
    return { [AIProviderName.OPENAI]: { reasoning_effort: 'minimal' } }
}

function toStepOutput({ data, text, sources }: { data: ExecuteAiJobData, text: string, sources: unknown }): unknown {
    switch (data.action) {
        case AiStepAction.enum.ASK_AI: {
            const conversation = isNil(data.conversation) ? undefined : [
                ...(data.conversation as ModelMessage[]),
                { role: 'user' as const, content: data.prompt ?? '' },
                { role: 'assistant' as const, content: text },
            ]
            const answer = data.webSearch?.enabled === true && data.webSearch.options?.includeSources === true
                ? { text, sources }
                : text
            return { answer, ...spreadIfDefined('conversation', conversation) }
        }
        case AiStepAction.enum.SUMMARIZE_TEXT:
            return { answer: text }
        case AiStepAction.enum.CLASSIFY_TEXT: {
            const label = text.trim()
            if (!(data.categories ?? []).includes(label)) {
                throw new Error('Unable to classify the text into the provided categories.')
            }
            return { answer: label }
        }
        case AiStepAction.enum.EXTRACT_STRUCTURED_DATA:
        case AiStepAction.enum.GENERATE_IMAGE:
            throw new Error(`${data.action} returns its own output shape`)
    }
}

function toFailureMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error)
}

const DEFAULT_WEB_SEARCH_STEPS = 5
const RESUME_ATTEMPTS = 3
const RETRY_DELAY_MS = 1_000
