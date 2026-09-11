import { AIProviderName, isNil, spreadIfDefined, tryCatch } from '@activepieces/core-utils'
import { aiUtils, FlowStepMetadata } from '@activepieces/server-utils'
import { AiStepAction, EngineResponseStatus, ExecuteAiJobData, getEffectiveProviderAndModel, WorkerJobType } from '@activepieces/shared'
import { generateText, ModelMessage, stepCountIs } from 'ai'
import { FireAndForgetJobResult, JobContext, JobHandler, JobResultKind } from '../../types'
import { extractStructuredData } from './extract-structured-data'
import { generateImageStep } from './generate-image'

export const executeAiJob: JobHandler<ExecuteAiJobData, FireAndForgetJobResult> = {
    jobType: WorkerJobType.EXECUTE_AI,
    async execute(ctx: JobContext, data: ExecuteAiJobData): Promise<FireAndForgetJobResult> {
        const { data: output, error } = await tryCatch(() => runAiStep(ctx, data))
        await ctx.apiClient.resumeAiStep({
            projectId: data.projectId,
            flowRunId: data.flowRunId,
            waitpointId: data.waitpointId,
            output: isNil(error) ? { output } : { failure: toFailureMessage(error) },
        })
        if (!isNil(error)) {
            ctx.log.warn({ flowRun: { id: data.flowRunId }, requestId: data.requestId, error }, '[executeAiJob] Handed the failure back to the flow')
        }
        return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK }
    },
}

async function runAiStep(ctx: JobContext, data: ExecuteAiJobData): Promise<unknown> {
    const resolved = await ctx.apiClient.resolveAiProvider({
        projectId: data.projectId,
        platformId: data.platformId,
        provider: data.provider,
        ...spreadIfDefined('providerConfigId', data.providerConfigId),
    })
    const { provider, auth, config } = resolved
    const flowStep = flowStepMetadata(data)
    if (data.action === AiStepAction.enum.EXTRACT_STRUCTURED_DATA) {
        return { answer: await extractStructuredData({ data, resolved, flowStep }) }
    }
    if (data.action === AiStepAction.enum.GENERATE_IMAGE) {
        return { answer: await generateImageStep({ ctx, data, resolved, flowStep }) }
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
            return [{ role: 'user', content: data.prompt ?? '' }]
        case AiStepAction.enum.EXTRACT_STRUCTURED_DATA:
        case AiStepAction.enum.GENERATE_IMAGE:
            throw new Error(`${data.action} does not build plain messages`)
    }
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
