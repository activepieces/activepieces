import path from 'node:path'
import { isNil, tryCatchSync } from '@activepieces/core-utils'
import { type ApLogger } from '@activepieces/server-utils'
import { FlowActionType, flowStructureUtil, FlowVersion, LATEST_FLOW_SCHEMA_VERSION, PiecePackage, WorkerToApiContract } from '@activepieces/shared'
import { cacheUtils } from '../cache-paths'
import { cacheState } from '../cache-state'
import { codeCache } from './code/code-cache'

const MISS = ''

export const flowBundleStore = (log: ApLogger, apiClient: WorkerToApiContract, basePath: string) => ({
    async tryFetch({ flowVersionId, projectId }: TryFetchParams): Promise<MaterializedFlowBundle | null> {
        const cache = cacheState(path.join(cacheUtils(basePath).getGlobalCacheBundlesPath(), flowVersionId))
        const { state } = await cache.getOrSetCache({
            key: flowVersionId,
            // Local-first: a cached, current-schema manifest is a hit — no RPC, no disk writes.
            cacheMiss: (value) => isNil(parseManifest(value)),
            // Cold path only: fetch over RPC and materialize compiled code to disk.
            installFn: async () => {
                const data = await apiClient.getFlowBundle({ flowVersionId, projectId })
                if (isNil(data)) {
                    return MISS
                }
                const manifest = parseManifest(data.toString('utf8'))
                if (isNil(manifest)) {
                    log.info({ flowVersion: { id: flowVersionId } }, 'Ignoring stale-schema flow bundle, rebuilding')
                    return MISS
                }
                await materializeCode({ manifest, basePath })
                return JSON.stringify(manifest)
            },
            // Never persist a miss, so a later-published bundle is picked up on the next run.
            skipSave: (value) => value === MISS,
        })
        const manifest = parseManifest(state)
        return isNil(manifest) ? null : { flowVersion: manifest.flowVersion, pieces: manifest.pieces }
    },

    async publish({ flowVersion, pieces, projectId, platformId }: PublishParams): Promise<void> {
        const codes = codeCache(cacheUtils(basePath).getGlobalCodeCachePath())
        const compiledSteps = await Promise.all(codeStepNames(flowVersion).map(async (stepName) => ({
            stepName,
            compiledJs: await codes.readCompiledStep({ flowVersionId: flowVersion.id, stepName }),
        })))
        const manifest: FlowBundleManifest = { flowVersion, pieces, codes: compiledSteps }
        await apiClient.uploadFlowBundle({
            flowVersionId: flowVersion.id,
            projectId,
            platformId,
            data: Buffer.from(JSON.stringify(manifest), 'utf8'),
        })
    },
})

async function materializeCode({ manifest, basePath }: MaterializeCodeParams): Promise<void> {
    const codes = codeCache(cacheUtils(basePath).getGlobalCodeCachePath())
    await Promise.all(manifest.codes.map(({ stepName, compiledJs }) =>
        codes.writeCompiledStep({ flowVersionId: manifest.flowVersion.id, stepName, compiledJs }),
    ))
}

function parseManifest(value: string | null): FlowBundleManifest | null {
    if (isNil(value) || value === MISS) {
        return null
    }
    const { data: manifest } = tryCatchSync(() => JSON.parse(value) as FlowBundleManifest)
    if (isNil(manifest) || manifest.flowVersion?.schemaVersion !== LATEST_FLOW_SCHEMA_VERSION) {
        return null
    }
    return manifest
}

function codeStepNames(flowVersion: FlowVersion): string[] {
    return flowStructureUtil.getAllSteps(flowVersion.trigger)
        .filter((step) => step.type === FlowActionType.CODE)
        .map((step) => step.name)
}

type TryFetchParams = {
    flowVersionId: string
    projectId: string
}

type PublishParams = {
    flowVersion: FlowVersion
    pieces: PiecePackage[]
    projectId: string
    platformId: string
}

type MaterializeCodeParams = {
    manifest: FlowBundleManifest
    basePath: string
}

type MaterializedFlowBundle = {
    flowVersion: FlowVersion
    pieces: PiecePackage[]
}

type FlowBundleManifest = {
    flowVersion: FlowVersion
    pieces: PiecePackage[]
    codes: CompiledCodeStep[]
}

type CompiledCodeStep = {
    stepName: string
    compiledJs: string
}
