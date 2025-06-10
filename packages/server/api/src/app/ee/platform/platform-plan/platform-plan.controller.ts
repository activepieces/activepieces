import { CreateSubscriptionParamsSchema, EnableAiCreditUsageParamsSchema, isUpgradeExperience, PlanName, UpdateSubscriptionParamsSchema } from '@activepieces/ee-shared'
import { ActivepiecesError, assertNotNullOrUndefined, ErrorCode, isNil, PlatformBillingInformation, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import Stripe from 'stripe'
import { platformService } from '../../../platform/platform.service'
import { platformMustBeOwnedByCurrentUser } from '../../authentication/ee-authorization'
import { platformUsageService } from '../platform-usage-service'
import { platformPlanService } from './platform-plan.service'
import { stripeHelper, TASKS_PRICE_ID } from './stripe-helper'


async function getNextBillingInfo(
    stripe: Stripe, 
    subscriptionId: string | null, 
    defaultBillingDate: string,
) {
    if (isNil(subscriptionId)) {
        return {
            nextBillingAmount: 0,
            actualNextBillingDate: defaultBillingDate,
        }
    }
    
    const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
        subscription: subscriptionId,
    })
    
    const containsTasks = upcomingInvoice.lines.data.some(
        line => line.price?.id === TASKS_PRICE_ID,
    )
    
    const nextBillingAmount = upcomingInvoice.amount_due ? upcomingInvoice.amount_due / 100 : 0
    
    const actualNextBillingDate = containsTasks || isNil(upcomingInvoice.next_payment_attempt)
        ? defaultBillingDate
        : new Date(upcomingInvoice.next_payment_attempt * 1000).toISOString()
    
    return { nextBillingAmount, actualNextBillingDate }
}

export const platformPlanController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.addHook('preHandler', platformMustBeOwnedByCurrentUser)
    
    fastify.get('/info', InfoRequest, async (request: FastifyRequest) => {
        const platform = await platformService.getOneOrThrow(request.principal.platform.id)
        const stripe = stripeHelper(request.log).getStripe()
        assertNotNullOrUndefined(stripe, 'Stripe is not configured')
        
        const [platformBilling, usage] = await Promise.all([
            platformPlanService(request.log).getOrCreateForPlatform(platform.id),
            platformUsageService(request.log).getPlatformUsage(platform.id),
        ])
        
        const nextBillingDate = platformUsageService(request.log).getCurrentBillingPeriodEnd()
        
        const { nextBillingAmount, actualNextBillingDate } = await getNextBillingInfo(
            stripe, 
            platformBilling.stripeSubscriptionId ?? null, 
            nextBillingDate,
        )
        
        const response: PlatformBillingInformation = {
            plan: platformBilling,
            usage,
            nextBillingDate: actualNextBillingDate,
            nextBillingAmmount: nextBillingAmount,
        }
        
        return response
    })

    fastify.post('/portal', {}, async (request) => {
        return {
            portalLink: await stripeHelper(request.log).createPortalSessionUrl({ platformId: request.principal.platform.id }),
        }
    })

    fastify.post('/set-ai-credit-usage-limit', EnableAiCreditUsageRequest, async (request) => {
        const platformBilling = await platformPlanService(request.log).getOrCreateForPlatform(request.principal.platform.id)
        const { limit } = request.body

        if (platformBilling.plan === PlanName.FREE) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'AI credit usage is only available for paid plans',
                },
            })
        }
        
        return platformPlanService(request.log).update({
            platformId: request.principal.platform.id,
            aiCreditsLimit: limit,
        })
    })

    fastify.post('/create-subscription', CreateSubscriptionRequest, async (request) => {
        const platformBilling = await platformPlanService(request.log).getOrCreateForPlatform(request.principal.platform.id)
        const customerId = platformBilling.stripeCustomerId
        assertNotNullOrUndefined(customerId, 'Stripe customer id is not set')

        const { plan } = request.body

        return stripeHelper(request.log).createSubscriptionCheckoutUrl(
            customerId,
            { plan },
        )

    })

    fastify.post('/update-subscription', UpgradeRequest, async (request) => {
        const platformBilling = await platformPlanService(request.log).getOrCreateForPlatform(request.principal.platform.id)
        const customerId = platformBilling.stripeCustomerId
        assertNotNullOrUndefined(customerId, 'Stripe customer id is not set')

        const { plan, extraUsers } = request.body

        const currentPlan = platformBilling.plan as PlanName ?? PlanName.FREE
        const upgradeExperience = isUpgradeExperience(currentPlan, plan)

        if (!upgradeExperience) {
            return platformPlanService(request.log).handleDowngrade(platformBilling, { plan })
        }

        return platformPlanService(request.log).handleUpgrade(platformBilling, { plan, extraUsers })
    })
}

const InfoRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    resposne: {
        [StatusCodes.OK]: PlatformBillingInformation,
    },
}

const UpgradeRequest = {
    schema: {
        body: UpdateSubscriptionParamsSchema,
    },
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
}


const CreateSubscriptionRequest = {
    schema: {
        body: CreateSubscriptionParamsSchema,
    },
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
}


const EnableAiCreditUsageRequest = {
    schema: {
        body: EnableAiCreditUsageParamsSchema,
    },
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
}