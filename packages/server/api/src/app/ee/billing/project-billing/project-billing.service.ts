import Stripe from 'stripe'
import { databaseConnection } from '../../../database/database-connection'
import { acquireLock } from '../../../helper/lock'
import { projectService } from '../../../project/project-service'
import { userService } from '../../../user/user-service'
import { ProjectBillingEntity } from './project-billing.entity'
import { stripeHelper } from './stripe-helper'
import { ApSubscriptionStatus, DEFAULT_FREE_PLAN_LIMIT, ProjectBilling } from '@activepieces/ee-shared'
import { logger } from '@activepieces/server-shared'
import { apId, isNil, User } from '@activepieces/shared'

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
    async updateByProjectId(projectId: string, update: Partial<ProjectBilling>): Promise<ProjectBilling> {
        await projectBillingRepo.update({ projectId }, update)
        return projectBillingRepo.findOneByOrFail({ projectId })
    },
    async increaseTasks(projectId: string, tasks: number): Promise<ProjectBilling> {
        await projectBillingRepo.increment({
            projectId,
        }, 'includedTasks', tasks)
        return projectBillingService.getOrCreateForProject(projectId)
    },
    async updateSubscriptionIdByCustomerId(subscription: Stripe.Subscription): Promise<ProjectBilling> {
        const stripeCustomerId = subscription.customer as string
        const projectBilling = await projectBillingRepo.findOneByOrFail({ stripeCustomerId })
        logger.info(`Updating subscription id for project billing ${projectBilling.id}`)
        await projectBillingRepo.update(projectBilling.id, {
            stripeSubscriptionId: subscription.id,
            subscriptionStatus: subscription.status as ApSubscriptionStatus,
        })
        return projectBillingRepo.findOneByOrFail({ stripeCustomerId })
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
        includedTasks: DEFAULT_FREE_PLAN_LIMIT.tasks,
        includedUsers: DEFAULT_FREE_PLAN_LIMIT.teamMembers,
        stripeCustomerId,
    })
    return projectBillingRepo.save(billing)
}
