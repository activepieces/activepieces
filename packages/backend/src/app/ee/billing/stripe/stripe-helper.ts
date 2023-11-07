import Stripe from 'stripe'
import { system } from '../../../helper/system/system'
import { SystemProp } from '../../../helper/system/system-prop'
import { plansService } from '../plans/plan.service'
import { ProjectId, UserMeta } from '@activepieces/shared'
import { captureException } from '../../../helper/logger'
import { billingService } from '../billing.service'
import { PlanName, UpgradeRequest, platformTasksPriceId, platformUserPriceId, proUserPriceId } from '@activepieces/ee-shared'
import { FlowPlanLimits } from '../plans/pricing-plans'

const stripeSecret = system.get(SystemProp.STRIPE_SECRET_KEY)!
const stripeWebhookSecret = system.get(SystemProp.STRIPE_WEBHOOK_SECRET)!
const stripe = new Stripe(stripeSecret, {
    apiVersion: '2023-10-16',
})

async function createCustomer(user: UserMeta, projectId: ProjectId): Promise<string> {
    const customer = await stripe.customers.create({
        email: user.email,
        name: user.firstName + ' ' + user.lastName,
        description: 'User Id: ' + user.id + ' Project Id: ' + projectId,
    })
    return customer.id
}

enum StripeProductType {
    PRO = 'PRO',
    PRO_USER = 'PRO_USER',
}

function parseDetailsFromStripePlan(sub: Stripe.Subscription): FlowPlanLimits {
    const flowPlanLimits = {
        nickname: 'empty',
        tasks: 0,
        minimumPollingInterval: 5,
        connections: 0,
        teamMembers: 0,
        activeFlows: 0,
    }
    for (const plan of sub.items.data) {
        const productType = plan.price.metadata.type ?? StripeProductType.PRO
        switch (productType) {
            case StripeProductType.PRO: {
                const { tasks, activeFlows, minimumPollingInterval, connections, teamMembers } = plan.price.metadata
                flowPlanLimits.nickname = plan.plan.nickname!
                flowPlanLimits.activeFlows += Number(activeFlows)
                flowPlanLimits.tasks += Number(tasks)
                flowPlanLimits.minimumPollingInterval = Number(minimumPollingInterval)
                flowPlanLimits.connections += Number(connections)
                flowPlanLimits.teamMembers += Number(teamMembers)
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
    // TODO bot is not yet supported
    await stripe.subscriptions.update(subscriptionId, {
        items: getPlanProducts(request),
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
    try {
        const plan = await plansService.getOrCreateDefaultPlan({ projectId })

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: getPlanProducts(request),
            mode: 'subscription',
            success_url: 'https://cloud.activepieces.com',
            cancel_url: 'https://cloud.activepieces.com',
            customer: plan.stripeCustomerId,
            subscription_data: {
                trial_settings: {
                    end_behavior: {
                        missing_payment_method: 'cancel',
                    },
                },
                trial_period_days: 14,
            },
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
            lineItems.push({
                price: request.priceId,
                quantity: 1,
            })
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

async function handleWebhook({ payload, signature }: { payload: string, signature: string }): Promise<void> {
    const webhook = stripe.webhooks.constructEvent(payload, signature, stripeWebhookSecret)
    const subscription = webhook.data.object as Stripe.Subscription
    const stripeCustomerId = subscription.customer as string
    const projectPlan = await plansService.getByStripeCustomerId({
        stripeCustomerId,
    })
    switch (webhook.type) {
        case 'customer.subscription.deleted':
        case 'customer.subscription.updated':
        case 'customer.subscription.created': {
            await billingService.update({ subscription, projectPlanId: projectPlan.id })
            break
        }
        default:
            throw new Error('Unkown type ' + webhook.type)
    }
}

export const stripeHelper = {
    parseDetailsFromStripePlan,
    createPortalSessionUrl,
    handleWebhook,
    createPaymentLink,
    upgrade,
    createCustomer,
}