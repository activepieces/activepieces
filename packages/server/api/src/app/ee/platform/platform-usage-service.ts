import { AppSystemProp } from '@activepieces/server-shared'
import { ApEdition, ApEnvironment, FlowStatus, ProjectUsage } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { In } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { getRedisConnection } from '../../database/redis-connection'
import { FlowEntity } from '../../flows/flow/flow.entity'
import { apDayjs } from '../../helper/dayjs-helper'
import { system } from '../../helper/system/system'
import { PieceMetadataEntity } from '../../pieces/piece-metadata-entity'
import { ProjectEntity } from '../../project/project-entity'
import { projectService } from '../../project/project-service'
import { TableEntity } from '../../tables/table/table.entity'
import { TodoEntity } from '../../todos/todo.entity'
import { UserEntity } from '../../user/user-entity'

export enum BillingUsageType {
    TASKS = 'tasks',
    AI_TOKENS = 'aiTokens',
}

export enum BillingEntityType {
    PROJECT = 'project',
    PLATFORM = 'platform',
}

const environment = system.get(AppSystemProp.ENVIRONMENT)

const redisKeyGenerator = (entityId: string, entityType: BillingEntityType, startBillingPeriod: string, usageType: BillingUsageType): string => {
    return `${entityType}-${entityId}-usage-${usageType}:${startBillingPeriod}`
}

const userRepo = repoFactory(UserEntity)
const projectRepo = repoFactory(ProjectEntity)
const flowRepo = repoFactory(FlowEntity)
const pieceMetadataRepo = repoFactory(PieceMetadataEntity)
const tableRepo = repoFactory(TableEntity)
const todoRepo = repoFactory(TodoEntity)

export const usageService = (_log: FastifyBaseLogger) => ({
    async getUsageForBillingPeriod(entityId: string, entityType: BillingEntityType): Promise<ProjectUsage> {
        const startBillingPeriod = this.getCurrentBillingPeriodStart()
        const tasks = await getUsage(entityId, entityType, startBillingPeriod, BillingUsageType.TASKS)
        const aiTokens = await getUsage(entityId, entityType, startBillingPeriod, BillingUsageType.AI_TOKENS)
        
        const users = await userRepo().count({
            where: { platformId: entityId },
        })
            
        const projects = await projectRepo().count({
            where: { platformId: entityId },
        })
            
        const projectIds = (await projectRepo().find({
            where: { platformId: entityId },
            select: ['id'],
        })).map(p => p.id)
            
        const activeFlows = await flowRepo().count({
            where: { 
                projectId: In(projectIds),
                status: FlowStatus.ENABLED,
            },
        })
            
        const privatePieces = await pieceMetadataRepo().count({
            where: { platformId: entityId },
        })
            
        const tables = await tableRepo().count({
            where: { projectId: In(projectIds) },
        })
            
        const todos = await todoRepo().count({
            where: { platformId: entityId },
        })


        const projectUsage = {
            tasks,
            aiTokens,
            nextLimitResetDate: this.getCurrentBillingPeriodEnd(),
            users,
            activeFlows,
            projects,
            privatePieces,
            tables,
            todos,
        }
        
        return projectUsage
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
