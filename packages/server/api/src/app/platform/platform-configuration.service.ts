import { apId, isEmpty, isNil, spreadIfNotUndefined } from '@activepieces/core-utils'
import { PlatformConfiguration, UpdatePlatformConfigurationRequestBody } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../core/db/repo-factory'
import { distributedLock } from '../database/redis-connections'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { PlatformConfigurationEntity } from './platform-configuration.entity'

const platformConfigurationRepo = repoFactory(PlatformConfigurationEntity)

const CREATE_LOCK_TIMEOUT_SECONDS = 60

export const platformConfigurationService = (log: FastifyBaseLogger) => ({
    async getOrCreateForPlatform({ platformId }: GetOrCreateParams): Promise<PlatformConfiguration> {
        const existing = await platformConfigurationRepo().findOneBy({ platformId })
        if (!isNil(existing)) {
            return existing
        }

        return distributedLock(log).runExclusive({
            key: `platform_configuration_${platformId}`,
            timeoutInSeconds: CREATE_LOCK_TIMEOUT_SECONDS,
            fn: async () => {
                const configuration = await platformConfigurationRepo().findOneBy({ platformId })
                if (!isNil(configuration)) {
                    return configuration
                }
                return createInitialConfiguration({ platformId })
            },
        })
    },

    async update({ platformId, isProductTelemetryEnabled, isInfraSetupTelemetryEnabled }: UpdateParams): Promise<PlatformConfiguration> {
        await this.getOrCreateForPlatform({ platformId })
        const patch = {
            ...spreadIfNotUndefined('isProductTelemetryEnabled', isProductTelemetryEnabled),
            ...spreadIfNotUndefined('isInfraSetupTelemetryEnabled', isInfraSetupTelemetryEnabled),
        }
        if (!isEmpty(patch)) {
            await platformConfigurationRepo().update({ platformId }, patch)
        }
        return platformConfigurationRepo().findOneByOrFail({ platformId })
    },
})

async function createInitialConfiguration({ platformId }: GetOrCreateParams): Promise<PlatformConfiguration> {
    const isProductTelemetryEnabled = system.getBoolean(AppSystemProp.TELEMETRY_ENABLED)
    return platformConfigurationRepo().save({
        id: apId(),
        platformId,
        ...spreadIfNotUndefined('isProductTelemetryEnabled', isProductTelemetryEnabled),
    })
}

type GetOrCreateParams = {
    platformId: string
}

type UpdateParams = GetOrCreateParams & UpdatePlatformConfigurationRequestBody
