import Stripe from 'stripe'
import { system } from '../../../helper/system/system'
import { SystemProp } from '../../../helper/system/system-prop'
import { plansService } from '../plans/plan.service'
import { PlanLimits, PlanType } from '../plans/pricing-plans'
import { ProjectId, UserMeta } from '@activepieces/shared'
import { captureException } from '../../../helper/logger'
import { billingService } from '../billing.service'

const stripeSecret = system.get(SystemProp.STRIPE_SECRET_KEY)!
const stripeWebhookSecret = system.get(SystemProp.STRIPE_WEBHOOK_SECRET)!
const stripe = new Stripe(stripeSecret, {
    apiVersion: '2022-11-15',
})

async function createCustomer(user: UserMeta, projectId: ProjectId): Promise<string> {
    const customer = await stripe.customers.create({
        email: user.email,
        name: user.firstName + ' ' + user.lastName,
        description: 'User Id: ' + user.id + ' Project Id: ' + projectId,
    })
    return customer.id
}

function parseDetailsFromStripePlan(price: Stripe.Price): PlanLimits {
    const { tasks, activeFlows, minimumPollingInterval, connections, teamMembers, datasourceSize, datasources, bots, tasksPerDay } = price.metadata!
    const nickname = price.nickname!
    const type = price.metadata.type ?? PlanType.FLOWS
    switch (type) {
        case PlanType.FLOWS:
            return {
                nickname,
                type: PlanType.FLOWS,
                tasks: Number(tasks),
                activeFlows: Number(activeFlows),
                connections: Number(connections),
                tasksPerDay: Number(tasksPerDay),
                minimumPollingInterval: Number(minimumPollingInterval),
                teamMembers: Number(teamMembers),
            }
        case PlanType.BOTS:
            return {
                nickname,
                type: PlanType.BOTS,
                bots: Number(bots),
                datasources: Number(datasources),
                datasourcesSize: Number(datasourceSize),
            }
        default:
            throw new Error(`Unknown plan type ${type}`)
    }

}

async function upgrade({
    priceId,
    subscriptionId,
}: { priceId: string, subscriptionId: string }): Promise<{ paymentLink: null }> {
    const price = await stripe.prices.retrieve(priceId)
    const { type } = parseDetailsFromStripePlan(price)
    const sub = await stripe.subscriptions.retrieve(subscriptionId)
    const items = sub.items.data.filter(item => {
        const details = parseDetailsFromStripePlan(item.price)
        return details.type !== type
    }).map(item => {
        return {
            price: item.price.id,
            quantity: 1,
        }
    })
    items.push({
        price: priceId,
        quantity: 1,
    })
    await stripe.subscriptions.update(subscriptionId, {
        items,
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
    priceId,
}: {
    projectId: ProjectId
    priceId: string
}): Promise<{ paymentLink: string }> {
    try {
        const plan = await plansService.getOrCreateDefaultPlan({ projectId })
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],

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