import { AdminAddPlatformRequestBody, isNil, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { adminPlatformService } from './admin-platform.service'
import { projectService } from '../../project/project-service'
import { projectBillingService } from '../billing/project-billing/project-billing.service'
import { platformBillingService } from '../platform-billing/platform-billing.service'
import { stripeHelper, TASKS_PAYG_PRICE_ID } from '../platform-billing/stripe-helper'
import { ApSubscriptionStatus } from '@activepieces/ee-shared'
import { apDayjs } from '../../helper/dayjs-helper'

export const adminPlatformPieceModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(adminPlatformController, { prefix: '/v1/admin/platforms' })
}

const adminPlatformController: FastifyPluginAsyncTypebox = async (
    app,
) => {
    app.post('/', AdminAddPlatformRequest, async (req, res) => {
        const newPlatform = await adminPlatformService(req.log).add(req.body)

        return res.status(StatusCodes.CREATED).send(newPlatform)
    })

    app.post('/migrate-project-billing', MigrateProjectBillingRequest, async (req, res) => {
        const { projectIds } = req.body as { projectIds: string[] }

        const results = []
        const stripe = stripeHelper(req.log).getStripe()
        for (const projectId of projectIds) {
            try {
                const projectBilling = await projectBillingService(req.log).getOrCreateForProject(projectId)
                const platformId = await projectService.getPlatformId(projectId)
                const platformBilling = await platformBillingService(req.log).getOrCreateForPlatform(platformId)
                await platformBillingService(req.log).updateSubscription({
                    platformBillingId: platformBilling.id,
                    stripeCustomerId: projectBilling.stripeCustomerId,
                    stripeSubscriptionId: projectBilling.stripeSubscriptionId,
                    stripeSubscriptionStatus: projectBilling.subscriptionStatus
                })

                results.push({
                    projectId,
                    success: true,
                    platformBillingId: platformBilling.id
                })

                if (stripe) {
                    if (isNil(platformBilling.stripeSubscriptionId) || platformBilling.stripeSubscriptionStatus !== ApSubscriptionStatus.ACTIVE) {
                        continue
                    }

                    await stripe.subscriptions.cancel(platformBilling.stripeSubscriptionId);
                    const nextMonthStart = apDayjs().add(1, 'month').startOf('month').unix();

                    await stripe.subscriptions.create({
                        customer: platformBilling.stripeCustomerId,
                        items: [
                            {
                                price: TASKS_PAYG_PRICE_ID, 
                            },
                        ],
                        billing_cycle_anchor: nextMonthStart,  
                        proration_behavior: 'none',
                    });
                }
                
            }
            catch (e: any) {
                results.push({
                    projectId,
                    success: false,
                    error: e.message
                })
            }
        }

        return res.status(StatusCodes.OK).send({
            results
        })
    })
}

const AdminAddPlatformRequest = {
    schema: {
        body: AdminAddPlatformRequestBody,
    },
    config: {
        allowedPrincipals: [PrincipalType.SUPER_USER],
    },
}

const MigrateProjectBillingRequest = {
    schema: {
        body: {
            type: 'object',
            properties: {
                projectIds: {
                    type: 'array',
                    items: {
                        type: 'string'
                    }
                }
            },
            required: ['projectIds']
        }
    },
    config: {
        allowedPrincipals: [PrincipalType.SUPER_USER],
    }
}
