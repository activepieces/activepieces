import { PlatformId } from '@activepieces/core-utils'
import { FastifyBaseLogger } from 'fastify'
import { In } from 'typeorm'
import { EventDestinationHooks, IsDeliveryEntitledParams, ListDeliveryEntitledPlatformIdsParams } from '../../event-destinations/event-destinations-hooks'
import { platformPlanRepo, platformPlanService } from '../platform/platform-plan/platform-plan.service'

export const eventDestinationEntitlementHooks = (log: FastifyBaseLogger): EventDestinationHooks => ({
    async isDeliveryEntitled({ platformId }: IsDeliveryEntitledParams): Promise<boolean> {
        const plan = await platformPlanService(log).getOrCreateForPlatform(platformId)
        return plan.eventStreamingEnabled
    },
    async listDeliveryEntitledPlatformIds({ platformIds }: ListDeliveryEntitledPlatformIdsParams): Promise<PlatformId[]> {
        if (platformIds.length === 0) {
            return []
        }
        const plans = await platformPlanRepo().find({
            where: { platformId: In(platformIds), eventStreamingEnabled: true },
            select: { platformId: true },
        })
        return plans.map((plan) => plan.platformId)
    },
})
