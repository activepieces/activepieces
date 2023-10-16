import Stripe from 'stripe'
import { PlanLimits, PlanType, defaultPlanInformation } from './plans/pricing-plans'
import { stripeHelper } from './stripe/stripe-helper'
import { plansService } from './plans/plan.service'
import { isNil } from '@activepieces/shared'

export const billingService = {
    async update({ subscription, projectPlanId }: { subscription: Stripe.Subscription | null, projectPlanId: string }): Promise<void> {
        const planTypes = Object.values(PlanType)
        for (const planType of planTypes) {
            const planLimits = findPlanOrReturnFree({ planType, subscription })
            await plansService.update({
                projectPlanId,
                planLimits,
                subscription,
            })
        }        
    },
    async upgrade({ projectId, priceId }: { projectId: string, priceId: string }): Promise<{
        paymentLink: string | null
    }> {
        const plan = await plansService.getOrCreateDefaultPlan({ projectId })
        if (!isNil(plan.stripeSubscriptionId)) {
            return stripeHelper.upgrade({ priceId, subscriptionId: plan.stripeSubscriptionId })
        }
        else {
            return stripeHelper.createPaymentLink({
                projectId,
                priceId,
            })
        }
    },
}

function findPlanOrReturnFree({ planType, subscription }: { planType: PlanType, subscription: Stripe.Subscription | null }): PlanLimits {
    const currentSubscription = subscription?.items.data.find(item => {
        const type = item.plan.metadata?.type ?? PlanType.FLOWS
        return type === planType
    })
    if (currentSubscription && subscription?.status === 'active') {
        return stripeHelper.parseDetailsFromStripePlan(currentSubscription.price)
    }
    return defaultPlanInformation[planType]
}