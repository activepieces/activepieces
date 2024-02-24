import { ProjectBilling } from '@activepieces/ee-shared'
import { ProjectBillingEntity } from './project-billing.entity'
import { databaseConnection } from '../../../database/database-connection'
import { User, apId, isNil } from '@activepieces/shared'
import { acquireLock } from '../../../helper/lock'
import { stripeHelper } from '../../billing/billing/stripe-helper'
import { projectService } from '../../../project/project-service'
import { userService } from '../../../user/user-service'
import { logger } from 'server-shared'
import Stripe from 'stripe'

const projectBillingRepo =
    databaseConnection.getRepository<ProjectBilling>(ProjectBillingEntity)


export const projectBillingService = {
    async getOrCreateForProject(projectId: string): Promise<ProjectBilling> {
        const projectBilling = await acquireLock({
            key: `project_billing_${projectId}`,
            timeout: 30 * 1000,
        })
        try {
            const project = await projectService.getOneOrThrow(projectId)
            const user = await userService.getOneOrFail({
                id: project.ownerId,
            })
            const billing = await projectBillingRepo.findOneBy({ projectId })
            if (isNil(billing)) {
                return await createInitialBilling(user, projectId)
            }
            return billing
        }
        finally {
            await projectBilling.release()
        }
    },
    async updateSubscriptionIdByCustomerId(subscription: Stripe.Subscription): Promise<void> {
        const stripeCustomerId = subscription.customer as string
        const projectBilling = await projectBillingRepo.findOneBy({ stripeCustomerId })
        if (isNil(projectBilling)) {
            logger.warn(`Project billing not found for customer ${stripeCustomerId}`)
            return
        }
        await projectBillingRepo.update(projectBilling.id, {
            stripeSubscriptionId: subscription.status === 'active' ? subscription.id : undefined,
        })
    },
}

async function createInitialBilling(user: User, projectId: string): Promise<ProjectBilling> {
    const stripeCustomerId = await stripeHelper.getOrCreateCustomer(
        user,
        projectId,
    )
    const billing = projectBillingRepo.create({
        id: apId(),
        projectId,
        includedTasks: 1000,
        includedUsers: 1,
        stripeCustomerId,
    })
    return projectBillingRepo.save(billing)
}