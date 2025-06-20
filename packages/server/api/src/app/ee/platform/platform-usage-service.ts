import { AppSystemProp } from '@activepieces/server-shared'
import { ApEdition, ApEnvironment,  FlowStatus, isNil, PlatformUsage, UserStatus } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { In, IsNull, MoreThanOrEqual } from 'typeorm'
import { aiUsageRepo } from '../../ai/ai-provider-service'
import { getRedisConnection } from '../../database/redis-connection'
import { flowRepo } from '../../flows/flow/flow.repo'
import { apDayjs } from '../../helper/dayjs-helper'
import { system } from '../../helper/system/system'
import { mcpRepo } from '../../mcp/mcp-service'
import { projectRepo, projectService } from '../../project/project-service'
import { tableRepo } from '../../tables/table/table.service'
import { userRepo } from '../../user/user-service'
import { platformPlanService } from './platform-plan/platform-plan.service'
import { stripeHelper } from './platform-plan/stripe-helper'

const environment = system.get(AppSystemProp.ENVIRONMENT)
const redisKeyGenerator = (entityId: string, entityType: 'project' | 'platform', startBillingPeriod: string): string => {
    return `${entityType}-${entityId}-usage-tasks:${startBillingPeriod}`
}

export const platformUsageService = (_log?: FastifyBaseLogger) => ({

    async getActiveFlows(platformId: string): Promise<number> {
        const projectIds = await getProjectIds(platformId)
        const activeFlows = await flowRepo().count({
            where: {
                projectId: In(projectIds),
                status: FlowStatus.ENABLED,
            },
        })
        return activeFlows
    },
    async getTables(platformId: string): Promise<number> {
        const projectIds = await getProjectIds(platformId)
        const tables = await tableRepo().count({
            where: {
                projectId: In(projectIds),
            },
        })
        return tables
    },
    async getProjectsCount(platformId: string): Promise<number> {
        const projectIds = await getProjectIds(platformId)
        return projectIds.length
    },
    async getMCPsCount(platformId: string): Promise<number> {
        const projectIds = await getProjectIds(platformId)
        const mcpIds = await mcpRepo().count({
            where: {
                projectId: In(projectIds),
            },
        })
        return mcpIds
    },
    async getActiveUsers(platformId: string): Promise<number> {
        const activeUsers = await userRepo().count({
            where: {
                platformId,
                status: UserStatus.ACTIVE,
            },
        })
        return activeUsers
    },

    async getPlatformUsage(platformId: string): Promise<PlatformUsage> {
        const { platformTasksUsage: tasks } = await this.getTasksUsage(platformId)
        const { platformAICreditUsage } = await this.getAICreditUsage(platformId) 

        const activeFlows = await this.getActiveFlows(platformId)
        const mcps = await this.getMCPsCount(platformId)
        const projects = await this.getProjectsCount(platformId)
        const seats = await this.getActiveUsers(platformId)
        const tables = await this.getTables(platformId)

        return { tasks, aiCredits: platformAICreditUsage, activeFlows, mcps, projects, seats, tables }
    },

    async getTasksUsage(entityId: string): Promise<{ projectTasksUsage: number, platformTasksUsage: number }> {
        if (environment === ApEnvironment.TESTING) {
            return { projectTasksUsage: 0, platformTasksUsage: 0 }
        }

        const redisConnection = getRedisConnection()
        const projectTasksRedisKey = redisKeyGenerator(entityId, 'project', this.getCurrentBillingPeriodStart())
        const platformTasksRedisKey = redisKeyGenerator(entityId, 'platform', this.getCurrentBillingPeriodStart())

        const projectTasksUsage = await redisConnection.get(projectTasksRedisKey)
        const platformTasksUsage = await redisConnection.get(platformTasksRedisKey)

        return { projectTasksUsage: Number(projectTasksUsage) || 0, platformTasksUsage: Number(platformTasksUsage) || 0 }
    },

    async getAICreditUsage<T extends string | undefined>(
        platformId: string, 
        projectId?: T,
    ): Promise<{
            platformAICreditUsage: number
            projectAICreditUsage: T extends string ? number : undefined
        }> {
        const platformBilling = await platformPlanService(system.globalLogger()).getOrCreateForPlatform(platformId)
        const subscriptionId = platformBilling.stripeSubscriptionId
        const stripe = stripeHelper(system.globalLogger()).getStripe()
        
        if (isNil(subscriptionId) || isNil(stripe)) {
            return {
                platformAICreditUsage: 0,
                projectAICreditUsage: projectId ? 0 : undefined,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any
        }
        
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const startOfBillingCycle = subscription.current_period_start
        
        const platformAICreditUsageRecords = await aiUsageRepo().find({
            where: {
                platformId,
                created: MoreThanOrEqual(startOfBillingCycle.toString()),
            },
        })
        const platformAICreditUsage = platformAICreditUsageRecords.reduce((acc, usage) => acc + usage.cost, 0) * 1000
        
        if (projectId) {
            const projectAICreditUsageRecords = await aiUsageRepo().find({
                where: {
                    projectId,
                    created: MoreThanOrEqual(startOfBillingCycle.toString()),
                },
            })
            const projectAICreditUsage = projectAICreditUsageRecords.reduce((acc, usage) => acc + usage.cost, 0) * 1000

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return { platformAICreditUsage, projectAICreditUsage } as any
        }
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { platformAICreditUsage, projectAICreditUsage: undefined } as any
    },

    async increaseTasksUsage(projectId: string, incrementBy: number): Promise<{ projectTasksUsage: number, platformTasksUsage: number }> {
        const edition = system.getEdition()

        if (edition === ApEdition.COMMUNITY || environment === ApEnvironment.TESTING) {
            return { projectTasksUsage: 0, platformTasksUsage: 0 }
        }

        const redisConnection = getRedisConnection()

        const projectRedisKey = redisKeyGenerator(projectId, 'project', this.getCurrentBillingPeriodStart())
        const projectTasksUsage = await redisConnection.incrby(projectRedisKey, incrementBy)

        const platformId = await projectService.getPlatformId(projectId)
        const platformRedisKey = redisKeyGenerator(platformId, 'platform', this.getCurrentBillingPeriodStart())
        const platformTasksUsage = await redisConnection.incrby(platformRedisKey, incrementBy)

        return { projectTasksUsage, platformTasksUsage }
    },

    getCurrentBillingPeriodStart(): string {
        return apDayjs().startOf('month').toISOString()
    },

    getCurrentBillingPeriodEnd(): string {
        return apDayjs().endOf('month').toISOString()
    },
})

async function getProjectIds(platformId: string): Promise<string[]> {
    const projects = await projectRepo().find({
        select: {
            id: true,
        },
        where: {
            platformId,
            deleted: IsNull(),
        },

    })
    return projects.map((project) => project.id)
}