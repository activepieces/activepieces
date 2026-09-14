import { isNil } from '@activepieces/core-utils'
import { PlanName, TelemetryEventName } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { distributedStore } from '../../../database/redis-connections'
import { telemetry } from '../../../helper/telemetry.utils'
import { platformService } from '../../../platform/platform.service'
import { platformPlanRepo } from './platform-plan.service'

export const platformPlanTelemetry = (log: FastifyBaseLogger) => ({
    async onCheckoutStarted({ platformId, planId }: CheckoutStartedParams): Promise<void> {
        await telemetry(log).trackPlatform({
            platformId,
            event: {
                name: TelemetryEventName.CHECKOUT_STARTED,
                payload: { platformId, plan: planId },
            },
        })
    },

    async onCancelled({ platformId }: PlanActionParams): Promise<void> {
        const plan = await currentPlanName({ platformId })
        await telemetry(log).trackPlatform({
            platformId,
            event: {
                name: TelemetryEventName.PLAN_CANCELLED,
                payload: { platformId, plan },
            },
        })
    },

    async onReactivated({ platformId }: PlanActionParams): Promise<void> {
        const plan = await currentPlanName({ platformId })
        await telemetry(log).trackPlatform({
            platformId,
            event: {
                name: TelemetryEventName.PLAN_REACTIVATED,
                payload: { platformId, plan },
            },
        })
    },

    async onEntitlementsRefreshed({ platformId, previousPlan, plan, trialEndsAt }: EntitlementsRefreshedParams): Promise<void> {
        if (plan === previousPlan) {
            return
        }
        const platform = await platformService(log).getOneOrThrow(platformId)
        await telemetry(log).identifyPlatformGroup({
            platformId,
            properties: { name: platform.name, plan, createdAt: platform.created },
        })
        if (isNil(plan) || FREE_PLANS.has(plan)) {
            return
        }
        await distributedStore.runOnceWithin(
            planChangeKey({ platformId, previousPlan, plan }),
            PLAN_CHANGE_ONCE_SECONDS,
            () => trackPlanChange({ platformId, previousPlan, plan, trialEndsAt, log }),
        )
    },
})

async function trackPlanChange({ platformId, previousPlan, plan, trialEndsAt, log }: TrackPlanChangeParams): Promise<void> {
    const trialing = !isNil(trialEndsAt) && new Date(trialEndsAt).getTime() > Date.now()
    if (trialing) {
        await telemetry(log).trackPlatform({
            platformId,
            event: {
                name: TelemetryEventName.TRIAL_STARTED,
                payload: { platformId, plan, trialEndsAt },
            },
        })
        return
    }
    await telemetry(log).trackPlatform({
        platformId,
        event: {
            name: TelemetryEventName.PLAN_UPGRADED,
            payload: { platformId, plan, previousPlan: previousPlan ?? undefined },
        },
    })
}

function planChangeKey({ platformId, previousPlan, plan }: PlanChangeKeyParams): string {
    return `telemetry:plan-change:${platformId}:${previousPlan ?? 'none'}:${plan}`
}

async function currentPlanName({ platformId }: PlanActionParams): Promise<string> {
    const platformPlan = await platformPlanRepo().findOneBy({ platformId })
    return platformPlan?.plan ?? UNKNOWN_PLAN
}

const UNKNOWN_PLAN = 'unknown'

const PLAN_CHANGE_ONCE_SECONDS = 24 * 60 * 60

const FREE_PLANS: ReadonlySet<string> = new Set([PlanName.FREE, PlanName.FREE_LEGACY, PlanName.APPSUMO])

type PlanActionParams = {
    platformId: string
}

type CheckoutStartedParams = PlanActionParams & {
    planId: string
}

type EntitlementsRefreshedParams = {
    platformId: string
    previousPlan: string | null
    plan: string | null
    trialEndsAt: string | null
}

type PlanChangeKeyParams = {
    platformId: string
    previousPlan: string | null
    plan: string
}

type TrackPlanChangeParams = PlanChangeKeyParams & {
    trialEndsAt: string | null
    log: FastifyBaseLogger
}
