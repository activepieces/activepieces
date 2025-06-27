import { ApSubscriptionStatus, DEFAULT_BUSINESS_SEATS, getPlanFromSubscription, PlanName  } from '@activepieces/ee-shared'
import { AppSystemProp, exceptionHandler } from '@activepieces/server-shared'
import { ALL_PRINCIPAL_TYPES, assertNotNullOrUndefined, isNil } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import Stripe from 'stripe'
import { system } from '../../../helper/system/system'
import { platformUsageService } from '../platform-usage-service'
import { platformPlanRepo, platformPlanService } from './platform-plan.service'
import { stripeHelper, USER_PRICE_ID } from './stripe-helper'
import { emailService } from '../../helper/email/email-service'

export const stripeBillingController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.post(
        '/stripe/webhook',
        WebhookRequest,
        async (request: FastifyRequest, reply) => {
            try {
                const payload = request.rawBody as string
                const signature = request.headers['stripe-signature'] as string

                const stripe = stripeHelper(request.log).getStripe()
                assertNotNullOrUndefined(stripe, 'Stripe is not configured')

                const webhookSecret = system.getOrThrow(AppSystemProp.STRIPE_WEBHOOK_SECRET)
                const webhook = stripe.webhooks.constructEvent(
                    payload,
                    signature,
                    webhookSecret,
                )

                switch (webhook.type) {
                    case 'customer.subscription.deleted': 
                    case 'customer.subscription.created':
                    case 'customer.subscription.updated': {
                        const subscription = webhook.data.object as Stripe.Subscription

                        const { startDate, endDate, cancelDate } = await stripeHelper(request.log).getSubscriptionCycleDates(subscription)
                        const platformPlan = await platformPlanService(request.log).updateByCustomerId({
                            subscriptionId: subscription.id,
                            customerId: subscription.customer.toString(),
                            status: subscription.status as ApSubscriptionStatus,
                            startDate,
                            endDate,
                            cancelDate,
                        })
            
                        const newPlan = getPlanFromSubscription(subscription)
                        const extraUsers = subscription.items.data.find(item => item.price.id === USER_PRICE_ID)?.quantity ?? 0

                        request.log.info('Processing subscription event', {
                            webhookType: webhook.type,
                            subscriptionStatus: subscription.status,
                            newPlan,
                            extraUsers,
                        })

                        const planLimits = platformPlanService(request.log).getPlanLimits(newPlan)

                        const isFreePlan = newPlan === PlanName.FREE
                        const isBusinessPlan = newPlan === PlanName.BUSINESS
                        const hasExtraUsers = extraUsers > 0
                        const isUserSeatsUpgraded = isBusinessPlan && hasExtraUsers

                        if (!isFreePlan && isUserSeatsUpgraded) {
                            planLimits.userSeatsLimit = DEFAULT_BUSINESS_SEATS + extraUsers
                        } 

                        if (isFreePlan || !isUserSeatsUpgraded) {
                            await platformUsageService(request.log).resetPlatformUsage(platformPlan.platformId)
                        }

                        await platformPlanService(request.log).update({ 
                            ...planLimits,
                            platformId: platformPlan.platformId,
                            stripeSubscriptionId: isFreePlan ? undefined : platformPlan.stripeSubscriptionId,
                            aiCreditsLimit: isFreePlan ? undefined : platformPlan.aiCreditsLimit,
                        })

                        break
                    }
                    case 'customer.subscription.trial_will_end': {
                        const subscription = webhook.data.object as Stripe.Subscription;
                        const stripe = stripeHelper(request.log).getStripe();
                        assertNotNullOrUndefined(stripe, 'stripe is not set')

                        const platformPlan = await platformPlanRepo().findOneByOrFail({ stripeSubscriptionId: subscription.id });
                        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;

                        if (isNil(customer.email)) {
                            request.log.warn('Customer email is missing, cannot send trial ending reminder.', {
                                customerId: customer.id,
                                subscriptionId: subscription.id,
                            });
                            break;
                        }

                        if (!isNil(subscription.default_payment_method)) {
                            request.log.info('Trial ending soon, payment method already attached. Skipping "add payment method" reminder.', {
                                subscriptionId: subscription.id,
                                customerId: customer.id,
                            });
                            break;
                        }

                        emailService(request.log).sendTrialEndingSoonReminder(platformPlan.id, customer.email);

                        break;
                    }
                    case 'checkout.session.completed': {
                        const session = webhook.data.object as Stripe.Checkout.Session

                        const subscriptionId = session.metadata?.subscriptionId as string
                        const customerId = session.customer as string
                        const setupIntent = await stripe.setupIntents.retrieve(session.setup_intent as string)
                        const paymentMethodId = setupIntent.payment_method as string

                        if (session.mode === 'setup' && session.metadata?.action === 'attach_payment_method') {
                            await stripeHelper(request.log).attachPaymentMethod(
                                stripe,
                                subscriptionId,
                                customerId,
                                paymentMethodId,
                            )
                        }

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
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
        rawBody: true,
    },
}