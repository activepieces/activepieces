import { isNil } from '@activepieces/core-utils'
import { APPSUMO_PLAN, PlanName, PlatformPlanWithOnlyLimits, PlatformRole } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { userIdentityService } from '../../authentication/user-identity/user-identity-service'
import { repoFactory } from '../../core/db/repo-factory'
import { AppSumoAction, billingProvider } from '../../platform/billing-provider'
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
        const isRefund = action === 'refund'
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
                const project = await projectService(log).getUserProjectOrThrow(user.id)
                await platformPlanService(log).getOrCreateForPlatform(project.platformId)
                await billingProvider.get(log).applyAppSumoPlan({
                    platformId: project.platformId,
                    planId: isRefund ? undefined : (appsumoService(log).getPlanInformation(plan_id).plan ?? undefined),
                    action: isRefund ? AppSumoAction.REFUND : AppSumoAction.ACTIVATE,
                })
            }
        }

        if (isRefund) {
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