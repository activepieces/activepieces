import { isNil, tryCatch } from '@activepieces/core-utils'
import { aiProviderKeyHealth } from '@activepieces/server-utils'
import { FastifyBaseLogger } from 'fastify'
import { aiProviderService } from './ai-provider-service'

export function installAiKeyHealthReporter(log: FastifyBaseLogger): void {
    aiProviderKeyHealth.setReporter(({ platformId, providerConfigId, signal }) => {
        tryCatch(() => aiProviderService(log).recordKeyObservation({ platformId, providerId: providerConfigId, signal })).then(({ error }) => {
            if (isNil(error)) {
                return
            }
            log.warn({ error, aiProvider: { id: providerConfigId } }, '[aiKeyHealthReporter] Could not record key status')
        }).catch(() => undefined)
    })
}
