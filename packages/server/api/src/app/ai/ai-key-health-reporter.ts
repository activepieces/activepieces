import { aiProviderKeyHealth } from '@activepieces/server-utils'
import { FastifyBaseLogger } from 'fastify'
import { aiProviderService } from './ai-provider-service'

export function installAiKeyHealthReporter(log: FastifyBaseLogger): void {
    aiProviderKeyHealth.setReporter(({ platformId, providerConfigId, signal }) => {
        aiProviderService(log).recordKeyObservation({ platformId, providerId: providerConfigId, signal })
            .catch((error) => log.warn({ error, aiProvider: { id: providerConfigId } }, '[aiKeyHealthReporter] Could not record key status'))
    })
}
