import { apId, chunk, isEmpty, isNil, spreadIfNotUndefined } from '@activepieces/core-utils'
import { ApEdition, PlatformConfiguration, UpdatePlatformConfigurationRequestBody } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { In } from 'typeorm'
import { repoFactory } from '../core/db/repo-factory'
import { distributedLock } from '../database/redis-connections'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'
import { PlatformConfigurationEntity } from './platform-configuration.entity'

const platformConfigurationRepo = repoFactory(PlatformConfigurationEntity)

const CREATE_LOCK_TIMEOUT_SECONDS = 60
const CONFIGURATION_FILTER_BATCH_SIZE = 1_000

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

    async isProductTelemetryEnabled({ platformId }: GetOrCreateParams): Promise<boolean> {
        if (system.getEdition() === ApEdition.CLOUD) {
            return true
        }
        const configuration = await this.getOrCreateForPlatform({ platformId })
        return configuration.isProductTelemetryEnabled
    },

    async filterProjectsWithProductTelemetryEnabled({ projectIds }: FilterProjectsParams): Promise<string[]> {
        if (projectIds.length === 0) {
            return []
        }
        if (system.getEdition() === ApEdition.CLOUD) {
            return projectIds
        }
        const fallback = system.getBoolean(AppSystemProp.TELEMETRY_ENABLED) ?? true
        const enabled: string[] = []
        for (const batch of chunk(projectIds, CONFIGURATION_FILTER_BATCH_SIZE)) {
            const rows: { id: string }[] = await platformConfigurationRepo().manager
                .createQueryBuilder()
                .select('project.id', 'id')
                .from('project', 'project')
                .leftJoin('platform_configuration', 'configuration', 'configuration."platformId" = project."platformId"')
                .where('project.id IN (:...projectIds)', { projectIds: batch })
                .andWhere('COALESCE(configuration."isProductTelemetryEnabled", :fallback) = true', { fallback })
                .getRawMany()
            enabled.push(...rows.map((row) => row.id))
        }
        return enabled
    },

    async filterPlatformsWithInfraSetupTelemetryEnabled({ platformIds }: FilterPlatformsParams): Promise<string[]> {
        if (platformIds.length === 0) {
            return []
        }
        if (system.getEdition() === ApEdition.CLOUD) {
            return platformIds
        }
        const optedOut: string[] = []
        for (const batch of chunk(platformIds, CONFIGURATION_FILTER_BATCH_SIZE)) {
            const rows = await platformConfigurationRepo().find({
                where: { platformId: In(batch), isInfraSetupTelemetryEnabled: false },
                select: ['platformId'],
            })
            optedOut.push(...rows.map((row) => row.platformId))
        }
        const optedOutIds = new Set(optedOut)
        return platformIds.filter((platformId) => !optedOutIds.has(platformId))
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

type FilterProjectsParams = {
    projectIds: string[]
}

type FilterPlatformsParams = {
    platformIds: string[]
}
