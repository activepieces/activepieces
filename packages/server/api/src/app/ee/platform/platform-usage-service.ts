import { AppSystemProp } from '@activepieces/server-shared'
import { AiOverageState, ApEdition, ApEnvironment,  apId,  FlowStatus, PlatformUsage, UserStatus } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { In, IsNull } from 'typeorm'
import { agentRepo } from '../../agents/agents-service'
import { aiUsageRepo } from '../../ai/ai-provider-service'
import { getRedisConnection } from '../../database/redis-connection'
import { flowRepo } from '../../flows/flow/flow.repo'
import { apDayjs } from '../../helper/dayjs-helper'
import { system } from '../../helper/system/system'
import { systemJobsSchedule } from '../../helper/system-jobs'
import { SystemJobName } from '../../helper/system-jobs/common'
import { mcpRepo } from '../../mcp/mcp-service'
import { projectRepo, projectService } from '../../project/project-service'
import { tableRepo } from '../../tables/table/table.service'
import { userRepo } from '../../user/user-service'
import { platformPlanService } from './platform-plan/platform-plan.service'

const environment = system.get(AppSystemProp.ENVIRONMENT)

const getDailyUsageRedisKey = (
    metric: 'tasks' | 'ai_credits',
    entityType: 'project' | 'platform',
    entityId: string,
    date: dayjs.Dayjs,
): string => {
    return `${metric}:${entityType}:${entityId}:${date.format('YYYY-MM-DD')}`
}

export const platformUsageService = (_log?: FastifyBaseLogger) => ({
    async getAllPlatformUsage(platformId: string): Promise<PlatformUsage> {
        const platformBilling = await platformPlanService(system.globalLogger()).getOrCreateForPlatform(platformId)

        const { startDate, endDate } = await platformPlanService(system.globalLogger()).getBillingDates(platformBilling)

        const platformTasksUsage = await this.getPlatformUsage({ platformId, metric: 'tasks', startDate, endDate })
        const platformAICreditUsage = await this.getPlatformUsage({ platformId, metric: 'ai_credits', startDate, endDate }) 

        const activeFlows = await getActiveFlows(platformId)
        const mcps = await getMCPsCount(platformId)
        const projects = await getProjectsCount(platformId)
        const seats = await getActiveUsers(platformId)
        const tables = await getTables(platformId)
        const agents = await getAgentsCount(platformId)

        return { tasks: platformTasksUsage, aiCredits: platformAICreditUsage, activeFlows, mcps, projects, seats, tables, agents }
    },

    async increaseTasksUsage(projectId: string, incrementBy: number): Promise<{ projectTasksUsage: number, platformTasksUsage: number }> {
        const edition = system.getEdition()

        if (edition === ApEdition.COMMUNITY || environment === ApEnvironment.TESTING) {
            return { projectTasksUsage: 0, platformTasksUsage: 0 }
        }

        const redisConnection = getRedisConnection()
        const today = dayjs()
        const thirtyDays = 60 * 60 * 24 * 90

        const projectRedisKey = getDailyUsageRedisKey('tasks', 'project', projectId, today)
        const projectTasksUsageIncremented = await redisConnection.incrby(projectRedisKey, incrementBy)

        await redisConnection.expire(projectRedisKey, thirtyDays)

        const platformId = await projectService.getPlatformId(projectId)
        const platformRedisKey = getDailyUsageRedisKey('tasks', 'platform', platformId, today)
        const platformTasksUsageIncremented = await redisConnection.incrby(platformRedisKey, incrementBy)
        await redisConnection.expire(platformRedisKey, thirtyDays)

        return { projectTasksUsage: projectTasksUsageIncremented, platformTasksUsage: platformTasksUsageIncremented }
    },


    async resetPlatformUsage(platformId: string): Promise<void> {
        const redisConnection = getRedisConnection()
        const today = dayjs()
        
        const platformTasksRedisKey = getDailyUsageRedisKey('tasks', 'platform', platformId, today)
        await redisConnection.del(platformTasksRedisKey)

        const platformAiCreditRedisKey = getDailyUsageRedisKey('ai_credits', 'platform', platformId, today)
        await redisConnection.del(platformAiCreditRedisKey)

        const projectIds = await getProjectIds(platformId)
        for (const projectId of projectIds) {
            const projectTasksRedisKey = getDailyUsageRedisKey('tasks', 'project', projectId, today)
            await redisConnection.del(projectTasksRedisKey)

            const projectAiCreditRedisKey = getDailyUsageRedisKey('ai_credits', 'project', projectId, today)
            await redisConnection.del(projectAiCreditRedisKey)
        }

        await systemJobsSchedule(system.globalLogger()).upsertJob({
            job: {
                name: SystemJobName.AI_USAGE_REPORT,
                data: {
                    platformId,
                    overage: '0',
                },
                jobId: `ai-credit-usage-reset-${platformId}-${apDayjs().unix()}`,
            },
            schedule: {
                type: 'one-time',
                date: apDayjs().add(1, 'seconds'),
            },
        })


    },

    async increaseAiCreditUsage({ projectId, cost, platformId, provider, model }: IncreaseProjectAIUsageParams): Promise<{ projectAiCreditUsage: number, platformAiCreditUsage: number }> {
        const incrementBy = cost * 1000
        const edition = system.getEdition()

        if (edition === ApEdition.COMMUNITY || environment === ApEnvironment.TESTING) {
            return { projectAiCreditUsage: 0, platformAiCreditUsage: 0 }
        }

        const redisConnection = getRedisConnection()
        const today = dayjs()
        const thirtyDays = 60 * 60 * 24 * 90

        const projectRedisKey = getDailyUsageRedisKey('ai_credits', 'project', projectId, today)
        const projectAiCreditUsageIncremented = parseFloat(await redisConnection.incrbyfloat(projectRedisKey, incrementBy))

        await redisConnection.expire(projectRedisKey, thirtyDays)

        const platformRedisKey = getDailyUsageRedisKey('ai_credits', 'platform', platformId, today)
        const platformAiCreditUsageIncremented = parseFloat(await redisConnection.incrbyfloat(platformRedisKey, incrementBy))
        await redisConnection.expire(platformRedisKey, thirtyDays)

        const platformPlan = await platformPlanService(system.globalLogger()).getOrCreateForPlatform(platformId)

        await aiUsageRepo().insert({
            id: apId(),
            projectId,
            platformId,
            provider,
            model,
            cost,
        })
        
        const shouldReportUsage = platformPlan.aiCreditsOverageState === AiOverageState.ALLOWED_AND_ON
        const overage = Math.round(platformAiCreditUsageIncremented - platformPlan.includedAiCredits)
        const hasOverage = overage > 0

        if (!shouldReportUsage || !hasOverage) {
            return { projectAiCreditUsage: projectAiCreditUsageIncremented, platformAiCreditUsage: platformAiCreditUsageIncremented }
        }
        
        await systemJobsSchedule(system.globalLogger()).upsertJob({
            job: {
                name: SystemJobName.AI_USAGE_REPORT,
                data: {
                    platformId,
                    overage: overage.toString(),
                },
                jobId: `ai-credit-usage-report-${platformId}-${apDayjs().unix()}`,
            },
            schedule: {
                type: 'one-time',
                date: apDayjs().add(1, 'seconds'),
            },
        })

        return { projectAiCreditUsage: projectAiCreditUsageIncremented, platformAiCreditUsage: platformAiCreditUsageIncremented }
    },

    async getPlatformUsage({ platformId, metric, startDate, endDate }: GetPlatformUsageParams): Promise<number> {
        if (environment === ApEnvironment.TESTING) {
            return 0
        }

        return getUsage(platformId, startDate, endDate, metric, 'platform')
    },

    async getProjectUsage({ projectId, metric, startDate, endDate }: GetProjectUsageParams): Promise<number> {
        if (environment === ApEnvironment.TESTING) {
            return 0
        }

        return getUsage(projectId, startDate, endDate, metric, 'project')
    },
})

