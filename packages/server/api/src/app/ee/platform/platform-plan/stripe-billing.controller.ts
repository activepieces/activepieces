import { ApSubscriptionStatus, checkIsTrialSubscription, DEFAULT_BUSINESS_SEATS, getPlanFromSubscription, PlanName  } from '@activepieces/ee-shared'
import { AppSystemProp, exceptionHandler } from '@activepieces/server-shared'
import { AiOverageState, ALL_PRINCIPAL_TYPES, isNil } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { FastifyBaseLogger, FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import Stripe from 'stripe'
import { userIdentityService } from '../../../authentication/user-identity/user-identity-service'
import { apDayjs } from '../../../helper/dayjs-helper'
import { system } from '../../../helper/system/system'
import { systemJobsSchedule } from '../../../helper/system-jobs'
import { SystemJobName } from '../../../helper/system-jobs/common'
import { emailService } from '../../helper/email/email-service'
import { platformUsageService } from '../platform-usage-service'
import { PlatformPlanHelper } from './platform-plan-helper'
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
                    case 'customer.subscription.deleted': 
                    case 'customer.subscription.created':
                    case 'customer.subscription.updated': {
                        const subscription = webhook.data.object as Stripe.Subscription
                        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer
                        const platformId = subscription.metadata.platformId as string
                        const isTrialSubscription = checkIsTrialSubscription(subscription)
                        const trialSubscriptionStarted = webhook.type === 'customer.subscription.created' && isTrialSubscription
                        if (trialSubscriptionStarted) {
                            await sendTrialRelatedEmails(customer.email as string, platformId, request.log) 
                        }

                        const noneTrialSubscriptionStarted = webhook.type === 'customer.subscription.created' && !isTrialSubscription
                        if (noneTrialSubscriptionStarted) {
                            await cancelTrialSubscription(subscription.customer as string, stripe) 
                        }

                        const trialSubscrptionEnded = webhook.type === 'customer.subscription.deleted' && isTrialSubscription
                        if (trialSubscrptionEnded) {
                            break
                        }

                        const newPlan = getPlanFromSubscription(subscription)
                        if (isNil(newPlan)) {
                            break
                        }

                        request.log.info('Processing subscription event', {
                            webhookType: webhook.type,
                            subscriptionStatus: subscription.status,
                            newPlan,
                        })

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

                        const extraUsers = subscription.items.data.find(item => item.price.id === USER_PRICE_ID)?.quantity ?? 0
                        const newLimits = platformPlanService(request.log).getPlanLimits(newPlan)
                        const isFreePlan = newPlan === PlanName.FREE
                        const isBusinessPlan = newPlan === PlanName.BUSINESS
                        const hasExtraUsers = extraUsers > 0
                        const isUserSeatsUpgraded = isBusinessPlan && hasExtraUsers

                        await PlatformPlanHelper.handleResourceLocking({ platformId, newLimits })

                        if (!isFreePlan && isUserSeatsUpgraded) {
                            newLimits.userSeatsLimit = DEFAULT_BUSINESS_SEATS + extraUsers
                        } 

                        if (isFreePlan || !isUserSeatsUpgraded) {
                            await platformUsageService(request.log).resetPlatformUsage(platformPlan.platformId)
                        }

                        await platformPlanService(request.log).update({ 
                            ...newLimits,
                            platformId: platformPlan.platformId,
                            eligibleForTrial: false,
                            stripeSubscriptionId: isFreePlan ? undefined : platformPlan.stripeSubscriptionId,
                            aiCreditsOverageState: isFreePlan || isTrialSubscription ? AiOverageState.NOT_ALLOWED : AiOverageState.ALLOWED_BUT_OFF,
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

                        const user = await userIdentityService(system.globalLogger()).getIdentityByEmail(customer.email)
                        await systemJobsSchedule(request.log).upsertJob({
                            job: {
                                name: SystemJobName.ONE_DAY_LEFT_ON_TRIAL,
                                data: {
                                    platformId: platformPlan.platformId,
                                    email: customer.email as string,
                                    firstName: user?.firstName,
                                },
                                jobId: `one-day-left-on-trial-${platformPlan}-${customer.email}`,
                            },
                            schedule: {
                                type: 'one-time',
                                date: apDayjs().add(2, 'days'),
                            },
                        })

                        await emailService(request.log).sendTrialReminder({
                            platformId: platformPlan.platformId,
                            firstName: user?.firstName,
                            customerEmail: customer.email as string,
                            templateName: '1-day-left-on-trial',
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
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
        rawBody: true,
    },
}



async function sendTrialRelatedEmails(customerEmail: string, platformId: string, log: FastifyBaseLogger) {
    const user = await userIdentityService(system.globalLogger()).getIdentityByEmail(customerEmail)
    await emailService(log).sendTrialReminder({
        platformId,
        customerEmail,
        templateName: 'welcome-to-trial',
        firstName: user?.firstName,
    })
    await systemJobsSchedule(log).upsertJob({
        job: {
            name: SystemJobName.SEVEN_DAYS_IN_TRIAL,
            data: {
                platformId,
                email: customerEmail,
                firstName: user?.firstName ?? undefined,
            },
            jobId: `7-days-left-on-trial-${platformId}-${customerEmail}`,
        },
        schedule: {
            type: 'one-time',
            date: apDayjs().add(7, 'days'),
        },
    })
}


async function cancelTrialSubscription(customerId: string, stripe: Stripe) {
    const customerSubscriptions = await stripe.subscriptions.list({ customer: customerId })
    const trialSubscription = customerSubscriptions.data.find(sub => checkIsTrialSubscription(sub))

    if (trialSubscription) {
        await stripe.subscriptions.cancel(trialSubscription.id)
    }
}