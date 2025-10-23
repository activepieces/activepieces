import path from 'path'
import { isNil, Project, ProjectId } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { ApAxiosClient } from '../api/ap-axios'
import { engineApiService } from '../api/server-api.service'
import { cacheState } from './cache-state'
import { GLOBAL_CACHE_PROJECTS_PATH } from './worker-cache'

export const projectWorkerCache = (log: FastifyBaseLogger) => ({
    async getProject({ engineToken, projectId }: GetProjectRequest): Promise<Project | null> {
        try {
            const cache = cacheState(path.join(GLOBAL_CACHE_PROJECTS_PATH, projectId), log)
            
            const { state } = await cache.getOrSetCache({
                key: projectId,
                cacheMiss: (project: string) => {
                    return isNil(project)
                },
                installFn: async () => {
                    const project = await engineApiService(engineToken).getProject(projectId)
                    log.info({
                        message: '[projectWorkerCache] Installing project',
                        projectId,
                        maxConcurrentJobs: project?.maxConcurrentJobs,
                        found: !isNil(project),
                    })
                    return JSON.stringify(project)
                },
                skipSave: (project: string) => {
                    return isNil(project)
                },
            })

            if (isNil(state)) {
                return null
            }
            return JSON.parse(state as string) as Project
        }
        catch (e) {
            if (ApAxiosClient.isApAxiosError(e) && e.error.response && e.error.response.status === 404) {
                return null
            }
            throw e
        }
    },
})

type GetProjectRequest = {
    engineToken: string
    projectId: ProjectId
}