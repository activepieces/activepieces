import { isNil } from '@activepieces/core-utils'
import { FastifyBaseLogger } from 'fastify'
import { platformPlanService } from '../platform-plan.service'
import { autumnClient } from './autumn-service'

export async function resolveAutumnClientForPlatform(log: FastifyBaseLogger, platformId: string): Promise<AutumnPlatformClient | null> {
    const { autumnCustomerId, autumnApiKey } = await platformPlanService(log).getAutumnCredentials(platformId)
    if (isNil(autumnCustomerId) || isNil(autumnApiKey)) {
        return null
    }
    return autumnClient({ secretKey: autumnApiKey, customerId: autumnCustomerId })
}

export type AutumnPlatformClient = ReturnType<typeof autumnClient>
