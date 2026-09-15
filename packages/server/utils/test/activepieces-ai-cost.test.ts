import { ActivepiecesAiBilling, ActivepiecesAiConsumerSource, ActivepiecesAiCostEvent, aiChargeFor, AiChargeBasis, AIProviderName, aiProviderCredentials } from '@activepieces/core-utils'
import { EmbeddingModelV4, LanguageModelV4 } from '@ai-sdk/provider'
import { EmbeddingModel, LanguageModel } from 'ai'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { activepiecesAiCost, UnbilledCallReason } from '../src/activepieces-ai-cost'
import { Generation } from '../src/openrouter-generation'

const generationLookup = vi.hoisted(() => ({
    answer: async (): Promise<Generation | undefined> => undefined,
}))

vi.mock('../src/openrouter-generation', () => ({
    lookupGeneration: () => generationLookup.answer(),
}))

const BILLING: ActivepiecesAiBilling = {
    source: ActivepiecesAiConsumerSource.AI_STEP_IN_FLOW,
    platformId: 'platform-1',
    projectId: 'project-1',
    flowRun: { flowId: 'flow-1', flowRunId: 'run-1' },
}

const MANAGED_KEY = 'sk-or-managed'

const reported: ActivepiecesAiCostEvent[] = []

function modelReturning(result: Record<string, unknown>): LanguageModelV4 {
    return {
        specificationVersion: 'v4',
        provider: 'test',
        modelId: 'test-model',
        supportedUrls: {},
        doGenerate: async () => result as unknown as Awaited<ReturnType<LanguageModelV4['doGenerate']>>,
        doStream: async () => ({ stream: new ReadableStream() }),
    }
}

function embeddingModelReturning(result: Record<string, unknown>): EmbeddingModelV4 {
    return {
        specificationVersion: 'v4',
        provider: 'test',
        modelId: 'test-embedding',
        maxEmbeddingsPerCall: undefined,
        supportsParallelCalls: true,
        doEmbed: async () => result as unknown as Awaited<ReturnType<EmbeddingModelV4['doEmbed']>>,
    }
}

async function generateWith(model: ReturnType<typeof activepiecesAiCost.billedLanguageModel>): Promise<void> {
    if (typeof model === 'string') {
        throw new Error('expected a model object')
    }
    await model.doGenerate({ prompt: [] })
}

async function embedWith(model: EmbeddingModel): Promise<void> {
    if (typeof model === 'string') {
        throw new Error('expected a model object')
    }
    await model.doEmbed({ values: ['hello'] })
}

function streamingModel({ provider, apiKey, chunks = [{ type: 'response-metadata', id: 'gen-stream' }] }: {
    provider: AIProviderName
    apiKey?: string
    chunks?: Record<string, unknown>[]
}): LanguageModel {
    const raw: LanguageModelV4 = {
        specificationVersion: 'v4',
        provider: 'test',
        modelId: 'test-model',
        supportedUrls: {},
        doGenerate: async () => ({}) as unknown as Awaited<ReturnType<LanguageModelV4['doGenerate']>>,
        doStream: async () => ({ stream: sourceOf(chunks) }),
    }
    return activepiecesAiCost.billedLanguageModel({
        model: raw,
        provider,
        modelId: 'anthropic/claude-sonnet-5',
        billing: BILLING,
        charge: chargeFor({ provider, apiKey }),
    })
}

function chargeFor({ provider, apiKey, turnAlreadyCharged }: { provider: AIProviderName, apiKey?: string, turnAlreadyCharged?: boolean }) {
    return aiChargeFor({ credentials: aiProviderCredentials({ provider, auth: { apiKey }, config: {} }), turnAlreadyCharged })
}

function sourceOf(chunks: Record<string, unknown>[]): ReadableStream {
    const source = new TransformStream()
    providerSide = source.writable.getWriter()
    pendingChunks = chunks
    return source.readable
}

async function streamThen(model: LanguageModel, act: (handles: { reader: ReadableStreamDefaultReader, writer: WritableStreamDefaultWriter }) => Promise<unknown>): Promise<void> {
    if (typeof model === 'string') {
        throw new Error('expected a model object')
    }
    const { stream } = await model.doStream({ prompt: [] })
    const reader = stream.getReader()
    const writer = providerSide
    for (const chunk of pendingChunks) {
        const delivered = reader.read()
        await writer.write(chunk)
        await delivered
    }
    await act({ reader, writer })
}

function settled(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 20))
}

let providerSide: WritableStreamDefaultWriter
let pendingChunks: Record<string, unknown>[] = []

beforeEach(() => {
    reported.length = 0
    generationLookup.answer = async () => undefined
    activepiecesAiCost.setReporter((event) => reported.push(event))
})

