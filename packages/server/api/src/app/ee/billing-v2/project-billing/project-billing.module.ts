import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { stripeHelper, stripeWebhookSecret } from '../../billing/billing/stripe-helper'
import { ALL_PRINICPAL_TYPES, PrincipalType, assertNotNullOrUndefined } from '@activepieces/shared'
import { projectBillingService } from './project-billing.service'
import { FastifyRequest } from 'fastify'
import { exceptionHandler, logger } from 'server-shared'
import { StatusCodes } from 'http-status-codes'
import Stripe from 'stripe'

export const projectBillingModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(projectBillingController, { prefix: '/v1/project-billing' })
}

const projectBillingController: FastifyPluginAsyncTypebox = async (fastify) => {

    fastify.get('/', {
        config: {
            allowedPrincipals: [PrincipalType.USER],
        },
    }, async (request) => {
        return {
            subscription: await projectBillingService.getOrCreateForProject(request.principal.projectId),
        }
    })

    fastify.post(
        '/upgrade',
        {
            config: {
                allowedPrincipals: [PrincipalType.USER],
            },
        },
        async (request) => {
            const stripe = stripeHelper.getStripe()
            assertNotNullOrUndefined(stripe, 'Stripe is not configured')
            const projectBilling = await projectBillingService.getOrCreateForProject(request.principal.projectId)
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price: 'price_1On10NKZ0dZRqLEKeBGuWhmu',
                    },
                ],
                mode: 'subscription',
                success_url: 'https://cloud.activepieces.com',
                cancel_url: 'https://cloud.activepieces.com',
                customer: projectBilling.stripeCustomerId,
            })
            return {
                paymentLink: session.url!,
            }
        },
    )

    fastify.post(
        '/stripe/webhook',
        {
            config: {
                allowedPrincipals: ALL_PRINICPAL_TYPES,
                rawBody: true,
            },
        },
        async (request: FastifyRequest, reply) => {
            try {
                const payload = request.rawBody as string
                const signature = request.headers['stripe-signature'] as string
                const stripe = stripeHelper.getStripe()
                assertNotNullOrUndefined(stripe, 'Stripe is not configured')
                const webhook = stripe.webhooks.constructEvent(
                    payload,
                    signature,
                    stripeWebhookSecret,
                )
                const subscription = webhook.data.object as Stripe.Subscription
                await projectBillingService.updateSubscriptionIdByCustomerId(subscription)
                return await reply.status(StatusCodes.OK).send()
            }
            catch (err) {
                logger.error(err)
                logger.warn('⚠️  Webhook signature verification failed.')
                logger.warn(
                    '⚠️  Check the env file and enter the correct webhook secret.',
                )
                exceptionHandler.handle(err)
                return reply
                    .status(StatusCodes.BAD_REQUEST)
                    .send('Invalid webhook signature')
            }
        },
    )

}
