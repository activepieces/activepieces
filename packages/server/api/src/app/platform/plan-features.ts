import { ActivepiecesError, ErrorCode, PlatformId } from '@activepieces/core-utils'
import { ApEdition, PlatformPlanLimits } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../helper/system/system'
import { platformService } from './platform.service'

export const planFeatures = (log: FastifyBaseLogger) => ({
    async assertEnabled({ platformId, feature, message }: AssertPlanFeatureParams): Promise<void> {
        if (system.getEdition() === ApEdition.COMMUNITY) {
            return
        }
        const { plan } = await platformService(log).getOneWithPlanOrThrow(platformId)
        if (plan[feature] !== true) {
            throw new ActivepiecesError({
                code: ErrorCode.FEATURE_DISABLED,
                params: { message },
            })
        }
    },
})

type AssertPlanFeatureParams = {
    platformId: PlatformId
    feature: PlanFeature
    message: string
}

type PlanFeature = {
    [K in keyof PlatformPlanLimits]-?: NonNullable<PlatformPlanLimits[K]> extends boolean ? K : never
}[keyof PlatformPlanLimits]