afterEach(() => {
    activepiecesAiCost.setReporter(() => undefined)
})

describe('what a model call reports back for billing', () => {
    it('bills a managed call on the dollar cost OpenRouter reports', async () => {
        const model = activepiecesAiCost.billedLanguageModel({
            model: modelReturning({
                content: [],
                finishReason: 'stop',
                usage: { inputTokens: { total: 100 }, outputTokens: { total: 20 } },
                response: { id: 'gen-abc' },
                providerMetadata: { openrouter: { usage: { cost: 0.0042 } } },
            }),
            provider: AIProviderName.ACTIVEPIECES,
            modelId: 'anthropic/claude-sonnet-5',
            billing: BILLING,
            charge: chargeFor({ provider: AIProviderName.ACTIVEPIECES }),
        })

        await generateWith(model)

        expect(reported).toHaveLength(1)
        expect(reported[0].call).toEqual({
            charge: AiChargeBasis.PROVIDER_REPORTED_COST,
            generationId: 'gen-abc',
            costUsd: 0.0042,
            inputTokens: 100,
            outputTokens: 20,
        })
    })

    it('bills a call on the customer own key at one fixed credit, whatever it cost us', async () => {
        const model = activepiecesAiCost.billedLanguageModel({
            model: modelReturning({
                content: [],
                finishReason: 'stop',
                usage: { inputTokens: { total: 7 }, outputTokens: { total: 3 } },
                response: { id: 'resp-1' },
            }),
            provider: AIProviderName.OPENAI,
            modelId: 'gpt-5',
            billing: BILLING,
            charge: chargeFor({ provider: AIProviderName.OPENAI }),
        })

        await generateWith(model)

        expect(reported).toHaveLength(1)
        expect(reported[0].call).toEqual({
            charge: AiChargeBasis.FIXED_CREDITS,
            credits: 1,
            generationId: 'resp-1',
            inputTokens: 7,
            outputTokens: 3,
        })
    })

    it('counts a managed call whose cost never arrived, instead of quietly billing nothing', async () => {
        activepiecesAiCost.drainUnbilledCalls()
        const model = activepiecesAiCost.billedLanguageModel({
            model: modelReturning({ content: [], finishReason: 'stop', usage: {}, response: { id: 'gen-xyz' } }),
            provider: AIProviderName.ACTIVEPIECES,
            modelId: 'anthropic/claude-sonnet-5',
            billing: BILLING,
            charge: chargeFor({ provider: AIProviderName.ACTIVEPIECES }),
        })

        await generateWith(model)

        expect(reported).toHaveLength(0)
        expect(activepiecesAiCost.drainUnbilledCalls()).toHaveLength(1)
    })

    it('says which project and model lost the charge, so the page names something to chase', async () => {
        activepiecesAiCost.drainUnbilledCalls()
        const model = activepiecesAiCost.billedLanguageModel({
            model: modelReturning({ content: [], finishReason: 'stop', usage: {}, response: { id: 'gen-xyz' } }),
            provider: AIProviderName.ACTIVEPIECES,
            modelId: 'anthropic/claude-sonnet-5',
            billing: BILLING,
            charge: chargeFor({ provider: AIProviderName.ACTIVEPIECES }),
        })

        await generateWith(model)

        expect(activepiecesAiCost.drainUnbilledCalls()).toEqual([{
            reason: UnbilledCallReason.PROVIDER_REPORTED_NO_COST,
            provider: AIProviderName.ACTIVEPIECES,
            modelId: 'anthropic/claude-sonnet-5',
            source: ActivepiecesAiConsumerSource.AI_STEP_IN_FLOW,
            platformId: 'platform-1',
            projectId: 'project-1',
            flowRunId: 'run-1',
            generationId: 'gen-xyz',
        }])
    })

    it('leaves a model alone when nothing is being billed for it', async () => {
        const raw = modelReturning({ content: [], finishReason: 'stop', usage: {} })
        const model = activepiecesAiCost.billedLanguageModel({
            model: raw,
            provider: AIProviderName.ACTIVEPIECES,
            modelId: 'anthropic/claude-sonnet-5',
            billing: undefined,
            charge: chargeFor({ provider: AIProviderName.ACTIVEPIECES }),
        })

        expect(model).toBe(raw)
        await generateWith(model)
        expect(reported).toHaveLength(0)
    })

    it('leaves a customer own-key call unbilled when its credit is charged once for the whole turn', async () => {
        const model = activepiecesAiCost.billedLanguageModel({
            model: modelReturning({ content: [], finishReason: 'stop', usage: {}, response: { id: 'resp-2' } }),
            provider: AIProviderName.OPENAI,
            modelId: 'gpt-5',
            billing: BILLING,
            charge: chargeFor({ provider: AIProviderName.OPENAI, turnAlreadyCharged: true }),
        })

        await generateWith(model)

        expect(reported).toHaveLength(0)
    })

    it('still bills a managed call on cost when the turn carries the own-key credit, since we pay per call either way', async () => {
        const model = activepiecesAiCost.billedLanguageModel({
            model: modelReturning({
                content: [],
                finishReason: 'stop',
                usage: {},
                response: { id: 'gen-def' },
                providerMetadata: { openrouter: { usage: { cost: 0.001 } } },
            }),
            provider: AIProviderName.ACTIVEPIECES,
            modelId: 'anthropic/claude-sonnet-5',
            billing: BILLING,
            charge: chargeFor({ provider: AIProviderName.ACTIVEPIECES, turnAlreadyCharged: true }),
        })

        await generateWith(model)

        expect(reported).toHaveLength(1)
        expect(reported[0].call).toEqual({ charge: AiChargeBasis.PROVIDER_REPORTED_COST, generationId: 'gen-def', costUsd: 0.001 })
    })

    it('bills an image model call that cannot be wrapped at the same fixed credit', () => {
        activepiecesAiCost.reportFixedCredits({ billing: BILLING, provider: AIProviderName.OPENAI, modelId: 'dall-e-3' })

        expect(reported).toHaveLength(1)
        expect(reported[0].call).toEqual({ charge: AiChargeBasis.FIXED_CREDITS, credits: 1 })
    })
})

