import { databaseConnection } from '../../../database/database-connection'
import { projectService } from '../../../project/project-service'
import { userService } from '../../../user/user-service'
import { projectLimitsService } from '../../project-plan/project-plan.service'
import { projectBillingService } from '../project-billing/project-billing.service'
import { AppSumoEntity, AppSumoPlan } from './appsumo.entity'
import { DEFAULT_FREE_PLAN_LIMIT } from '@activepieces/ee-shared'
import { system, SystemProp } from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'

const appsumoRepo = databaseConnection.getRepository(AppSumoEntity)

type FlowPlanLimits = {
    nickname: string
    tasks: number
    minimumPollingInterval: number
    connections: number
    teamMembers: number
}

const appSumoPlans: Record<string, FlowPlanLimits> = {
    activepieces_tier1: {
        nickname: 'appsumo_activepieces_tier1',
        tasks: 10000,
        minimumPollingInterval: 10,
        connections: 100,
        teamMembers: 1,
    },
    activepieces_tier2: {
        nickname: 'appsumo_activepieces_tier2',
        tasks: 50000,
        minimumPollingInterval: 5,
        connections: 100,
        teamMembers: 1,
    },
    activepieces_tier3: {
        nickname: 'appsumo_activepieces_tier3',
        tasks: 200000,
        minimumPollingInterval: 1,
        connections: 100,
        teamMembers: 5,
    },
    activepieces_tier4: {
        nickname: 'appsumo_activepieces_tier4',
        tasks: 500000,
        minimumPollingInterval: 1,
        connections: 100,
        teamMembers: 5,
    },
    activepieces_tier5: {
        nickname: 'appsumo_activepieces_tier5',
        tasks: 1000000,
        minimumPollingInterval: 1,
        connections: 100,
        teamMembers: 5,
    },
    activepieces_tier6: {
        nickname: 'appsumo_activepieces_tier6',
        tasks: 10000000,
        minimumPollingInterval: 1,
        connections: 100,
        teamMembers: 5,
    },
}

export const appsumoService = {
    getPlanInformation(plan_id: string): FlowPlanLimits {
        return appSumoPlans[plan_id]
    },
    async getByEmail(email: string): Promise<AppSumoPlan | null> {
        return appsumoRepo.findOneBy({
            activation_email: email,
        })
    },
    async getById(uuid: string): Promise<AppSumoPlan | null> {
        return appsumoRepo.findOneBy({
            uuid,
        })
    },
    async  delete({ email }: { email: string }): Promise<void> {
        await appsumoRepo.delete({
            activation_email: email,
        })
    },
    async upsert(plan: AppSumoPlan): Promise<void> {
        await appsumoRepo.upsert(plan, ['uuid'])
    },
    async handleRequest(request: {
        plan_id: string
        action: string
        uuid: string
        activation_email: string
    }): Promise<void> {
        const { plan_id, action, uuid, activation_email: rawEmail } = request
        const appSumoLicense = await appsumoService.getById(uuid)
        const activation_email = appSumoLicense?.activation_email ?? rawEmail
        const appSumoPlan = appsumoService.getPlanInformation(plan_id)
        const user = await userService.getByPlatformAndEmail({
            platformId: system.getOrThrow(SystemProp.CLOUD_PLATFORM_ID),
            email: activation_email,
        })
        if (!isNil(user)) {
            const project = await projectService.getUserProjectOrThrow(user.id)
            await projectBillingService.getOrCreateForProject(project.id)

            if (action === 'refund') {
                await projectLimitsService.upsert(DEFAULT_FREE_PLAN_LIMIT, project.id)
                await projectBillingService.updateByProjectId(project.id, {
                    includedTasks: DEFAULT_FREE_PLAN_LIMIT.tasks,
                    includedUsers: DEFAULT_FREE_PLAN_LIMIT.teamMembers,
                })
            }
            else {
                await projectLimitsService.upsert(appSumoPlan, project.id)
                await projectBillingService.updateByProjectId(project.id, {
                    includedTasks: appSumoPlan.tasks,
                    includedUsers: appSumoPlan.teamMembers,
                })
            }
        }

        if (action === 'refund') {
            await appsumoService.delete({
                email: activation_email,
            })
        }
        else {
            await appsumoService.upsert({
                uuid,
                plan_id,
                activation_email,
            })
        }
    },
}
