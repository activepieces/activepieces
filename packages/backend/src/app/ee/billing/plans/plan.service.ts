import { ProjectId, apId, isNil } from '@activepieces/shared'
import { ProjectPlan } from '@activepieces/ee-shared'
import { databaseConnection } from '../../../database/database-connection'
import { projectService } from '../../../project/project-service'
import { userService } from '../../../user/user-service'
import { acquireLock } from '../../../helper/lock'
import { BotPlanLimits, FlowPlanLimits, PlanLimits, PlanType, defaultPlanInformation } from './pricing-plans'
import { stripeHelper } from '../stripe/stripe-helper'
import { ProjectPlanEntity } from './plan.entity'
import Stripe from 'stripe'
import { appsumoService } from '../../appsumo/appsumo.service'

const projectPlanRepo = databaseConnection.getRepository<ProjectPlan>(ProjectPlanEntity)

export const plansService = {
    async getByStripeCustomerId({ stripeCustomerId }: { stripeCustomerId: string }): Promise<ProjectPlan> {
        return projectPlanRepo.findOneByOrFail({ stripeCustomerId })
    },

    async removeDailyTasksAndUpdateTasks({ projectId, tasks }: { projectId: ProjectId, tasks: number }): Promise<void> {
        await projectPlanRepo.update(projectId, {
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

    async update({ planLimits, subscription, projectPlanId }: {
        planLimits: PlanLimits
        subscription: null | Stripe.Subscription
        projectPlanId: string
    }): Promise<void> {
        const stripeSubscriptionId = subscription?.id ?? null
        switch (planLimits.type) {
            case PlanType.BOTS:
                return updatePlanWithBotsInformation({ projectPlanId, planLimits, stripeSubscriptionId })
            case PlanType.FLOWS:
                return updatePlanWithFlowsInformation({ projectPlanId, planLimits, stripeSubscriptionId })
        }
    },
}

async function createInitialPlan({ projectId }: { projectId: ProjectId }): Promise<ProjectPlan> {
    const projectPlanLock = await acquireLock({ key: `project_plan_${projectId}`, timeout: 30 * 1000 })
    try {
        const currentPlan = await projectPlanRepo.findOneBy({ projectId })
        if (!isNil(currentPlan)) {
            return currentPlan
        }
        const project = (await projectService.getOne(projectId))!
        const user = (await userService.getMetaInfo({ id: project.ownerId }))!
        const stripeCustomerId = await stripeHelper.createCustomer(user, project.id)
        const defaultPlanFlow = await getDefaultFlowPlan({ email: user.email })
        const defaultBotsPlan = defaultPlanInformation[PlanType.BOTS]
        await projectPlanRepo.upsert({
            id: apId(),
            projectId,
            flowPlanName: defaultPlanFlow.nickname,
            tasks: defaultPlanFlow.tasks,
            activeFlows: defaultPlanFlow.activeFlows,
            connections: defaultPlanFlow.connections,
            tasksPerDay: defaultPlanFlow.tasksPerDay,
            minimumPollingInterval: defaultPlanFlow.minimumPollingInterval,
            teamMembers: defaultPlanFlow.teamMembers,
            stripeCustomerId,
            stripeSubscriptionId: null,
            botPlanName: defaultBotsPlan.nickname,
            bots: defaultBotsPlan.bots,
            datasourcesSize: defaultBotsPlan.datasourcesSize,
            subscriptionStartDatetime: project.created,
        }, ['projectId'])
        return projectPlanRepo.findOneByOrFail({ projectId })
    }
    finally {
        await projectPlanLock.release()
    }
}

async function getDefaultFlowPlan({ email }: { email: string }): Promise<FlowPlanLimits> {
    const appsumoPlan = await appsumoService.getByEmail(email)
    if (!isNil(appsumoPlan)) {
        return appsumoService.getPlanInformation(appsumoPlan.plan_id)
    }
    return defaultPlanInformation[PlanType.FLOWS]
}
async function updatePlanWithBotsInformation({ projectPlanId, planLimits, stripeSubscriptionId }: {
    projectPlanId: string
    planLimits: BotPlanLimits
    stripeSubscriptionId: null | string
}): Promise<void> {
    const { nickname, bots, datasourcesSize, datasources } = planLimits
    await projectPlanRepo.update(projectPlanId, {
        botPlanName: nickname,
        datasourcesSize,
        datasources,
        bots,
        stripeSubscriptionId,
    })
}

async function updatePlanWithFlowsInformation({ projectPlanId, planLimits, stripeSubscriptionId }: {
    projectPlanId: string
    planLimits: FlowPlanLimits
    stripeSubscriptionId: null | string
}): Promise<void> {
    const { nickname, activeFlows, connections, tasks, tasksPerDay, minimumPollingInterval, teamMembers } = planLimits
    await projectPlanRepo.update(projectPlanId, {
        flowPlanName: nickname,
        activeFlows,
        connections,
        tasks,
        tasksPerDay: isNil(tasksPerDay) || isNaN(tasksPerDay) ? null : tasksPerDay,
        minimumPollingInterval,
        teamMembers,
        stripeSubscriptionId,
    })
}

