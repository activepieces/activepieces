import { ActivepiecesError, ErrorCode, PlatformId } from '@activepieces/core-utils'
import { ApEdition, PlatformPlanLimits } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import NodeCache from 'node-cache'
import { system } from '../helper/system/system'
import { platformService } from './platform.service'

export const planFeatures = (log: FastifyBaseLogger) => ({
    async isEnabled({ platformId, feature }: PlanFeatureParams): Promise<boolean> {
        if (system.getEdition() === ApEdition.COMMUNITY) {
            return true
        }
        const plan = await getCachedPlan({ log, platformId })
        return plan[feature] === true
    },
    async assertEnabled({ platformId, feature, message }: AssertPlanFeatureParams): Promise<void> {
        const enabled = await planFeatures(log).isEnabled({ platformId, feature })
        if (!enabled) {
            throw new ActivepiecesError({
                code: ErrorCode.FEATURE_DISABLED,
                params: { message },
            })
        }
    },
    forget(platformId: PlatformId): void {
        planCache.del(platformId)
    },
})

async function getCachedPlan({ log, platformId }: GetCachedPlanParams): Promise<PlatformPlanLimits> {
    const cached = planCache.get<PlatformPlanLimits>(platformId)
    if (cached !== undefined) {
        return cached
    }
    const plan = await platformService(log).getPlanForPlatform(platformId)
    planCache.set(platformId, plan)
    return plan
}

const PLAN_CACHE_TTL_SECONDS = 60

const planCache = new NodeCache({ stdTTL: PLAN_CACHE_TTL_SECONDS, checkperiod: PLAN_CACHE_TTL_SECONDS * 2, useClones: false })

type GetCachedPlanParams = {
    log: FastifyBaseLogger
    platformId: PlatformId
}

type PlanFeatureParams = {
    platformId: PlatformId
    feature: PlanFeature
}

type AssertPlanFeatureParams = PlanFeatureParams & {
    message: string
}

export type PlanFeature = {
    [K in keyof PlatformPlanLimits]-?: NonNullable<PlatformPlanLimits[K]> extends boolean ? K : never
}[keyof PlatformPlanLimits]
