import { activepiecesAiCost } from '@activepieces/server-utils'
import { LanguageModelV4StreamPart, SharedV4ProviderMetadata } from '@ai-sdk/provider'
import { LanguageModel, wrapLanguageModel } from 'ai'

function track({ model }: { model: LanguageModel }): CostTrackedModel {
    if (typeof model === 'string') {
        return { model, costUsd: () => null }
    }
    const ledger = createLedger()
    const record = (providerMetadata: SharedV4ProviderMetadata | undefined): void => ledger.record(activepiecesAiCost.openRouterCostOf(providerMetadata))
    const wrapped = wrapLanguageModel({
        model,
        middleware: {
            transformParams: async ({ params }) => ({
                ...params,
                providerOptions: {
                    ...params.providerOptions,
                    openrouter: { ...params.providerOptions?.['openrouter'], usage: { include: true } },
                },
            }),
            wrapGenerate: async ({ doGenerate }) => {
                const result = await doGenerate()
                ledger.countCall()
                record(result.providerMetadata)
                return result
            },
            wrapStream: async ({ doStream }) => {
                const { stream, ...rest } = await doStream()
                ledger.countCall()
                return {
                    ...rest,
                    stream: stream.pipeThrough(new TransformStream<LanguageModelV4StreamPart, LanguageModelV4StreamPart>({
                        transform: (chunk, controller) => {
                            if (chunk.type === 'finish') {
                                record(chunk.providerMetadata)
                            }
                            controller.enqueue(chunk)
                        },
                    })),
                }
            },
        },
    })
    return {
        model: wrapped,
        costUsd: ledger.costUsd,
    }
}

function createLedger(): CostLedger {
    let calls = 0
    let reported = 0
    let totalUsd = 0
    return {
        countCall: () => {
            calls += 1
        },
        record: (cost) => {
            if (cost !== undefined) {
                reported += 1
                totalUsd += cost
            }
        },
        costUsd: () => reported === calls ? totalUsd : null,
    }
}

export const costCapture = {
    track,
    createLedger,
}

export type CostTrackedModel = {
    model: LanguageModel
    costUsd: () => number | null
}

export type CostLedger = {
    countCall: () => void
    record: (costUsd: number | undefined) => void
    costUsd: () => number | null
}
