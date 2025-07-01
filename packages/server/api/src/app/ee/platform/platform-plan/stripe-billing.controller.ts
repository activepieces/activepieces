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
import { emailService } from '../../helper/email/email-service'
import { platformUsageService } from '../platform-usage-service'
import { platformPlanRepo, platformPlanService } from './platform-plan.service'
import { stripeHelper, USER_PRICE_ID } from './stripe-helper'

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
                        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer
                        const platformId = subscription.metadata.platformId as string
                        const isTrialSubscription = checkIsTrialSubscription(subscription)

                        if (webhook.type === 'customer.subscription.created' && isTrialSubscription) {
                            await emailService(request.log).sendWellcomeToTrialEmail(platformId, customer.email as string)
                            await systemJobsSchedule(request.log).upsertJob({
                                job: {
                                    name: SystemJobName.SEVEN_DAYS_IN_TRIAL,
                                    data: {
                                        platformId,
                                        customerEmail: customer.email as string,
                                    },
                                    jobId: `7-days-left-on-trial-${platformId}-${customer.email}`,
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
                        })
                        break
                    }
                    case 'customer.subscription.trial_will_end': {
                        const subscription = webhook.data.object as Stripe.Subscription

                        const platformPlan = await platformPlanRepo().findOneByOrFail({ stripeSubscriptionId: subscription.id })
                        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer

                        if (isNil(customer.email)) {
                            request.log.warn('Customer email is missing, cannot send trial ending reminder.', {
                                customerId: customer.id,
                                subscriptionId: subscription.id,
                            })
                            break
                        }

                        await systemJobsSchedule(request.log).upsertJob({
                            job: {
                                name: SystemJobName.ONE_DAY_LEFT_ON_TRIAL,
                                data: {
                                    platformId: platformPlan.platformId,
                                    customerEmail: customer.email as string,
                                },
                                jobId: `one-day-left-on-trial-${platformPlan}-${customer.email}`,
                            },
                            schedule: {
                                type: 'one-time',
                                date: apDayjs().add(2, 'days'),
                            },
                        })

                        await emailService(request.log).sendThreeDaysLeftOnTrialEmail(platformPlan.platformId, customer.email)

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