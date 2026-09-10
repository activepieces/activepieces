import { isNil, UserId } from '@activepieces/core-utils'
import { PlanName, TelemetryEventName } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { telemetry } from '../../../helper/telemetry.utils'
import { platformService } from '../../../platform/platform.service'
import { platformPlanService } from './platform-plan.service'

export const platformPlanTelemetry = (log: FastifyBaseLogger) => ({
    async onCheckoutStarted({ platformId, planId, actorUserId }: CheckoutStartedParams): Promise<void> {
        await telemetry(log).trackPlatform({
            platformId,
            actorUserId,
            event: {
                name: TelemetryEventName.CHECKOUT_STARTED,
                payload: { platformId, plan: planId },
            },
        })
    },

    async onCancelled({ platformId, actorUserId }: PlanActionParams): Promise<void> {
        const plan = await currentPlanName({ platformId, log })
        await telemetry(log).trackPlatform({
            platformId,
            actorUserId,
            event: {
                name: TelemetryEventName.PLAN_CANCELLED,
                payload: { platformId, plan },
            },
        })
    },

    async onReactivated({ platformId, actorUserId }: PlanActionParams): Promise<void> {
        const plan = await currentPlanName({ platformId, log })
        await telemetry(log).trackPlatform({
            platformId,
            actorUserId,
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
        if (isNil(plan) || !isPaidPlan(plan)) {
            return
        }
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
    },
})

async function currentPlanName({ platformId, log }: { platformId: string, log: FastifyBaseLogger }): Promise<string> {
    const platformPlan = await platformPlanService(log).getOrCreateForPlatform(platformId)
    return platformPlan.plan ?? UNKNOWN_PLAN
}

function isPaidPlan(plan: string): boolean {
    return !FREE_PLANS.has(plan)
}

const UNKNOWN_PLAN = 'unknown'

const FREE_PLANS: ReadonlySet<string> = new Set([PlanName.FREE, PlanName.FREE_LEGACY])

type PlanActionParams = {
    platformId: string
    actorUserId: UserId
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
