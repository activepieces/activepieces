import { AppSystemProp } from '@activepieces/server-shared'
import { ApEdition, ApEnvironment, FlowStatus, PlatformUsage, ProjectUsage, UserStatus } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { In, IsNull } from 'typeorm'
import { getRedisConnection } from '../../database/redis-connection'
import { flowRepo } from '../../flows/flow/flow.repo'
import { apDayjs } from '../../helper/dayjs-helper'
import { system } from '../../helper/system/system'
import { mcpRepo } from '../../mcp/mcp-service'
import { projectRepo, projectService } from '../../project/project-service'
import { tableRepo } from '../../tables/table/table.service'
import { userRepo } from '../../user/user-service'

export enum BillingUsageType {
    TASKS = 'tasks',
    AI_CREDITS = 'aiCredits',
}

export enum BillingEntityType {
    PROJECT = 'project',
    PLATFORM = 'platform',
}

const environment = system.get(AppSystemProp.ENVIRONMENT)

const redisKeyGenerator = (entityId: string, entityType: BillingEntityType, startBillingPeriod: string, usageType: BillingUsageType): string => {
    return `${entityType}-${entityId}-usage-${usageType}:${startBillingPeriod}`
}

export const platformUsageService = (_log: FastifyBaseLogger) => ({

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
        const startBillingPeriod = this.getCurrentBillingPeriodStart()
        const tasks = await getUsage(platformId, BillingEntityType.PLATFORM, startBillingPeriod, BillingUsageType.TASKS)
        const aiCredits = await getUsage(platformId, BillingEntityType.PLATFORM, startBillingPeriod, BillingUsageType.AI_CREDITS)
        const activeFlows = await this.getActiveFlows(platformId)
        const mcp = await this.getMCPsCount(platformId)
        const projects = await this.getProjectsCount(platformId)
        const seats = await this.getActiveUsers(platformId)
        const tables = await this.getTables(platformId)
        return { tasks, aiCredits, activeFlows, mcp, projects, seats, tables }
    },
    
    async getTaskAndCreditUsage(entityId: string, entityType: BillingEntityType): Promise<ProjectUsage> {
        const startBillingPeriod = this.getCurrentBillingPeriodStart()
        const tasks = await getUsage(entityId, entityType, startBillingPeriod, BillingUsageType.TASKS)
        const aiCredits = await getUsage(entityId, entityType, startBillingPeriod, BillingUsageType.AI_CREDITS)

        return {
            tasks,
            aiCredits,
            nextLimitResetDate: this.getCurrentBillingPeriodEnd(),
        }
    },

    async increaseProjectAndPlatformUsage({ projectId, incrementBy, usageType }: IncreaseProjectAndPlatformUsageParams): Promise<{ consumedProjectUsage: number, consumedPlatformUsage: number }> {
        const edition = system.getEdition()
        if (edition === ApEdition.COMMUNITY || environment === ApEnvironment.TESTING) {
            return { consumedProjectUsage: 0, consumedPlatformUsage: 0 }
        }

        const redisConnection = getRedisConnection()
        const startBillingPeriod = this.getCurrentBillingPeriodStart()

        const projectRedisKey = redisKeyGenerator(projectId, BillingEntityType.PROJECT, startBillingPeriod, usageType)
        const consumedProjectUsage = await redisConnection.incrby(projectRedisKey, incrementBy)

        const platformId = await projectService.getPlatformId(projectId)
        const platformRedisKey = redisKeyGenerator(platformId, BillingEntityType.PLATFORM, startBillingPeriod, usageType)
        const consumedPlatformUsage = await redisConnection.incrby(platformRedisKey, incrementBy)

        return { consumedProjectUsage, consumedPlatformUsage }
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
async function getUsage(entityId: string, entityType: BillingEntityType, startBillingPeriod: string, usageType: BillingUsageType): Promise<number> {
    if (environment === ApEnvironment.TESTING) {
        return 0
    }

    const redisKey = redisKeyGenerator(entityId, entityType, startBillingPeriod, usageType)
    const redisConnection = getRedisConnection()

    const value = await redisConnection.get(redisKey)
    return Number(value) || 0
}

type IncreaseProjectAndPlatformUsageParams = {
    projectId: string
    incrementBy: number
    usageType: BillingUsageType
}
