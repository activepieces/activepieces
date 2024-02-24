import Stripe from 'stripe'
import { isNil } from '@activepieces/shared'
import { UpgradeRequest } from '@activepieces/ee-shared'
import { plansService } from '../project-plan/project-plan.service'
import {
    FlowPlanLimits,
    defaultPlanInformation,
} from '../project-plan/pricing-plans'
import { stripeHelper } from './stripe-helper'

export const billingService = {
    async update({
        subscription,
        projectId,
    }: {
        subscription: Stripe.Subscription | null
        projectId: string
    }): Promise<void> {
        const planLimits = findPlanOrReturnFree({ subscription })
        await plansService.update({
            projectId,
            planLimits,
            subscription,
        })
    },
}

function findPlanOrReturnFree({
    subscription,
}: {
    subscription: Stripe.Subscription | null
}): FlowPlanLimits {
    if (subscription?.status === 'active') {
        return stripeHelper.parseStripeSubscription(subscription)
    }
    return defaultPlanInformation
}
