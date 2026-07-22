import { isNil } from '@activepieces/core-utils'
import { ApEdition, FlowStatus, FlowVersionState, PrewarmDataRequest, PrewarmDataResponse } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { accessTokenManager } from '../authentication/lib/access-token-manager'
import { distributedLock, distributedStore } from '../database/redis-connections'
import { workerGroupService } from '../ee/platform/platform-plan/worker-group.service'
import Paginator from '../helper/pagination/paginator'
import { system } from '../helper/system/system'
import { platformService } from '../platform/platform.service'
import { projectService } from '../project/project-service'
import { projectWorkerGroupService } from '../project/project-worker-group.service'
import { flowService } from './flow/flow.service'


const SHARED_CACHE_KEY = '__shared__'
const CACHE_TTL_SECONDS = 5 * 60
const LOCK_TIMEOUT_SECONDS = 30
const EMPTY_RESPONSE: PrewarmDataResponse = { flows: [], platformId: '', engineToken: '' }
const BASE_LIST_PARAMS = {
    status: [FlowStatus.ENABLED],
    versionState: FlowVersionState.LOCKED,
    limit: Paginator.NO_LIMIT,
    includeTriggerSource: false,
}

export const preWarmWorkersService = (log: FastifyBaseLogger) => ({
    async getPrewarmData(input: PrewarmDataRequest): Promise<PrewarmDataResponse> {
        // Targeted prewarm (flowPublished): the flow is already known, so skip listing (and the cache) and just mint a token for its project.
        if (!isNil(input.flow)) {
            if (system.getEdition() === ApEdition.CLOUD && isNil(input.workerGroupId)) {
                return EMPTY_RESPONSE
            }
            const platformId = await projectService(log).getPlatformId(input.flow.projectId)
            const engineToken = await accessTokenManager(log).generateEngineToken({ projectId: input.flow.projectId, platformId })
            return { flows: [input.flow], platformId, engineToken }
        }

        const scope = await resolveCachedScope(input, log)
        if (isNil(scope)) {
            return EMPTY_RESPONSE
        }
        const engineToken = await accessTokenManager(log).generateEngineToken({
            projectId: scope.tokenProjectId,
            platformId: scope.platformId,
        })
        return { flows: scope.flows, platformId: scope.platformId, engineToken }
    },
})

async function resolveCachedScope(input: PrewarmDataRequest, log: FastifyBaseLogger): Promise<PrewarmScope | null> {
    const scopeId = input.workerGroupId ?? SHARED_CACHE_KEY
    const cacheKey = `prewarm:scope:${scopeId}`
    const cached = await distributedStore.get<PrewarmScope>(cacheKey)
    if (!isNil(cached)) {
        return cached
    }
    // Workers (re)connect in a herd on deploy; serialize the compute so only the first one lists flows
    // and the rest wait for the lock, then read the populated cache below.
    return distributedLock(log).runExclusive({
        key: `${cacheKey}:lock`,
        timeoutInSeconds: LOCK_TIMEOUT_SECONDS,
        fn: async () => {
            const cachedAfterLock = await distributedStore.get<PrewarmScope>(cacheKey)
            if (!isNil(cachedAfterLock)) {
                return cachedAfterLock
            }
            const scope = await computeScope(input, log)
            if (!isNil(scope)) {
                await distributedStore.put(cacheKey, scope, CACHE_TTL_SECONDS)
            }
            return scope
        },
    })
}

async function computeScope(input: PrewarmDataRequest, log: FastifyBaseLogger): Promise<PrewarmScope | null> {
    let projectIds: string[] | undefined = undefined
    let platformId: string | undefined = undefined

    // For cloud we only prewarm dedicated workers (with a worker group id) — shared workers handle every
    // user's flows, so there is no bounded set to warm.
    if (system.getEdition() === ApEdition.CLOUD) {
        if (isNil(input.workerGroupId)) {
            return null
        }
        if (input.projectWorker) {
            projectIds = await projectWorkerGroupService(log).getWorkerGroupProjects({ workerGroupId: input.workerGroupId })
            if (isNil(projectIds) || projectIds.length === 0) {
                return null
            }
            platformId = await projectService(log).getPlatformId(projectIds[0])
        }
        else {
            platformId = await workerGroupService(log).getWorkerGroupPlatformId({ workerGroupId: input.workerGroupId }) ?? undefined
            if (isNil(platformId)) {
                return null
            }
        }
    }
    else {
        const platform = await platformService(log).getOldestPlatform()
        if (isNil(platform)) {
            return null
        }
        platformId = platform.id
    }

    const activeFlows = await flowService(log).list(
        !isNil(projectIds) ? { ...BASE_LIST_PARAMS, projectIds } : { ...BASE_LIST_PARAMS, platformId },
    )
    const flows = activeFlows.data.map((flow) => ({ id: flow.id, versionId: flow.version.id, projectId: flow.projectId }))
    const tokenProjectId = projectIds?.[0] ?? (await projectService(log).getProjectIdsByPlatform(platformId))[0]
    return { flows, platformId, tokenProjectId }
}


type PrewarmScope = {
    flows: PrewarmDataResponse['flows']
    platformId: string
    tokenProjectId: string
}
