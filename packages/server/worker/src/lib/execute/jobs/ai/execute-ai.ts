import { AIProviderName, isNil, spreadIfDefined, tryCatch } from '@activepieces/core-utils'
import { aiUtils, FlowStepMetadata } from '@activepieces/server-utils'
import { AiStepAction, ClassifyTextJobData, EngineResponseStatus, ExecuteAiJobData, getEffectiveProviderAndModel, WorkerJobType } from '@activepieces/shared'
import { generateText, ModelMessage, stepCountIs } from 'ai'
import { FireAndForgetJobResult, JobContext, JobHandler, JobResultKind } from '../../types'

export const executeAiJob: JobHandler<ExecuteAiJobData, FireAndForgetJobResult> = {
    jobType: WorkerJobType.EXECUTE_AI,
    async execute(ctx: JobContext, data: ExecuteAiJobData): Promise<FireAndForgetJobResult> {
        const { data: output, error } = await tryCatch(() => runAiStep(ctx, data))
        const stepOutput = isNil(error) ? { output } : { failure: toFailureMessage(error) }
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

async function runAiStep(ctx: JobContext, data: ExecuteAiJobData): Promise<unknown> {
    const { provider, auth, config } = await ctx.apiClient.resolveAiProvider({
        projectId: data.projectId,
        platformId: data.platformId,
        provider: data.provider,
        ...spreadIfDefined('providerConfigId', data.providerConfigId),
    })
    const webSearchEnabled = data.webSearch?.enabled ?? false
    const webSearchOptions = data.webSearch?.options
    const { provider: effectiveProvider } = getEffectiveProviderAndModel({ provider, model: data.modelId })
    const tools = aiUtils.buildWebSearchToolsOrThrow({ provider, model: data.modelId, auth, webSearchEnabled, options: webSearchOptions })
    const model = aiUtils.createModel({
        provider,
        auth,
        config,
        modelId: data.modelId,
        flowStep: flowStepMetadata(data),
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
    switch (data.action) {
        case AiStepAction.ASK_AI: {
            const history = (data.conversation ?? []) as ModelMessage[]
            return [...history, { role: 'user', content: data.prompt }]
        }
        case AiStepAction.SUMMARIZE_TEXT:
            return [{ role: 'user', content: `${data.prompt} Summarize the following text : ${data.text ?? ''}` }]
        case AiStepAction.CLASSIFY_TEXT:
            return [{ role: 'user', content: classificationPrompt(data) }]
    }
}

function classificationPrompt(data: ClassifyTextJobData): string {
    return `As a text classifier, your task is to assign one of the following categories to the provided text: ${(data.categories ?? []).join(', ')}. Please respond with only the selected category as a single word, and nothing else.
      Text to classify: "${data.text ?? ''}"`
}

function toStepOutput({ data, text, sources }: { data: ExecuteAiJobData, text: string, sources: unknown }): unknown {
    switch (data.action) {
        case AiStepAction.ASK_AI: {
            const conversation = isNil(data.conversation) ? undefined : [
                ...(data.conversation as ModelMessage[]),
                { role: 'user' as const, content: data.prompt },
                { role: 'assistant' as const, content: text },
            ]
            const answer = data.webSearch?.enabled === true && data.webSearch.options?.includeSources === true
                ? { text, sources }
                : text
            return { answer, ...spreadIfDefined('conversation', conversation) }
        }
        case AiStepAction.SUMMARIZE_TEXT:
            return { answer: text }
        case AiStepAction.CLASSIFY_TEXT: {
            const label = text.trim()
            if (!(data.categories ?? []).includes(label)) {
                throw new Error('Unable to classify the text into the provided categories.')
            }
            return { answer: label }
        }
    }
}

function toFailureMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error)
}

const DEFAULT_WEB_SEARCH_STEPS = 5
const RESUME_ATTEMPTS = 3
const RETRY_DELAY_MS = 1_000
