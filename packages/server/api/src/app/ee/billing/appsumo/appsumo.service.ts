import { DEFAULT_FREE_PLAN_LIMIT } from '@activepieces/ee-shared'
import { isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { userIdentityService } from '../../../authentication/user-identity/user-identity-service'
import { repoFactory } from '../../../core/db/repo-factory'
import { projectService } from '../../../project/project-service'
import { userService } from '../../../user/user-service'
import { platformBillingService } from '../../platform-billing/platform-billing.service'
import { projectLimitsService } from '../../project-plan/project-plan.service'
import { AppSumoEntity, AppSumoPlan } from './appsumo.entity'

const appsumoRepo = repoFactory(AppSumoEntity)

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

export const appsumoService = (log: FastifyBaseLogger) => ({
    getPlanInformation(plan_id: string): FlowPlanLimits {
        return appSumoPlans[plan_id]
    },
    async getByEmail(email: string): Promise<AppSumoPlan | null> {
        return appsumoRepo().findOneBy({
            activation_email: email,
        })
    },
    async getById(uuid: string): Promise<AppSumoPlan | null> {
        return appsumoRepo().findOneBy({
            uuid,
        })
    },
    async delete({ email }: { email: string }): Promise<void> {
        await appsumoRepo().delete({
            activation_email: email,
        })
    },
    async upsert(plan: AppSumoPlan): Promise<void> {
        await appsumoRepo().upsert(plan, ['uuid'])
    },
    async handleRequest(request: {
        plan_id: string
        action: string
        uuid: string
        activation_email: string
    }): Promise<void> {
        const { plan_id, action, uuid, activation_email: rawEmail } = request
        const appSumoLicense = await appsumoService(log).getById(uuid)
        const activation_email = appSumoLicense?.activation_email ?? rawEmail
        const appSumoPlan = appsumoService(log).getPlanInformation(plan_id)
        const identity = await userIdentityService(log).getIdentityByEmail(activation_email)
        if (!isNil(identity)) {
            const user = await userService.getOneByIdentityIdOnly({
                identityId: identity.id,
            })
            if (!isNil(user)) {
                const project = await projectService.getUserProjectOrThrow(user.id)
                await platformBillingService(log).getOrCreateForPlatform(project.platformId)

                if (action === 'refund') {
                    await projectLimitsService.upsert(DEFAULT_FREE_PLAN_LIMIT, project.id)
                    await platformBillingService(log).update({
                        platformId: project.platformId,
                        tasksLimit: DEFAULT_FREE_PLAN_LIMIT.tasks,
                    })
                }
                else {
                    await projectLimitsService.upsert(appSumoPlan, project.id)
                    await platformBillingService(log).update({
                        platformId: project.platformId,
                        tasksLimit: appSumoPlan.tasks,
                    })

                }
            }
        }

        if (action === 'refund') {
            await appsumoService(log).delete({
                email: activation_email,
            })
        }
        else {
            await appsumoService(log).upsert({
                uuid,
                plan_id,
                activation_email,
            })
        }
    },
})
