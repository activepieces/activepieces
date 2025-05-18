import { AppSystemProp, exceptionHandler } from '@activepieces/server-shared'
import { ApEdition, ApEnvironment, getCurrentBillingPeriodEnd, getCurrentBillingPeriodStart, isNil, ProjectUsage, UsageEntityType, UsageMetric } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { getRedisConnection } from '../../../database/redis-connection'
import { system } from '../../../helper/system/system'
import { getUsage, redisKeyGenerator } from '../../../helper/usage'
import { platformService } from '../../../platform/platform.service'
import { projectService } from '../../../project/project-service'
import { userInvitationsService } from '../../../user-invitations/user-invitation.service'
import { platformBillingService } from '../../platform-billing/platform-billing.service'
import { platformUsageService } from '../../platform-billing/usage/usage-service'
import { projectMemberService } from '../../project-members/project-member.service'
import { projectLimitsService } from '../../project-plan/project-plan.service'

const environment = system.get(AppSystemProp.ENVIRONMENT)
const edition = system.getEdition()

export const projectUsageService = (log: FastifyBaseLogger) => ({
    async getProjectUsageForBillingPeriod(projectId: string): Promise<ProjectUsage> {
        const startBillingPeriod = getCurrentBillingPeriodStart()

        const tasks = await getUsage(projectId, UsageEntityType.PROJECT, startBillingPeriod, UsageMetric.TASKS)
        const aiCredit = await getUsage(projectId, UsageEntityType.PROJECT, startBillingPeriod, UsageMetric.AI_CREDIT)
        const tables = await getUsage(projectId, UsageEntityType.PROJECT, startBillingPeriod, UsageMetric.TABLES)
        const mcpServers = await getUsage(projectId, UsageEntityType.PROJECT, startBillingPeriod, UsageMetric.MCP_SERVERS)
        const activeFlows = await getUsage(projectId, UsageEntityType.PROJECT, startBillingPeriod, UsageMetric.ACTIVE_FLOWS)

        const projectMembers = await projectMemberService(log).countTeamMembers(projectId)
        const projectInvitations = await userInvitationsService(log).countByProjectId(projectId)
        const teamMembers = projectMembers + projectInvitations

        return {
            tasks,
            aiCredit,
            teamMembers,
            tables,
            mcpServers,
            activeFlows,
            nextLimitResetDate: getCurrentBillingPeriodEnd(),
        }
    },
    async  increaseProjectUsage(projectId: string, incrementBy: number, usageMetric: UsageMetric): Promise<number> {

        if (edition === ApEdition.COMMUNITY || environment === ApEnvironment.TESTING) {
            return 0
        }

        const redisConnection = getRedisConnection()
        const startBillingPeriod = getCurrentBillingPeriodStart()

        const projectRedisKey = redisKeyGenerator(projectId, UsageEntityType.PROJECT, startBillingPeriod, usageMetric)
        const consumedProjectUsage = await redisConnection.incrby(projectRedisKey, incrementBy)


        return consumedProjectUsage

    },
    async checkMetricUsageLimit( projectId: string, incrementBy: number, usageMetric: UsageMetric, log: FastifyBaseLogger ): Promise<boolean> {
        if (![ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(edition)) {
            return false
        }

        try {
            const projectPlan = await projectLimitsService.getPlanByProjectId(projectId)

            if (!projectPlan) {
                return false
            }

            const platformId = await projectService.getPlatformId(projectId)

            const consumedPlatformUsage = await platformUsageService.increasePlatformUsage(platformId, incrementBy, usageMetric)
            const consumedProjectUsage = await projectUsageService(log).increaseProjectUsage(projectId, incrementBy, usageMetric)

            const planLimit = usageMetric === UsageMetric.TASKS ? projectPlan.tasks : projectPlan.aiCredit

            const shouldLimitFromProjectPlan = !isNil(planLimit) && consumedProjectUsage >= planLimit

            if (edition === ApEdition.ENTERPRISE) {
                return shouldLimitFromProjectPlan
            }

            const platform = await platformService.getOneOrThrow(platformId)
            const platformBilling = await platformBillingService(log).getOrCreateForPlatform(platformId)
            const platformLimit = usageMetric === UsageMetric.TASKS ? platformBilling.tasksLimit : platformBilling.aiCreditsLimit
            const shouldLimitFromPlatformBilling = !isNil(platformLimit) && consumedPlatformUsage >= platformLimit

            if (!platform.manageProjectsEnabled) {
                return shouldLimitFromPlatformBilling
            }

            return shouldLimitFromProjectPlan || shouldLimitFromPlatformBilling
        }
        catch (e) {
            exceptionHandler.handle(e, log)
            return false
        }
    },
})

