import { ActivepiecesAiBilling, ActivepiecesAiCall, ActivepiecesAiCostReporter, AIProviderName, isNil, spreadIfDefined } from '@activepieces/core-utils'
import { isJSONObject, LanguageModelV4GenerateResult, LanguageModelV4StreamPart, SharedV4ProviderMetadata } from '@ai-sdk/provider'
import { LanguageModel, wrapLanguageModel } from 'ai'
import { z } from 'zod'

export function billedLanguageModel({ model, provider, modelId, billing, ownKeyCredit = 'per-call' }: BilledLanguageModelParams): LanguageModel {
    if (isNil(billing) || typeof model === 'string') {
        return model
    }
    if (provider !== AIProviderName.ACTIVEPIECES) {
        return ownKeyCredit === 'per-call' ? billedAtAFlatRate({ model, provider, modelId, billing }) : model
    }
    return wrapLanguageModel({
        model,
        middleware: {
            wrapGenerate: async ({ doGenerate }) => {
                const result = await doGenerate()
                reportUsage({ billing, provider, modelId, call: toGeneratedCall(result) })
                return result
            },
            wrapStream: async ({ doStream }) => {
                const { stream, ...rest } = await doStream()
                return { ...rest, stream: stream.pipeThrough(streamCostObserver({ billing, provider, modelId })) }
            },
        },
    })
}

function billedAtAFlatRate({ model, provider, modelId, billing }: BilledAtAFlatRateParams): LanguageModel {
    return wrapLanguageModel({
        model,
        middleware: {
            wrapGenerate: async ({ doGenerate }) => {
                const result = await doGenerate()
                reportFlatCredits({ billing, provider, modelId, generationId: result.response?.id })
                return result
            },
            wrapStream: async ({ doStream }) => {
                const { stream, ...rest } = await doStream()
                return { ...rest, stream: stream.pipeThrough(flatCreditObserver({ billing, provider, modelId })) }
            },
        },
    })
}

export function reportFlatCredits({ billing, provider, modelId, generationId }: ReportFlatCreditsParams): void {
    if (isNil(reporter)) {
        unreportedCalls += 1
        return
    }
    reporter({ billing, provider, modelId, call: { charge: 'flat-credits', credits: FLAT_CREDITS_PER_MODEL_CALL, ...spreadIfDefined('generationId', generationId) } })
}

export function observedEmbeddingFetch({ provider, modelId, billing, wrapped }: ObservedEmbeddingFetchParams): typeof globalThis.fetch | undefined {
    if (provider !== AIProviderName.ACTIVEPIECES || isNil(billing)) {
        return wrapped
    }
    const send = wrapped ?? fetch
    return async (input, init) => {
        const response = await send(input, init)
        void readEmbeddingCall(response)
            .then((call) => reportUsage({ billing, provider, modelId, call }))
            .catch(() => undefined)
        return response
    }
}

function toGeneratedCall(result: LanguageModelV4GenerateResult): ActivepiecesAiCall | undefined {
    return toCall({ generationId: result.response?.id, providerMetadata: result.providerMetadata })
}

function streamCostObserver({ billing, provider, modelId }: ObserverParams): TransformStream<LanguageModelV4StreamPart, LanguageModelV4StreamPart> {
    let generationId: string | undefined
    let reported = false
    return new TransformStream({
        transform: (chunk, controller) => {
            if (chunk.type === 'response-metadata') {
                generationId = chunk.id ?? generationId
            }
            if (chunk.type === 'finish' && !reported) {
                reported = true
                reportUsage({ billing, provider, modelId, call: toCall({ generationId, providerMetadata: chunk.providerMetadata }) })
            }
            controller.enqueue(chunk)
        },
    })
}

function flatCreditObserver({ billing, provider, modelId }: ObserverParams): TransformStream<LanguageModelV4StreamPart, LanguageModelV4StreamPart> {
    let generationId: string | undefined
    let reported = false
    return new TransformStream({
        transform: (chunk, controller) => {
            if (chunk.type === 'response-metadata') {
                generationId = chunk.id ?? generationId
            }
            if (chunk.type === 'finish' && !reported) {
                reported = true
                reportFlatCredits({ billing, provider, modelId, generationId })
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
        charge: 'observed-cost',
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
        charge: 'observed-cost',
        generationId: body.id,
        costUsd: body.usage.cost,
        ...(isNil(body.usage.prompt_tokens) ? {} : { inputTokens: body.usage.prompt_tokens }),
    }
}

function parseOrUndefined<T extends z.ZodType>(schema: T, value: unknown): z.infer<T> | undefined {
    const parsed = schema.safeParse(value)
    return parsed.success ? parsed.data : undefined
}

function reportUsage({ billing, provider, modelId, call }: ReportUsageParams): void {
    if (isNil(call)) {
        unreportedCalls += 1
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

const FLAT_CREDITS_PER_MODEL_CALL = 1

export const activepiecesAiCost = {
    setReporter: (next: ActivepiecesAiCostReporter): void => {
        reporter = next
    },
    unreportedCallCount: (): number => unreportedCalls,
    billedLanguageModel,
    observedEmbeddingFetch,
    reportFlatCredits,
}

type OpenRouterUsage = z.infer<typeof OpenRouterUsage>

type BilledLanguageModelParams = {
    model: LanguageModel
    provider: AIProviderName
    modelId: string
    billing: ActivepiecesAiBilling | undefined
    ownKeyCredit?: OwnKeyCredit
}

export type OwnKeyCredit = 'per-call' | 'charged-with-the-turn'

type ObservedEmbeddingFetchParams = {
    provider: AIProviderName
    modelId: string
    billing: ActivepiecesAiBilling | undefined
    wrapped: typeof globalThis.fetch | undefined
}

type BilledAtAFlatRateParams = {
    model: Exclude<LanguageModel, string>
    provider: AIProviderName
    modelId: string
    billing: ActivepiecesAiBilling
}

type ReportFlatCreditsParams = {
    billing: ActivepiecesAiBilling
    provider: AIProviderName
    modelId: string
    generationId?: string
}

type ObserverParams = {
    billing: ActivepiecesAiBilling
    provider: AIProviderName
    modelId: string
}

type ReportUsageParams = ObserverParams & {
    call: ActivepiecesAiCall | undefined
}