describe('an embedding call on the managed provider', () => {
    it('reports what the call cost, so knowledge base search is not served for free', async () => {
        const model = activepiecesAiCost.billedEmbeddingModel({
            model: embeddingModelReturning({
                embeddings: [[0.1]],
                usage: { tokens: 8 },
                providerMetadata: { openrouter: { usage: { cost: 0.000012 } } },
                response: { body: { id: 'embed-1' } },
                warnings: [],
            }),
            provider: AIProviderName.ACTIVEPIECES,
            modelId: 'openai/text-embedding-3-small',
            billing: BILLING,
        })

        await embedWith(model)

        expect(reported).toHaveLength(1)
        expect(reported[0].call).toEqual({
            charge: AiChargeBasis.PROVIDER_REPORTED_COST,
            generationId: 'embed-1',
            costUsd: 0.000012,
            inputTokens: 8,
        })
    })

    it('leaves a customer own-key embedding alone, we are not paying for it', async () => {
        const raw = embeddingModelReturning({
            embeddings: [[0.1]],
            usage: { tokens: 8 },
            providerMetadata: { openrouter: { usage: { cost: 0.5 } } },
            response: { body: { id: 'embed-2' } },
            warnings: [],
        })
        const model = activepiecesAiCost.billedEmbeddingModel({
            model: raw,
            provider: AIProviderName.OPENAI,
            modelId: 'text-embedding-3-small',
            billing: BILLING,
        })

        expect(model).toBe(raw)
        await embedWith(model)
        expect(reported).toHaveLength(0)
    })

    it('counts the call as unbilled when the provider did not say what it cost', async () => {
        activepiecesAiCost.drainUnbilledCalls()
        const model = activepiecesAiCost.billedEmbeddingModel({
            model: embeddingModelReturning({
                embeddings: [[0.1]],
                usage: { tokens: 8 },
                response: { body: { id: 'embed-3' } },
                warnings: [],
            }),
            provider: AIProviderName.ACTIVEPIECES,
            modelId: 'openai/text-embedding-3-small',
            billing: BILLING,
        })

        await embedWith(model)

        expect(reported).toHaveLength(0)
        expect(activepiecesAiCost.drainUnbilledCalls()).toHaveLength(1)
    })

    it('hands the embeddings back untouched, so billing cannot change what search sees', async () => {
        const model = activepiecesAiCost.billedEmbeddingModel({
            model: embeddingModelReturning({
                embeddings: [[0.25, 0.5]],
                usage: { tokens: 4 },
                providerMetadata: { openrouter: { usage: { cost: 0.1 } } },
                response: { body: { id: 'embed-4' } },
                warnings: [],
            }),
            provider: AIProviderName.ACTIVEPIECES,
            modelId: 'openai/text-embedding-3-small',
            billing: BILLING,
        })

        if (typeof model === 'string') {
            throw new Error('expected a model object')
        }
        const { embeddings } = await model.doEmbed({ values: ['hello'] })

        expect(embeddings).toEqual([[0.25, 0.5]])
    })
})

