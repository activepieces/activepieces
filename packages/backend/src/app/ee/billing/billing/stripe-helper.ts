import Stripe from 'stripe'
import { system } from '../../../helper/system/system'
import { SystemProp } from '../../../helper/system/system-prop'
import { ApEdition, ProjectId, UserMeta, assertNotNullOrUndefined } from '@activepieces/shared'
import { captureException } from '../../../helper/logger'
import { PlanName, UpgradeRequest, platformTasksPriceId, platformUserPriceId, proUserPriceId } from '@activepieces/shared'
import { FlowPlanLimits } from '../project-plan/pricing-plans'
import { plansService } from '../project-plan/project-plan.service'
import { getEdition } from '../../../helper/secret-helper'

export const stripeWebhookSecret = system.get(SystemProp.STRIPE_WEBHOOK_SECRET)!

function getStripe(): Stripe | undefined {
    const edition = getEdition()
    if (edition !== ApEdition.CLOUD) {
        return undefined
    }
    const stripeSecret = system.getOrThrow(SystemProp.STRIPE_SECRET_KEY)
    return new Stripe(stripeSecret, {
        apiVersion: '2023-10-16',
    })
}
enum StripeProductType {
    PRO = 'PRO',
    PRO_USER = 'PRO_USER',
    PLATFORM = 'PLATFORM',
    PLATFORM_USER = 'PLATFORM_USER',
}

async function getOrCreateCustomer(user: UserMeta, projectId: ProjectId): Promise<string | undefined> {
    const edition = getEdition()
    const stripe = getStripe()
    if (edition !== ApEdition.CLOUD) {
        return undefined
    }
    assertNotNullOrUndefined(stripe, 'Stripe is not configured')
    try {
        // Retrieve the customer by their email
        const existingCustomers = await stripe.customers.list({
            email: user.email,
            limit: 1,
        })

        // If a customer with the email exists, update their details
        if (existingCustomers.data.length > 0) {
            const existingCustomer = existingCustomers.data[0]
            return existingCustomer.id
        }

        // If no customer with the email exists, create a new customer
        const newCustomer = await stripe.customers.create({
            email: user.email,
            name: user.firstName + ' ' + user.lastName,
            description: 'User Id: ' + user.id + ' Project Id: ' + projectId,
        })
        return newCustomer.id
    }
    catch (error) {
        captureException(error)
        throw error
    }
}

function parseStripeSubscription(sub: Stripe.Subscription): FlowPlanLimits {
    const flowPlanLimits = {
        nickname: 'empty',
        tasks: 0,
        minimumPollingInterval: 5,
        connections: 0,
        teamMembers: 0,
    }
    for (const plan of sub.items.data) {
        const productType = plan.price.metadata.productType ?? StripeProductType.PRO
        switch (productType) {
            case StripeProductType.PRO: {
                const { tasks, minimumPollingInterval, connections, teamMembers } = plan.price.metadata
                flowPlanLimits.nickname = plan.plan.nickname!
                flowPlanLimits.tasks += Number(tasks) ?? 0
                flowPlanLimits.minimumPollingInterval = Number(minimumPollingInterval)
                flowPlanLimits.connections += Number(connections) ?? 0
                flowPlanLimits.teamMembers += Number(teamMembers) ?? 0
                break
            }
            case StripeProductType.PRO_USER: {
                flowPlanLimits.teamMembers += plan.quantity ?? 0
                break
            }

            default:
                throw new Error(`Unknown product type ${productType}`)
        }
    }
    if (flowPlanLimits.nickname === 'empty') {
        throw new Error('Failed to parse the susbcription id ' + sub.id)
    }
    return flowPlanLimits
}

async function upgrade({
    request,
    subscriptionId,
}: { request: UpgradeRequest, subscriptionId: string }): Promise<{ paymentLink: null }> {
    const stripe = getStripe()
    assertNotNullOrUndefined(stripe, 'Stripe is not configured')
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)
    const products = getPlanProducts(request).map(item => {
        const existingItem = stripeSubscription.items.data.find(f => f.price.id === item.price)
        if (!existingItem) {
            return item
        }
        return {
            id: existingItem.id,
            ...item,
        }
    })
    await stripe.subscriptions.update(subscriptionId, {
        items: products,
    })
    return {
        paymentLink: null,
    }
}

async function createPortalSessionUrl({
    projectId,
}: {
    projectId: ProjectId
}): Promise<string> {
    const stripe = getStripe()
    assertNotNullOrUndefined(stripe, 'Stripe is not configured')
    const plan = await plansService.getOrCreateDefaultPlan({ projectId })
    const session = await stripe.billingPortal.sessions.create({
        customer: plan.stripeCustomerId,
        return_url: 'https://cloud.activepieces.com/',
    })
    return session.url
}

async function createPaymentLink({
    projectId,
    request,
}: {
    projectId: ProjectId
    request: UpgradeRequest
}): Promise<{ paymentLink: string }> {
    const stripe = getStripe()
    assertNotNullOrUndefined(stripe, 'Stripe is not configured')
    try {
        const plan = await plansService.getOrCreateDefaultPlan({ projectId })
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: getPlanProducts(request),
            mode: 'subscription',
            success_url: 'https://cloud.activepieces.com',
            cancel_url: 'https://cloud.activepieces.com',
            customer: plan.stripeCustomerId,
        })
        return {
            paymentLink: session.url!,
        }
    }
    catch (error) {
        captureException(error)
        throw new Error('Failed to create payment link')
    }
}

function getPlanProducts(request: UpgradeRequest) {
    const lineItems = []
    switch (request.plan) {
        case PlanName.PLATFORM:
            lineItems.push({
                price: request.priceId,
                quantity: 1,
            })
            if (request.extraUsers > 0) {
                lineItems.push({
                    price: platformUserPriceId,
                    quantity: request.extraUsers,
                })
            }
            if (request.extraTasks > 0) {
                lineItems.push({
                    price: platformTasksPriceId,
                    quantity: request.extraTasks,
                })
            }
            break
        case PlanName.PRO:
            if (request.priceId && request.priceId.length > 0) {
                lineItems.push({
                    price: request.priceId,
                    quantity: 1,
                })
            }
            if (request.extraUsers > 0) {
                lineItems.push({
                    price: proUserPriceId,
                    quantity: request.extraUsers,
                })
            }
            break
    }
    return lineItems
}

export const stripeHelper = {
    parseStripeSubscription,
    createPortalSessionUrl,
    createPaymentLink,
    upgrade,
    getStripe,
    getOrCreateCustomer,
}