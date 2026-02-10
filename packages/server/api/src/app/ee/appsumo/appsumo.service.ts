import { APPSUMO_PLAN, STANDARD_CLOUD_PLAN } from '@activepieces/ee-shared'
import { isNil, PlanName, PlatformPlanWithOnlyLimits, PlatformRole } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { userIdentityService } from '../../authentication/user-identity/user-identity-service'
import { repoFactory } from '../../core/db/repo-factory'
import { projectService } from '../../project/project-service'
import { userRepo } from '../../user/user-service'
import { platformPlanService } from '../platform/platform-plan/platform-plan.service'
import { AppSumoEntity, AppSumoPlan } from './appsumo.entity'

const appsumoRepo = repoFactory(AppSumoEntity)

const appSumoPlans: Record<string, PlatformPlanWithOnlyLimits> = {
    activepieces_tier1: APPSUMO_PLAN(PlanName.APPSUMO_ACTIVEPIECES_TIER1),
    activepieces_tier2: APPSUMO_PLAN(PlanName.APPSUMO_ACTIVEPIECES_TIER2),
    activepieces_tier3: APPSUMO_PLAN(PlanName.APPSUMO_ACTIVEPIECES_TIER3),
    activepieces_tier4: APPSUMO_PLAN(PlanName.APPSUMO_ACTIVEPIECES_TIER4),
    activepieces_tier5: APPSUMO_PLAN(PlanName.APPSUMO_ACTIVEPIECES_TIER5),
    activepieces_tier6: APPSUMO_PLAN(PlanName.APPSUMO_ACTIVEPIECES_TIER6),
}

export const appsumoService = (log: FastifyBaseLogger) => ({
    getPlanInformation(plan_id: string): PlatformPlanWithOnlyLimits {
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
            const user = await userRepo().findOne({
                where: {
                    identityId: identity.id,
                    platformRole: PlatformRole.ADMIN,
                },
                order: {
                    created: 'ASC',
                },
            })
            if (!isNil(user)) {
                const project = await projectService.getUserProjectOrThrow(user.id)
                await platformPlanService(log).getOrCreateForPlatform(project.platformId)

                if (action === 'refund') {
                    await platformPlanService(log).update({
                        platformId: project.platformId,
                        ...STANDARD_CLOUD_PLAN,
                    })
                }
                else {
                    await platformPlanService(log).update({
                        platformId: project.platformId,
                        ...appSumoPlan,
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