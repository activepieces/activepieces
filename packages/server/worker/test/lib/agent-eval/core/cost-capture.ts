import { activepiecesAiCost } from '@activepieces/server-utils'
import { LanguageModelV4StreamPart, SharedV4ProviderMetadata } from '@ai-sdk/provider'
import { LanguageModel, wrapLanguageModel } from 'ai'

function track({ model }: { model: LanguageModel }): CostTrackedModel {
    if (typeof model === 'string') {
        return { model, costUsd: () => null }
    }
    const ledger = { calls: 0, reported: 0, totalUsd: 0 }
    const record = (providerMetadata: SharedV4ProviderMetadata | undefined): void => {
        const cost = activepiecesAiCost.openRouterCostOf(providerMetadata)
        if (cost !== undefined) {
            ledger.reported += 1
            ledger.totalUsd += cost
        }
    }
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
                ledger.calls += 1
                const result = await doGenerate()
                record(result.providerMetadata)
                return result
            },
            wrapStream: async ({ doStream }) => {
                ledger.calls += 1
                const { stream, ...rest } = await doStream()
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
        costUsd: () => ledger.reported === ledger.calls ? ledger.totalUsd : null,
    }
}

export const costCapture = {
    track,
}

export type CostTrackedModel = {
    model: LanguageModel
    costUsd: () => number | null
}
