import { AIUsage, AIUsageMetadata } from '@activepieces/common-ai'
import { apDayjs, AppSystemProp } from '@activepieces/server-shared'
import { AiOverageState, ApEdition, ApEnvironment, apId, Cursor, FlowStatus, PlatformUsage, SeekPage, UserStatus } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { In, IsNull } from 'typeorm'
import { agentRepo } from '../../agents/agents-service'
import { AIUsageEntity, AIUsageSchema } from '../../ai/ai-usage-entity'
import { repoFactory } from '../../core/db/repo-factory'
import { redisConnections } from '../../database/redis-connections'
import { flowRepo } from '../../flows/flow/flow.repo'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { Order } from '../../helper/pagination/paginator'
import { system } from '../../helper/system/system'
import { SystemJobName } from '../../helper/system-jobs/common'
import { systemJobsSchedule } from '../../helper/system-jobs/system-job'
import { mcpRepo } from '../../mcp/mcp-service'
import { projectService } from '../../project/project-service'
import { tableRepo } from '../../tables/table/table.service'
import { userRepo } from '../../user/user-service'
import { platformPlanService } from './platform-plan/platform-plan.service'

const environment = system.get(AppSystemProp.ENVIRONMENT)

const aiUsageRepo = repoFactory<AIUsageSchema>(AIUsageEntity)

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

        const [
            platformTasksUsage,
            platformAICreditUsage,
            activeFlows,
            mcps,
            projects,
            seats,
            tables,
            agents,
        ] = await Promise.all([
            this.getPlatformUsage({ platformId, metric: 'tasks', startDate, endDate }),
            this.getPlatformUsage({ platformId, metric: 'ai_credits', startDate, endDate }),
            getActiveFlows(platformId),
            getMCPsCount(platformId),
            getProjectsCount(platformId),
            getActiveUsers(platformId),
            getTables(platformId),
            getAgentsCount(platformId),
        ])

        return { tasks: platformTasksUsage, aiCredits: platformAICreditUsage, activeFlows, mcps, projects, seats, tables, agents }
    },

    async increaseTasksUsage(projectId: string, incrementBy: number): Promise<{ projectTasksUsage: number, platformTasksUsage: number }> {
        const edition = system.getEdition()

        if (edition === ApEdition.COMMUNITY || environment === ApEnvironment.TESTING) {
            return { projectTasksUsage: 0, platformTasksUsage: 0 }
        }

        const redisConnection = await redisConnections.useExisting()
        const today = dayjs()
        const fourteenMonth = 60 * 60 * 24 * 30 * 14

        const projectRedisKey = getDailyUsageRedisKey('tasks', 'project', projectId, today)
        const projectTasksUsageIncremented = await redisConnection.incrby(projectRedisKey, incrementBy)

        await redisConnection.expire(projectRedisKey, fourteenMonth)

        const platformId = await projectService.getPlatformId(projectId)
        const platformRedisKey = getDailyUsageRedisKey('tasks', 'platform', platformId, today)
        const platformTasksUsageIncremented = await redisConnection.incrby(platformRedisKey, incrementBy)
        await redisConnection.expire(platformRedisKey, fourteenMonth)

        return { projectTasksUsage: projectTasksUsageIncremented, platformTasksUsage: platformTasksUsageIncremented }
    },

    async resetPlatformUsage(platformId: string): Promise<void> {
        const redisConnection = await redisConnections.useExisting()
        const today = dayjs()
        const startOfMonth = today.startOf('month')

        const projectIds = await projectService.getProjectIdsByPlatform(platformId)

        for (let d = startOfMonth; d.isSame(today) || d.isBefore(today); d = d.add(1, 'day')) {
            const platformTasksRedisKey = getDailyUsageRedisKey('tasks', 'platform', platformId, d)
            await redisConnection.del(platformTasksRedisKey)

            const platformAiCreditRedisKey = getDailyUsageRedisKey('ai_credits', 'platform', platformId, d)
            await redisConnection.del(platformAiCreditRedisKey)

            for (const projectId of projectIds) {
                const projectTasksRedisKey = getDailyUsageRedisKey('tasks', 'project', projectId, d)
                await redisConnection.del(projectTasksRedisKey)

                const projectAiCreditRedisKey = getDailyUsageRedisKey('ai_credits', 'project', projectId, d)
                await redisConnection.del(projectAiCreditRedisKey)
            }
        }
    },

    async increaseAiCreditUsage({ projectId, cost, platformId, provider, model, metadata }: IncreaseProjectAIUsageParams): Promise<{ projectAiCreditUsage: number, platformAiCreditUsage: number }> {
        const edition = system.getEdition()

        if (edition === ApEdition.COMMUNITY) {
            return { projectAiCreditUsage: 0, platformAiCreditUsage: 0 }
        }

        const incrementBy = roundToDecimals(calculateCredits(cost), 3)

        const redisConnection = await redisConnections.useExisting()
        const today = dayjs()
        const fourteenMonth = 60 * 60 * 24 * 30 * 14

        const projectRedisKey = getDailyUsageRedisKey('ai_credits', 'project', projectId, today)
        const projectAiCreditUsageIncremented = parseFloat(await redisConnection.incrbyfloat(projectRedisKey, incrementBy))
        await redisConnection.expire(projectRedisKey, fourteenMonth)

        const platformRedisKey = getDailyUsageRedisKey('ai_credits', 'platform', platformId, today)
        const platformAiCreditUsageIncremented = parseFloat(await redisConnection.incrbyfloat(platformRedisKey, incrementBy))
        await redisConnection.expire(platformRedisKey, fourteenMonth)

        const platformPlan = await platformPlanService(system.globalLogger()).getOrCreateForPlatform(platformId)

        await aiUsageRepo().insert({
            id: apId(),
            projectId,
            platformId,
            provider,
            model,
            cost,
            metadata,
        })

        const shouldReportUsage = platformPlan.aiCreditsOverageState === AiOverageState.ALLOWED_AND_ON
        const hasOverage = Math.round(platformAiCreditUsageIncremented - platformPlan.includedAiCredits) > 0

        if (!shouldReportUsage || !hasOverage) {
            return { projectAiCreditUsage: projectAiCreditUsageIncremented, platformAiCreditUsage: platformAiCreditUsageIncremented }
        }

        await systemJobsSchedule(system.globalLogger()).upsertJob({
            job: {
                name: SystemJobName.AI_USAGE_REPORT,
                data: {
                    platformId,
                    overage: incrementBy.toString(),
                    idempotencyKey: apId(),
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

    async listAICreditsUsage({
        platformId,
        cursor,
        limit,
    }: ListAICreditsUsageParams): Promise<SeekPage<AICreditsUsageListResponse>> {
        const decodedCursor = paginationHelper.decodeCursor(cursor)
        const paginator = buildPaginator<AIUsageSchema>({
            entity: AIUsageEntity,
            query: {
                limit,
                order: Order.DESC,
                orderBy: 'created',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })

        const query = aiUsageRepo().createQueryBuilder('ai_usage')
            .select('ai_usage')
            .addSelect('project.displayName')
            .leftJoin('ai_usage.project', 'project')
            .where({
                platformId,
            })

        const { data, cursor: newCursor } = await paginator.paginate(query)
        const result = data.map(row => {
            const { cost, ...rowWithoutCost } = row
            return {
                ...rowWithoutCost,
                credits: roundToDecimals(calculateCredits(cost), 3),
                projectName: row.project.displayName,
            }
        })
        return paginationHelper.createPage<AICreditsUsageListResponse>(result, newCursor)
    },
})

function calculateCredits(cost: number): number {
    return cost * 1000
}

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

    const redisConnection = await redisConnections.useExisting()
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
    const projectIds = await projectService.getProjectIdsByPlatform(platformId)
    const activeFlows = await flowRepo().count({
        where: {
            projectId: In(projectIds),
            status: FlowStatus.ENABLED,
        },
    })
    return activeFlows
}

async function getTables(platformId: string): Promise<number> {
    const projectIds = await projectService.getProjectIdsByPlatform(platformId)
    const tables = await tableRepo().count({
        where: {
            projectId: In(projectIds),
        },
    })
    return tables
}

async function getProjectsCount(platformId: string): Promise<number> {
    const projectIds = await projectService.getProjectIdsByPlatform(platformId)
    return projectIds.length
}

async function getMCPsCount(platformId: string): Promise<number> {
    const projectIds = await projectService.getProjectIdsByPlatform(platformId)
    const mcpIds = await mcpRepo().count({
        where: {
            projectId: In(projectIds),
            agentId: IsNull(),
        },
    })
    return mcpIds
}

async function getAgentsCount(platformId: string): Promise<number> {
    const projectIds = await projectService.getProjectIdsByPlatform(platformId)
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

function roundToDecimals(value: number, decimals: number): number {
    const factor = Math.pow(10, decimals)
    return Math.round(value * factor) / factor
}

type IncreaseProjectAIUsageParams = {
    platformId: string
    projectId: string
    provider: string
    model: string
    cost: number
    metadata: AIUsageMetadata
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

type ListAICreditsUsageParams = {
    platformId: string
    cursor: Cursor | null
    limit: number
}

type AICreditsUsageListResponse = Omit<AIUsage, 'cost'> & {
    credits: number
    projectName: string
}
