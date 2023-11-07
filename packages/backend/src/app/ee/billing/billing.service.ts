import Stripe from 'stripe'
import { FlowPlanLimits, defaultPlanInformation } from './plans/pricing-plans'
import { stripeHelper } from './stripe/stripe-helper'
import { plansService } from './plans/plan.service'
import { isNil } from '@activepieces/shared'
import { UpgradeRequest } from '@activepieces/ee-shared'

export const billingService = {
    async update({ subscription, projectPlanId }: { subscription: Stripe.Subscription | null, projectPlanId: string }): Promise<void> {
        const planLimits = findPlanOrReturnFree({ subscription })
        await plansService.update({
            projectPlanId,
            planLimits,
            subscription,
        })        
    },
    async upgrade({ projectId, request }: { projectId: string, request: UpgradeRequest }): Promise<{
        paymentLink: string | null
    }> {
        const plan = await plansService.getOrCreateDefaultPlan({ projectId })
        if (!isNil(plan.stripeSubscriptionId)) {
            return stripeHelper.upgrade({ request, subscriptionId: plan.stripeSubscriptionId })
        }
        else {
            return stripeHelper.createPaymentLink({
                projectId,
                request,
            })
        }
    },
}

function findPlanOrReturnFree({ subscription }: { subscription: Stripe.Subscription | null }): FlowPlanLimits {
    if (subscription?.status === 'active') {
        return stripeHelper.parseDetailsFromStripePlan(subscription)
    }
    return defaultPlanInformation
}