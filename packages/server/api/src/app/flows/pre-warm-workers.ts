import { chunk, isNil } from '@activepieces/core-utils'
import { PieceMetadataModel } from '@activepieces/pieces-framework'
import { ApEdition, FlowActionType, FlowStatus, flowStructureUtil, FlowTriggerType, FlowVersion, FlowVersionState, PackageType, PiecePackage, PieceType, PrewarmCodeStep, PrewarmDataRequest, PrewarmDataResponse } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { accessTokenManager } from '../authentication/lib/access-token-manager'
import { distributedLock, distributedStore } from '../database/redis-connections'
import { workerGroupService } from '../ee/platform/platform-plan/worker-group.service'
import Paginator from '../helper/pagination/paginator'
import { system } from '../helper/system/system'
import { pieceMetadataService } from '../pieces/metadata/piece-metadata-service'
import { platformService } from '../platform/platform.service'
import { projectService } from '../project/project-service'
import { projectWorkerGroupService } from '../project/project-worker-group.service'
import { flowService } from './flow/flow.service'


const SHARED_CACHE_KEY = '__shared__'
const CACHE_TTL_SECONDS = 5 * 60
const LOCK_TIMEOUT_SECONDS = 30
const PIECE_LOOKUP_CONCURRENCY = 25
const EMPTY_RESPONSE: PrewarmDataResponse = { pieces: [], codes: [], platformId: '', engineToken: '' }
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
            return { flows: [input.flow], pieces: [], codes: [], platformId, engineToken }
        }

        const scope = await resolveCachedScope(input, log)
        if (isNil(scope)) {
            return EMPTY_RESPONSE
        }
        const engineToken = await accessTokenManager(log).generateEngineToken({
            projectId: scope.tokenProjectId,
            platformId: scope.platformId,
        })
        return { pieces: scope.pieces, codes: scope.codes, platformId: scope.platformId, engineToken }
    },
})

async function resolveCachedScope(input: PrewarmDataRequest, log: FastifyBaseLogger): Promise<PrewarmScope | null> {
    const scopeId = input.workerGroupId ?? SHARED_CACHE_KEY
    const cacheKey = `prewarm:scope:v2:${scopeId}`
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
    // The versions are already loaded by the list above, so the pieces and code steps every flow needs
    // are computed here in one pass — the worker warms from the distinct set instead of resolving each
    // flow over RPC, which made prewarm scale with flow count instead of distinct piece count.
    const versions = activeFlows.data.map((flow) => flow.version)
    const codes = versions.flatMap(extractCodeSteps)
    const pieces = await resolvePiecePackages({ versions, platformId, log })
    const tokenProjectId = projectIds?.[0] ?? (await projectService(log).getProjectIdsByPlatform(platformId))[0]
    return { pieces, codes, platformId, tokenProjectId }
}

function extractCodeSteps(flowVersion: FlowVersion): PrewarmCodeStep[] {
    return flowStructureUtil.getAllSteps(flowVersion.trigger)
        .filter((step) => step.type === FlowActionType.CODE)
        .map((step) => ({
            name: step.name,
            sourceCode: step.settings.sourceCode,
            flowVersionId: flowVersion.id,
            flowVersionState: flowVersion.state,
        }))
}

async function resolvePiecePackages({ versions, platformId, log }: ResolvePiecePackagesParams): Promise<PiecePackage[]> {
    const refsByKey = new Map<string, PieceRef>()
    for (const version of versions) {
        for (const step of flowStructureUtil.getAllSteps(version.trigger)) {
            if (step.type !== FlowActionType.PIECE && step.type !== FlowTriggerType.PIECE) {
                continue
            }
            const { pieceName, pieceVersion } = step.settings
            refsByKey.set(`${pieceName}@${pieceVersion}`, { pieceName, pieceVersion })
        }
    }
    const pieces: PiecePackage[] = []
    for (const batch of chunk([...refsByKey.values()], PIECE_LOOKUP_CONCURRENCY)) {
        const resolvedBatch = await Promise.all(batch.map(async (ref) => {
            const metadata = await pieceMetadataService(log).get({ name: ref.pieceName, version: ref.pieceVersion, platformId })
            if (isNil(metadata)) {
                log.warn({ piece: { name: ref.pieceName, version: ref.pieceVersion } }, 'Skipping missing piece during prewarm')
                return null
            }
            return toPiecePackage({ metadata, platformId })
        }))
        pieces.push(...resolvedBatch.filter((piece) => !isNil(piece)))
    }
    return pieces
}

function toPiecePackage({ metadata, platformId }: ToPiecePackageParams): PiecePackage | null {
    if (metadata.packageType === PackageType.ARCHIVE) {
        if (isNil(metadata.archiveId)) {
            return null
        }
        return {
            packageType: PackageType.ARCHIVE,
            pieceType: metadata.pieceType,
            pieceName: metadata.name,
            pieceVersion: metadata.version,
            archiveId: metadata.archiveId,
            platformId,
        }
    }
    if (metadata.pieceType === PieceType.CUSTOM) {
        return {
            packageType: PackageType.REGISTRY,
            pieceType: PieceType.CUSTOM,
            pieceName: metadata.name,
            pieceVersion: metadata.version,
            platformId,
        }
    }
    return {
        packageType: PackageType.REGISTRY,
        pieceType: PieceType.OFFICIAL,
        pieceName: metadata.name,
        pieceVersion: metadata.version,
    }
}


type PrewarmScope = {
    pieces: PiecePackage[]
    codes: PrewarmCodeStep[]
    platformId: string
    tokenProjectId: string
}

type PieceRef = {
    pieceName: string
    pieceVersion: string
}

type ResolvePiecePackagesParams = {
    versions: FlowVersion[]
    platformId: string
    log: FastifyBaseLogger
}

type ToPiecePackageParams = {
    metadata: PieceMetadataModel
    platformId: string
}