async function getUsage(
    entityId: string,
    startDate: number,
    endDate: number,
    metric: 'tasks' | 'ai_credits',
    entityType: 'project' | 'platform',
): Promise<number> {
    if (environment === ApEnvironment.TESTING) {
        return 0
    }

    const redisConnection = getRedisConnection()
    let totalUsage = 0

    let currentDay = dayjs.unix(startDate).startOf('day')
    const endDay = dayjs.unix(endDate).endOf('day')

    const keysToFetch: string[] = []
    while (currentDay.isBefore(endDay) || currentDay.isSame(endDay, 'day')) {
        keysToFetch.push(getDailyUsageRedisKey(metric, entityType, entityId, currentDay))
        currentDay = currentDay.add(1, 'day')
    }

    if (keysToFetch.length > 0) {
        const values = await redisConnection.mget(keysToFetch)

        for (const value of values) {
            if (value !== null) {
                totalUsage += Number(value)
            }
        }
    }

    return totalUsage
}


async function getActiveFlows(platformId: string): Promise<number> {
    const projectIds = await getProjectIds(platformId)
    const activeFlows = await flowRepo().count({
        where: {
            projectId: In(projectIds),
            status: FlowStatus.ENABLED,
        },
    })
    return activeFlows
}

async function getTables(platformId: string): Promise<number> {
    const projectIds = await getProjectIds(platformId)
    const tables = await tableRepo().count({
        where: {
            projectId: In(projectIds),
        },
    })
    return tables
}

async function getProjectsCount(platformId: string): Promise<number> {
    const projectIds = await getProjectIds(platformId)
    return projectIds.length
}

async function getMCPsCount(platformId: string): Promise<number> {
    const projectIds = await getProjectIds(platformId)
    const mcpIds = await mcpRepo().count({
        where: {
            projectId: In(projectIds),
            agentId: IsNull(),
        },
    })
    return mcpIds
}

async function getAgentsCount(platformId: string): Promise<number> {
    const projectIds = await getProjectIds(platformId)
    const agents = await agentRepo().count({
        where: {
            projectId: In(projectIds),
        },
    })
    return agents
}

async function getActiveUsers(platformId: string): Promise<number> {
    const activeUsers = await userRepo().count({
        where: {
            platformId,
            status: UserStatus.ACTIVE,
        },
    })
    return activeUsers
}

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


type IncreaseProjectAIUsageParams = {
    platformId: string
    projectId: string
    provider: string
    model: string
    cost: number
}

type GetProjectUsageParams = {
    projectId: string
    metric: 'tasks' | 'ai_credits'
    startDate: number
    endDate: number
}

type GetPlatformUsageParams = {
    platformId: string
    metric: 'tasks' | 'ai_credits'
    startDate: number
    endDate: number
}