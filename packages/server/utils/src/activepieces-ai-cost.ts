import { AIProviderName, isNil, ActivepiecesAiBilling, ActivepiecesAiCall, ActivepiecesAiCostReporter } from '@activepieces/core-utils'
import { isJSONObject, LanguageModelV4GenerateResult, LanguageModelV4StreamPart, SharedV4ProviderMetadata } from '@ai-sdk/provider'
import { LanguageModel, wrapLanguageModel } from 'ai'
import { z } from 'zod'

export function wrapActivepiecesLanguageModel({ model, provider, modelId, billing }: WrapActivepiecesLanguageModelParams): LanguageModel {
    if (provider !== AIProviderName.ACTIVEPIECES || typeof model === 'string') {
        return model
    }
    return wrapLanguageModel({
        model,
        middleware: {
            wrapGenerate: async ({ doGenerate }) => {
                const result = await doGenerate()
                publish({ billing, provider, modelId, call: toGeneratedCall(result) })
                return result
            },
            wrapStream: async ({ doStream }) => {
                const { stream, ...rest } = await doStream()
                return { ...rest, stream: stream.pipeThrough(streamCostObserver({ billing, provider, modelId })) }
            },
        },
    })
}

export function observedEmbeddingFetch({ provider, modelId, billing, inner }: ObservedEmbeddingFetchParams): typeof globalThis.fetch | undefined {
    if (provider !== AIProviderName.ACTIVEPIECES) {
        return inner
    }
    const send = inner ?? fetch
    return async (input, init) => {
        const response = await send(input, init)
        void readEmbeddingCall(response)
            .then((call) => publish({ billing, provider, modelId, call }))
            .catch(() => undefined)
        return response
    }
}

function toGeneratedCall(result: LanguageModelV4GenerateResult): ActivepiecesAiCall | undefined {
    return toCall({ generationId: result.response?.id, providerMetadata: result.providerMetadata })
}

function streamCostObserver({ billing, provider, modelId }: ObserverParams): TransformStream<LanguageModelV4StreamPart, LanguageModelV4StreamPart> {
    let generationId: string | undefined
    return new TransformStream({
        transform: (chunk, controller) => {
            if (chunk.type === 'response-metadata') {
                generationId = chunk.id ?? generationId
            }
            if (chunk.type === 'finish') {
                publish({ billing, provider, modelId, call: toCall({ generationId, providerMetadata: chunk.providerMetadata }) })
            }
            controller.enqueue(chunk)
        },
    })
}

function toCall({ generationId, providerMetadata }: { generationId: string | undefined, providerMetadata: SharedV4ProviderMetadata | undefined }): ActivepiecesAiCall | undefined {
    const usage = openRouterUsageOf(providerMetadata)
    if (isNil(generationId) || isNil(usage) || isNil(usage.cost)) {
        return undefined
    }
    return {
        generationId,
        costUsd: usage.cost,
        ...(isNil(usage.promptTokens) ? {} : { inputTokens: usage.promptTokens }),
        ...(isNil(usage.completionTokens) ? {} : { outputTokens: usage.completionTokens }),
    }
}

function openRouterUsageOf(providerMetadata: SharedV4ProviderMetadata | undefined): OpenRouterUsage | undefined {
    const openRouter = providerMetadata?.['openrouter']
    if (isNil(openRouter)) {
        return undefined
    }
    const usage = openRouter['usage']
    if (!isJSONObject(usage)) {
        return undefined
    }
    return parseOrUndefined(OpenRouterUsage, usage)
}

async function readEmbeddingCall(response: Response): Promise<ActivepiecesAiCall | undefined> {
    if (!response.ok) {
        return undefined
    }
    const body = parseOrUndefined(EmbeddingCostResponse, await response.clone().json())
    if (isNil(body) || isNil(body.usage.cost)) {
        return undefined
    }
    return {
        generationId: body.id,
        costUsd: body.usage.cost,
        ...(isNil(body.usage.prompt_tokens) ? {} : { inputTokens: body.usage.prompt_tokens }),
    }
}

function parseOrUndefined<T extends z.ZodType>(schema: T, value: unknown): z.infer<T> | undefined {
    const parsed = schema.safeParse(value)
    return parsed.success ? parsed.data : undefined
}

function publish({ billing, provider, modelId, call }: PublishParams): void {
    if (isNil(call)) {
        return
    }
    if (isNil(reporter)) {
        unreportedCalls += 1
        return
    }
    reporter({ billing, provider, modelId, call })
}

const OpenRouterUsage = z.object({
    cost: z.number().optional(),
    promptTokens: z.number().optional(),
    completionTokens: z.number().optional(),
})

const EmbeddingCostResponse = z.object({
    id: z.string().min(1),
    usage: z.object({
        cost: z.number().optional(),
        prompt_tokens: z.number().optional(),
    }),
})

let reporter: ActivepiecesAiCostReporter | undefined
let unreportedCalls = 0

export const activepiecesAiCost = {
    setReporter: (next: ActivepiecesAiCostReporter): void => {
        reporter = next
    },
    hasReporter: (): boolean => !isNil(reporter),
    assertReporterInstalled: (): void => {
        if (isNil(reporter)) {
            throw new Error('No Activepieces AI cost reporter was installed, so every call on the Activepieces AI provider would run unbilled')
        }
    },
    unreportedCallCount: (): number => unreportedCalls,
    wrapActivepiecesLanguageModel,
    observedEmbeddingFetch,
}

type OpenRouterUsage = z.infer<typeof OpenRouterUsage>

type WrapActivepiecesLanguageModelParams = {
    model: LanguageModel
    provider: AIProviderName
    modelId: string
    billing: ActivepiecesAiBilling
}

type ObservedEmbeddingFetchParams = {
    provider: AIProviderName
    modelId: string
    billing: ActivepiecesAiBilling
    inner: typeof globalThis.fetch | undefined
}

type ObserverParams = {
    billing: ActivepiecesAiBilling
    provider: AIProviderName
    modelId: string
}

type PublishParams = ObserverParams & {
    call: ActivepiecesAiCall | undefined
}

