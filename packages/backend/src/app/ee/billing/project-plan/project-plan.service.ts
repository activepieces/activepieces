import { ApEdition, ProjectId, apId, isNil, spreadIfDefined } from '@activepieces/shared'
import { DEFAULT_PLATFORM_PLAN, ProjectPlan } from '@activepieces/ee-shared'
import { databaseConnection } from '../../../database/database-connection'
import { projectService } from '../../../project/project-service'
import { userService } from '../../../user/user-service'
import { acquireLock } from '../../../helper/lock'
import { FlowPlanLimits, defaultPlanInformation } from './pricing-plans'
import { stripeHelper } from '../billing/stripe-helper'
import { ProjectPlanEntity } from './project-plan.entity'
import Stripe from 'stripe'
import { appsumoService } from '../../appsumo/appsumo.service'
import { getEdition } from '../../../helper/secret-helper'
import { flagService } from '../../../flags/flag.service'

const projectPlanRepo = databaseConnection.getRepository<ProjectPlan>(ProjectPlanEntity)

export const plansService = {
    async getByCustomerId({ stripeCustomerId }: { stripeCustomerId: string }): Promise<ProjectPlan> {
        return projectPlanRepo.findOneByOrFail({ stripeCustomerId })
    },
    async removeDailyTasksAndUpdateTasks({ projectId, tasks }: { projectId: ProjectId, tasks: number }): Promise<void> {
        await projectPlanRepo.update({ projectId }, {
            tasks,
            tasksPerDay: null,
        })
    },

    async getOrCreateDefaultPlan({ projectId }: { projectId: ProjectId }): Promise<ProjectPlan> {
        const plan = await projectPlanRepo.findOneBy({ projectId })
        if (isNil(plan)) {
            return createInitialPlan({ projectId })
        }
        return plan
    },

    async update({ planLimits, subscription, projectId }: {
        planLimits: Partial<FlowPlanLimits>
        subscription: null | Stripe.Subscription
        projectId: string
    }): Promise<ProjectPlan> {
        const projectPlan = await plansService.getOrCreateDefaultPlan({
            projectId,
        })
        const stripeSubscriptionId = subscription?.id ?? null
        const { nickname, connections, tasks, minimumPollingInterval, teamMembers } = planLimits
        await projectPlanRepo.update(projectPlan.id, {
            ...spreadIfDefined('flowPlanName', nickname),
            ...spreadIfDefined('connections', connections),
            ...spreadIfDefined('tasks', tasks),
            tasksPerDay: null,
            ...spreadIfDefined('minimumPollingInterval', minimumPollingInterval),
            ...spreadIfDefined('teamMembers', teamMembers),
            stripeSubscriptionId,
        })
        return projectPlanRepo.findOneByOrFail({ projectId })
    },
}

async function createInitialPlan({ projectId }: { projectId: ProjectId }): Promise<ProjectPlan> {
    const projectPlanLock = await acquireLock({ key: `project_plan_${projectId}`, timeout: 30 * 1000 })
    try {
        const currentPlan = await projectPlanRepo.findOneBy({ projectId })
        if (!isNil(currentPlan)) {
            return currentPlan
        }
        const project = await projectService.getOneOrThrow(projectId)
        const user = (await userService.getMetaInfo({ id: project.ownerId }))!
        const stripeCustomerId = await stripeHelper.getOrCreateCustomer(user, project.id)
        const defaultPlanFlow = await getDefaultFlowPlan({ platformId: project.platformId ?? null, email: user.email })
        await projectPlanRepo.upsert({
            id: apId(),
            projectId,
            flowPlanName: defaultPlanFlow.nickname,
            tasks: defaultPlanFlow.tasks,
            connections: defaultPlanFlow.connections,
            minimumPollingInterval: defaultPlanFlow.minimumPollingInterval,
            teamMembers: defaultPlanFlow.teamMembers,
            stripeCustomerId,
            stripeSubscriptionId: null,
            subscriptionStartDatetime: project.created,
        }, ['projectId'])
        return await projectPlanRepo.findOneByOrFail({ projectId })
    }
    finally {
        await projectPlanLock.release()
    }
}

async function getDefaultFlowPlan({ platformId, email }: { platformId: string | null, email: string }): Promise<FlowPlanLimits> {
    const edition = getEdition()
    if (edition === ApEdition.CLOUD) {
        const appsumoPlan = await appsumoService.getByEmail(email)
        if (!isNil(appsumoPlan)) {
            return appsumoService.getPlanInformation(appsumoPlan.plan_id)
        }
    }
    if (!flagService.isCloudPlatform(platformId)) {
        return DEFAULT_PLATFORM_PLAN
    }
    return defaultPlanInformation
}
