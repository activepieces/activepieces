import {
    ActivepiecesError,
    ApEdition,
    ErrorCode,
    ProjectId,
    ProjectPlan,
    isNil,
} from '@activepieces/shared'

import { projectLimitsService } from './project-plan.service'
import { exceptionHandler } from 'server-shared'
import { flowRunService } from '../../flows/flow-run/flow-run-service'
import { getEdition } from '../../helper/secret-helper'
import { projectUsageService } from '../../project/usage/project-usage-service'
import { createRedisClient } from '../../database/redis-connection'
import { Redis } from 'ioredis'
import { projectService } from '../../project/project-service'

async function limitTasksPerMonth({
    projectPlan,
    consumedTasks,
}: {
    projectPlan: ProjectPlan
    consumedTasks: number
}): Promise<void> {
    if (consumedTasks > projectPlan.tasks) {
        throw new ActivepiecesError({
            code: ErrorCode.QUOTA_EXCEEDED,
            params: {
                metric: 'tasks',
                quota: projectPlan.tasks,
            },
        })
    }
}

async function limit({ projectId }: { projectId: ProjectId }): Promise<void> {
    const edition = getEdition()

    if (![ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(edition)) {
        return
    }

    try {
        const projectPlan = await projectLimitsService.getPlanByProjectId(projectId)
        if (!projectPlan) {
            return
        }
        const consumedTasks = await incrementOrCreateRedisRecord(projectId, 0)
        await limitTasksPerMonth({
            consumedTasks,
            projectPlan,
        })
    }
    catch (e) {
        if (
            e instanceof ActivepiecesError &&
            e.error.code === ErrorCode.QUOTA_EXCEEDED
        ) {
            throw e
        }
        else {
            // Ignore quota errors for sake of user experience and log them instead
            exceptionHandler.handle(e)
        }
    }
}

export const tasksLimit = {
    limit,
    incrementOrCreateRedisRecord,
}

const getRedisConnection = (() => {
    let redis: Redis | null = null

    return (): Redis => {
        if (!isNil(redis)) {
            return redis
        }
        redis = createRedisClient()
        return redis
    }
})()


async function incrementOrCreateRedisRecord(projectId: string, incrementBy: number): Promise<number> {
    const project = await projectService.getOneOrThrow(projectId)
    const billingPeriod = projectUsageService.getCurrentingStartPeriod(project.created)
    const key = `project-usage:${projectId}:${billingPeriod}`
    const redis = getRedisConnection()
    const keyExists = await redis.exists(key)

    if (keyExists === 0) {
        const consumedTasks = await flowRunService.getTasksUsedAfter({
            projectId,
            created: billingPeriod,
        })
        await redis.set(key, consumedTasks)
        return incrementBy
    }
    else { 
        return redis.incrby(key, incrementBy)
    }
}