describe('a stream that never reaches its finish chunk', () => {
    it('bills a managed call on the cost the provider reports when the client walks away mid-stream', async () => {
        generationLookup.answer = async () => ({ costUsd: 0.0031, inputTokens: 40, outputTokens: 9 })
        const model = streamingModel({ provider: AIProviderName.ACTIVEPIECES, apiKey: MANAGED_KEY })

        await streamThen(model, ({ reader }) => reader.cancel(new Error('client went away')))
        await settled()

        expect(reported).toHaveLength(1)
        expect(reported[0].call).toEqual({
            charge: AiChargeBasis.PROVIDER_REPORTED_COST,
            generationId: 'gen-stream',
            costUsd: 0.0031,
            inputTokens: 40,
            outputTokens: 9,
        })
    })

    it('bills a managed call the same way when the provider errors part-way through', async () => {
        generationLookup.answer = async () => ({ costUsd: 0.0007 })
        const model = streamingModel({ provider: AIProviderName.ACTIVEPIECES, apiKey: MANAGED_KEY })

        await streamThen(model, ({ writer }) => writer.abort(new Error('provider blew up')).catch(() => undefined))
        await settled()

        expect(reported).toHaveLength(1)
        expect(reported[0].call).toEqual({ charge: AiChargeBasis.PROVIDER_REPORTED_COST, generationId: 'gen-stream', costUsd: 0.0007 })
    })

    it('counts the call as unbilled when the provider cannot tell us what it cost, so the alarm fires', async () => {
        activepiecesAiCost.drainUnbilledCalls()
        const model = streamingModel({ provider: AIProviderName.ACTIVEPIECES, apiKey: MANAGED_KEY })

        await streamThen(model, ({ reader }) => reader.cancel(new Error('client went away')))
        await settled()

        expect(reported).toHaveLength(0)
        expect(activepiecesAiCost.drainUnbilledCalls()).toHaveLength(1)
    })

    it('counts the call as unbilled when the stream died before naming a generation to ask about', async () => {
        activepiecesAiCost.drainUnbilledCalls()
        generationLookup.answer = async () => ({ costUsd: 0.5 })
        const model = streamingModel({ provider: AIProviderName.ACTIVEPIECES, apiKey: MANAGED_KEY, chunks: [] })

        await streamThen(model, ({ reader }) => reader.cancel(new Error('client went away')))
        await settled()

        expect(reported).toHaveLength(0)
        expect(activepiecesAiCost.drainUnbilledCalls()).toHaveLength(1)
    })

    it('counts the call as unbilled when there is no managed key to ask with', async () => {
        activepiecesAiCost.drainUnbilledCalls()
        generationLookup.answer = async () => ({ costUsd: 0.5 })
        const model = streamingModel({ provider: AIProviderName.ACTIVEPIECES })

        await streamThen(model, ({ reader }) => reader.cancel(new Error('client went away')))
        await settled()

        expect(reported).toHaveLength(0)
        expect(activepiecesAiCost.drainUnbilledCalls()).toHaveLength(1)
    })

    it('still charges a customer own-key stream its fixed credit, the call was made either way', async () => {
        const model = streamingModel({ provider: AIProviderName.OPENAI })

        await streamThen(model, ({ reader }) => reader.cancel(new Error('client went away')))
        await settled()

        expect(reported).toHaveLength(1)
        expect(reported[0].call).toEqual({ charge: AiChargeBasis.FIXED_CREDITS, credits: 1, generationId: 'gen-stream' })
    })

    it('bills a finished stream once, and does not ask the provider again as it closes', async () => {
        let asked = 0
        generationLookup.answer = async () => {
            asked += 1
            return { costUsd: 9.99 }
        }
        const model = streamingModel({
            provider: AIProviderName.ACTIVEPIECES,
            apiKey: MANAGED_KEY,
            chunks: [
                { type: 'response-metadata', id: 'gen-stream' },
                { type: 'finish', finishReason: 'stop', usage: { inputTokens: { total: 12 }, outputTokens: { total: 5 } }, providerMetadata: { openrouter: { usage: { cost: 0.002 } } } },
            ],
        })

        await streamThen(model, async ({ reader, writer }) => {
            await writer.close()
            for (;;) {
                const { done } = await reader.read()
                if (done) {
                    return
                }
            }
        })
        await settled()

        expect(asked).toBe(0)
        expect(reported).toHaveLength(1)
        expect(reported[0].call).toEqual({
            charge: AiChargeBasis.PROVIDER_REPORTED_COST,
            generationId: 'gen-stream',
            costUsd: 0.002,
            inputTokens: 12,
            outputTokens: 5,
        })
    })
})
