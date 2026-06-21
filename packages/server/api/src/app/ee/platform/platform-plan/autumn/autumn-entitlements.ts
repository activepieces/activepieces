import { isNil } from '@activepieces/core-utils'
import { AutumnEntitlements, AutumnFeatureBalance, projectAutumnEntitlements } from '@activepieces/shared'
import { GetCustomerResponse } from 'autumn-js'
import { FastifyBaseLogger } from 'fastify'
import { platformPlanService } from '../platform-plan.service'
import { resolveAutumnClientForPlatform } from './autumn-platform-client'

export async function refreshEntitlements(log: FastifyBaseLogger, platformId: string): Promise<void> {
    const client = await resolveAutumnClientForPlatform(log, platformId)
    if (isNil(client)) {
        return
    }
    const customer = await client.getCustomer()
    const projection = projectAutumnEntitlements(toAutumnEntitlements(customer))
    await platformPlanService(log).update({ platformId, ...projection })
}

function toAutumnEntitlements(customer: GetCustomerResponse): AutumnEntitlements {
    const flags: Record<string, boolean> = {}
    for (const featureId of Object.keys(customer.flags)) {
        flags[featureId] = true
    }

    const balances: Record<string, AutumnFeatureBalance> = {}
    for (const [featureId, balance] of Object.entries(customer.balances)) {
        balances[featureId] = {
            granted: balance.granted,
            usage: balance.usage,
            remaining: balance.remaining,
            unlimited: balance.unlimited,
            nextResetAt: balance.nextResetAt,
        }
    }

    const basePlan = customer.subscriptions.find((subscription) => !subscription.addOn)
    return {
        planId: basePlan?.planId ?? null,
        flags,
        balances,
    }
}
