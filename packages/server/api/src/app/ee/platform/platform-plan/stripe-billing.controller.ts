import { ApSubscriptionStatus, checkIsTrialSubscription, DEFAULT_BUSINESS_SEATS, getPlanFromSubscription, PlanName  } from '@activepieces/ee-shared'
import { AppSystemProp, exceptionHandler } from '@activepieces/server-shared'
import { ALL_PRINCIPAL_TYPES, assertNotNullOrUndefined, isNil } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import Stripe from 'stripe'
import { apDayjs } from '../../../helper/dayjs-helper'
import { system } from '../../../helper/system/system'
import { systemJobsSchedule } from '../../../helper/system-jobs'
import { SystemJobName } from '../../../helper/system-jobs/common'
import { domainHelper } from '../../custom-domains/domain-helper'
import { emailService } from '../../helper/email/email-service'
import { platformUsageService } from '../platform-usage-service'
import { platformPlanRepo, platformPlanService } from './platform-plan.service'
import { stripeHelper, USER_PRICE_ID } from './stripe-helper'

export const stripeBillingController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.get(
        '/attach-payment-method',
        WebhookRequest,
        async (
            request: FastifyRequest<{
                Querystring: {
                    platformId: string
                }
            }>,
            reply,
        ) => {
            const sessionLink = await stripeHelper(request.log).createSetupSession(request.query.platformId)
            await reply.redirect(sessionLink)
        },
    )

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
                        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer
                        const platformId = subscription.metadata.platfromId as string
                        const isTrialSubscription = checkIsTrialSubscription(subscription)

                        if (webhook.type === 'customer.subscription.created' && isTrialSubscription) {
                            await emailService(request.log).sendWellcomeToTrialEmail(platformId, subscription.customer as string)
                            await systemJobsSchedule(request.log).upsertJob({
                                job: {
                                    name: SystemJobName.TRIAL_HALF_WAY_EMAIL,
                                    data: {
                                        platformId,
                                        customerEmail: customer.email as string,
                                    },
                                    jobId: `trial-half-way-email-${platformId}-${customer.email}`,
                                },
                                schedule: {
                                    type: 'one-time',
                                    date: apDayjs().add(7, 'days'),
                                },
                            })
                        }

                        if (webhook.type === 'customer.subscription.created' && !isTrialSubscription) {
                            const customerSubscriptions = await stripe.subscriptions.list({ customer: subscription.customer as string })
                            const trialSubscription = customerSubscriptions.data.find(sub => checkIsTrialSubscription(sub))

                            if (trialSubscription) {
                                await stripe.subscriptions.cancel(trialSubscription.id)
                            }
                        }

                        if (webhook.type === 'customer.subscription.deleted' && isTrialSubscription) {
                            break
                        }

                        const { startDate, endDate, cancelDate } = await stripeHelper(request.log).getSubscriptionCycleDates(subscription)
                        const platformPlan = await platformPlanService(request.log).updateByCustomerId({
                            subscriptionId: subscription.id,
                            customerId: subscription.customer.toString(),
                            status: subscription.status as ApSubscriptionStatus,
                            startDate,
                            endDate,
                            cancelDate,
                            stripePaymentMethod: subscription.default_payment_method as string ?? undefined,
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
                        const subscription = webhook.data.object as Stripe.Subscription
                        const stripe = stripeHelper(request.log).getStripe()
                        assertNotNullOrUndefined(stripe, 'stripe is not set')

                        const platformPlan = await platformPlanRepo().findOneByOrFail({ stripeSubscriptionId: subscription.id })
                        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer

                        if (isNil(customer.email)) {
                            request.log.warn('Customer email is missing, cannot send trial ending reminder.', {
                                customerId: customer.id,
                                subscriptionId: subscription.id,
                            })
                            break
                        }

                        if (!isNil(subscription.default_payment_method)) {
                            request.log.info('Trial ending soon, payment method already attached. Skipping "add payment method" reminder.', {
                                subscriptionId: subscription.id,
                                customerId: customer.id,
                            })
                            break
                        }

                        const addPaymentMethodLink = await domainHelper.getInternalApiUrl({ path: `stripe-billing/attach-payment-method?platformId=${platformPlan.platformId}`, platformId: platformPlan.platformId })
                        await emailService(request.log).sendTrialEndingSoonReminder(platformPlan.platformId, customer.email, addPaymentMethodLink)

                        break
                    }
                    case 'checkout.session.completed': {
                        const session = webhook.data.object as Stripe.Checkout.Session
                        if (session.mode === 'setup' && session.metadata?.action === 'attach_payment_method') {
                            const subscriptionId = session.metadata?.subscriptionId as string
                            const customerId = session.customer as string
                            const setupIntent = await stripe.setupIntents.retrieve(session.setup_intent as string)
                            const paymentMethodId = setupIntent.payment_method as string

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