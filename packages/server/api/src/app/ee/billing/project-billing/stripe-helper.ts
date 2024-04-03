import dayjs from 'dayjs'
import Stripe from 'stripe'
import { getEdition } from '../../../helper/secret-helper'
import { projectService } from '../../../project/project-service'
import { projectUsageService } from '../../../project/usage/project-usage-service'
import { projectBillingService } from './project-billing.service'
import { getTasksPriceId } from '@activepieces/ee-shared'
import { exceptionHandler, system, SystemProp } from '@activepieces/server-shared'
import {
    ApEdition,
    assertNotNullOrUndefined,
    ProjectId,
    UserMeta,
} from '@activepieces/shared'

export const stripeWebhookSecret = system.get(
    SystemProp.STRIPE_WEBHOOK_SECRET,
)!

export const TASKS_PAYG_PRICE_ID = getTasksPriceId(system.get(SystemProp.STRIPE_SECRET_KEY) ?? '')


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

async function getOrCreateCustomer(
    user: UserMeta,
    projectId: ProjectId,
): Promise<string | undefined> {
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
        exceptionHandler.handle(error)
        throw error
    }
}

async function createCheckoutUrl(
    projectId: string,
    customerId: string,
): Promise<string> {
    const stripe = stripeHelper.getStripe()
    assertNotNullOrUndefined(stripe, 'Stripe is not configured')
    const project = await projectService.getOneOrThrow(projectId)
    const startBillingPeriod = projectUsageService.getCurrentingStartPeriod(project.created)
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
                price: TASKS_PAYG_PRICE_ID,
            },
        ],
        subscription_data: {
            billing_cycle_anchor: dayjs(startBillingPeriod).add(30, 'day').unix(),
        },
        mode: 'subscription',
        success_url: 'https://cloud.activepieces.com/plans',
        cancel_url: 'https://cloud.activepieces.com/plans',
        customer: customerId,
    })
    return session.url!
}
async function createPortalSessionUrl(projectId: string): Promise<string> {
    const stripe = stripeHelper.getStripe()
    assertNotNullOrUndefined(stripe, 'Stripe is not configured')
    const projectBilling = await projectBillingService.getOrCreateForProject(projectId)
    const session = await stripe.billingPortal.sessions.create({
        customer: projectBilling.stripeCustomerId,
        return_url: 'https://cloud.activepieces.com/plans',
    })
    return session.url
}

function isPriceForTasks(subscription: Stripe.Subscription): boolean {
    return subscription.items.data.some((item) => item.price.id === TASKS_PAYG_PRICE_ID)
}
export const stripeHelper = {
    createPortalSessionUrl,
    getStripe,
    getOrCreateCustomer,
    createCheckoutUrl,
    isPriceForTasks,
}
