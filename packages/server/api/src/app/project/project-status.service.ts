import { ActivepiecesError, ErrorCode, isNil, tryCatch } from '@activepieces/core-utils'
import { apDayjsDuration } from '@activepieces/server-utils'
import { ProjectStatus, RunEnvironment } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { distributedStore } from '../database/redis-connections'
import { projectRepo } from './project-repo'

const CACHE_TTL_SECONDS = apDayjsDuration(1, 'minute').asSeconds()
const getProjectStatusCacheKey = (projectId: string): string => `project:v1:${projectId}:status`

async function readStatus(projectId: string): Promise<ProjectStatus> {
    const cached = await distributedStore.get<string>(getProjectStatusCacheKey(projectId))
    if (!isNil(cached)) {
        return cached === ProjectStatus.INACTIVE ? ProjectStatus.INACTIVE : ProjectStatus.ACTIVE
    }

    const project = await projectRepo().findOne({
        select: ['status'],
        where: { id: projectId },
    })

    const status = project?.status ?? ProjectStatus.ACTIVE
    await distributedStore.put(getProjectStatusCacheKey(projectId), status, CACHE_TTL_SECONDS)
    return status
}

export const projectStatusService = (log: FastifyBaseLogger) => ({
    async isInactive({ projectId }: { projectId: string | null | undefined }): Promise<boolean> {
        if (isNil(projectId)) {
            return false
        }
        const { data: status, error } = await tryCatch(() => readStatus(projectId))
        if (error !== null) {
            log.warn({ project: { id: projectId }, error: String(error) }, '[projectStatusService] Failed to resolve project status, admitting the run')
            return false
        }
        return status === ProjectStatus.INACTIVE
    },

    async shouldBlockRun({ projectId, environment }: { projectId: string | null | undefined, environment: RunEnvironment }): Promise<boolean> {
        if (environment !== RunEnvironment.PRODUCTION) {
            return false
        }
        return this.isInactive({ projectId })
    },

    async assertRunIsAllowed({ projectId, environment }: { projectId: string | null | undefined, environment: RunEnvironment }): Promise<void> {
        const blocked = await this.shouldBlockRun({ projectId, environment })
        if (!blocked || isNil(projectId)) {
            return
        }
        throw new ActivepiecesError({
            code: ErrorCode.PROJECT_IS_INACTIVE,
            params: { projectId },
        })
    },

    async assertIsActive({ projectId }: { projectId: string | null | undefined }): Promise<void> {
        if (isNil(projectId)) {
            return
        }
        const inactive = await this.isInactive({ projectId })
        if (!inactive) {
            return
        }
        throw new ActivepiecesError({
            code: ErrorCode.PROJECT_IS_INACTIVE,
            params: { projectId },
        })
    },

    async invalidate({ projectId }: { projectId: string }): Promise<void> {
        await distributedStore.delete(getProjectStatusCacheKey(projectId))
    },
})
