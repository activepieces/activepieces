import { getTasksPriceId } from '@activepieces/ee-shared'
import { exceptionHandler } from '@activepieces/server-shared'
import {
    ApEdition,
    assertNotNullOrUndefined,
    ProjectId,
    UserMeta,
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import Stripe from 'stripe'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-prop'
import { projectService } from '../../../project/project-service'
import { projectUsageService } from '../../../project/usage/project-usage-service'
import { projectBillingService } from './project-billing.service'

export const stripeWebhookSecret = system.get(
    AppSystemProp.STRIPE_WEBHOOK_SECRET,
)!

export const TASKS_PAYG_PRICE_ID = getTasksPriceId(system.get(AppSystemProp.STRIPE_SECRET_KEY) ?? '')

export const stripeHelper = (log: FastifyBaseLogger) => ({
    createPortalSessionUrl: async (projectId: string): Promise<string> => {
        const stripe = stripeHelper(log).getStripe()
        assertNotNullOrUndefined(stripe, 'Stripe is not configured')
        const projectBilling = await projectBillingService(log).getOrCreateForProject(projectId)
        const session = await stripe.billingPortal.sessions.create({
            customer: projectBilling.stripeCustomerId,
            return_url: 'https://cloud.activepieces.com/plans',
        })
        return session.url
    },

    getStripe: (): Stripe | undefined => {
        const edition = system.getEdition()
        if (edition !== ApEdition.CLOUD) {
            return undefined
        }
        const stripeSecret = system.getOrThrow(AppSystemProp.STRIPE_SECRET_KEY)
        return new Stripe(stripeSecret, {
            apiVersion: '2023-10-16',
        })
    },

    getOrCreateCustomer: async (
        user: UserMeta,
        projectId: ProjectId,
    ): Promise<string | undefined> => {
        const edition = system.getEdition()
        const stripe = stripeHelper(log).getStripe()
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
            exceptionHandler.handle(error, log)
            throw error
        }
    },

    createCheckoutUrl: async (
        projectId: string,
        customerId: string,
    ): Promise<string> => {
        const stripe = stripeHelper(log).getStripe()
        assertNotNullOrUndefined(stripe, 'Stripe is not configured')
        const project = await projectService.getOneOrThrow(projectId)
        const startBillingPeriod = projectUsageService(log).getCurrentingStartPeriod(project.created)
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
    },

    isPriceForTasks: (subscription: Stripe.Subscription): boolean => {
        return subscription.items.data.some((item) => item.price.id === TASKS_PAYG_PRICE_ID)
    },
})
