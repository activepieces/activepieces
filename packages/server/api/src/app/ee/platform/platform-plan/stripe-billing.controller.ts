import { ApSubscriptionStatus, STANDARD_CLOUD_PLAN } from '@activepieces/ee-shared'
import { AppSystemProp, exceptionHandler, securityAccess } from '@activepieces/server-shared'
import { isNil, PlanName } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import Stripe from 'stripe'
import { system } from '../../../helper/system/system'
import { platformAiCreditsService } from './platform-ai-credits.service'
import { ACTIVE_FLOW_PRICE_ID, platformPlanService } from './platform-plan.service'
import { StripeCheckoutType, stripeHelper } from './stripe-helper'

export const stripeBillingController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.post(
        '/stripe/webhook',
        WebhookRequest,
        async (request: FastifyRequest, reply) => {
            try {
                const payload = request.rawBody as string
                const signature = request.headers['stripe-signature'] as string

                const stripe = stripeHelper(request.log).getStripe()
                if (isNil(stripe)) { 
                    return await reply.status(StatusCodes.OK).send({ received: true })
                }

                const webhookSecret = system.getOrThrow(AppSystemProp.STRIPE_WEBHOOK_SECRET)
                const webhook = stripe.webhooks.constructEvent(
                    payload,
                    signature,
                    webhookSecret,
                )

                switch (webhook.type) {
                    case 'checkout.session.completed': {
                        const session = webhook.data.object
                        if (isNil(session.metadata)) {
                            break
                        } 

                        if (session.metadata.type === StripeCheckoutType.AI_CREDIT_PAYMENT) {
                            const platformId = session.metadata.platformId as string
                            const intent = await stripe.paymentIntents.retrieve(
                                session.payment_intent as string,
                            )
                            const amountInCents = intent.amount
                            const amountInUsd = amountInCents / 100

                            await platformAiCreditsService(request.log).aiCreditsPaymentSucceeded(platformId, amountInUsd, StripeCheckoutType.AI_CREDIT_PAYMENT)
                        }
                        if (session.metadata.type === StripeCheckoutType.AI_CREDIT_AUTO_TOP_UP) {
                            const setupIntent = await stripe.setupIntents.retrieve(
                                session.setup_intent as string,
                            )

                            const paymentMethodId = setupIntent.payment_method as string
                            const platformId = session.metadata.platformId as string
                            await platformAiCreditsService(request.log).handleAutoTopUpCheckoutSessionCompleted(platformId, paymentMethodId)
                        }
                        break
                    }
                    case 'invoice.paid': {
                        const invoice = webhook.data.object
                        if (isNil(invoice.metadata)) {
                            break
                        }
                        if (invoice.metadata.type === StripeCheckoutType.AI_CREDIT_AUTO_TOP_UP) {
                            const platformId = invoice.metadata.platformId as string
                            const amountInCents = invoice.amount_paid
                            const amountInUsd = amountInCents / 100
                            await platformAiCreditsService(request.log).aiCreditsPaymentSucceeded(platformId, amountInUsd, StripeCheckoutType.AI_CREDIT_AUTO_TOP_UP)
                        }
                        break
                    }
                    case 'customer.subscription.deleted': 
                    case 'customer.subscription.created':
                    case 'customer.subscription.updated': {
                        const subscription = webhook.data.object as Stripe.Subscription
                        const platformId = subscription.metadata.platformId as string

                        const { startDate, endDate, cancelDate } = await stripeHelper(request.log).getSubscriptionCycleDates(subscription)

                        const extraActiveFlows = subscription.items.data.find(item => ACTIVE_FLOW_PRICE_ID === item.price.id)?.quantity ?? 0
                        const newLimits = { ...STANDARD_CLOUD_PLAN }

                        const subscriptionEnded = webhook.type === 'customer.subscription.deleted'
                        if (subscriptionEnded) {
                            await platformPlanService(request.log).update({ 
                                ...newLimits,
                                platformId,
                                plan: PlanName.STANDARD,
                                stripeSubscriptionStatus: ApSubscriptionStatus.CANCELED,
                                stripeSubscriptionId: undefined,
                                stripeSubscriptionStartDate: undefined,
                                stripeSubscriptionEndDate: undefined,
                                stripeSubscriptionCancelDate: undefined,
                            })
                            break
                        }

                        if (extraActiveFlows > 0) {
                            newLimits.activeFlowsLimit = (newLimits.activeFlowsLimit ?? 0) + extraActiveFlows
                        }

                        await platformPlanService(request.log).update({ 
                            ...newLimits,
                            platformId,
                            plan: PlanName.STANDARD,
                            stripeSubscriptionId: subscription.id,
                            stripeSubscriptionStatus: subscription.status as ApSubscriptionStatus,
                            stripeSubscriptionStartDate: startDate,
                            stripeSubscriptionEndDate: endDate,
                            stripeSubscriptionCancelDate: cancelDate,
                        })
                        break
                    }
                    default:
                        request.log.info(`Unhandled webhook event type: ${webhook.type}`)
                        break
                }
                return await reply.status(StatusCodes.OK).send({ received: true })
            }
            catch (err) {
                request.log.error(err)
                request.log.warn('⚠️  Webhook signature verification failed.')
                exceptionHandler.handle(err, request.log)
                return reply
                    .status(StatusCodes.BAD_REQUEST)
                    .send('Invalid webhook signature')
            }
        },
    )
}

const WebhookRequest = {
    config: {
        security: securityAccess.public(),
        rawBody: true,
    },
}
