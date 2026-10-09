import { FastifyBaseLogger } from 'fastify'
import { EventDestinationHooks, IsDeliveryEntitledParams } from '../../event-destinations/event-destinations-hooks'
import { platformPlanService } from '../platform/platform-plan/platform-plan.service'

export const eventDestinationEntitlementHooks = (log: FastifyBaseLogger): EventDestinationHooks => ({
    async isDeliveryEntitled({ platformId }: IsDeliveryEntitledParams): Promise<boolean> {
        const plan = await platformPlanService(log).getOrCreateForPlatform(platformId)
        return plan.eventStreamingEnabled
    },
})
