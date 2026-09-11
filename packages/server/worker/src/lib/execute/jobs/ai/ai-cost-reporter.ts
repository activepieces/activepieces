import { apId, isNil, tryCatch } from '@activepieces/core-utils'
import { activepiecesAiCost } from '@activepieces/server-utils'
import { WorkerToApiContract } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'

export function installAiCostReporter({ apiClient, log }: {
    apiClient: WorkerToApiContract
    log: FastifyBaseLogger
}): void {
    activepiecesAiCost.setReporter(({ billing, provider, modelId, call }) => {
        void tryCatch(() => apiClient.reportAiUsage({
            billing,
            provider,
            modelId,
            idempotencyKey: `ai:${apId()}`,
            usage: { type: 'observed-cost', costUsd: call.costUsd },
            generationId: call.generationId,
        })).then(({ error }) => {
            if (isNil(error)) {
                return
            }
            log.error({ error, provider, model: modelId, generationId: call.generationId }, '[aiCostReporter] A managed AI call went unbilled')
        })
    })
}
