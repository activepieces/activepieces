import path from 'node:path'
import { isNil, tryCatch, tryCatchSync } from '@activepieces/core-utils'
import { type ApLogger } from '@activepieces/server-utils'
import { FlowVersion, GetFlowBundleResponse, LATEST_FLOW_SCHEMA_VERSION, PiecePackage, WorkerToApiContract } from '@activepieces/shared'
import { bundleHttp } from '../../utils/bundle-http'
import { cacheUtils } from '../cache-paths'
import { cacheState } from '../cache-state'

const MISS = ''

// v1 manifests carried compiled `codes` for the removed esbuild pipeline; they
// parse as stale so affected flows rebuild from source and republish.
const BUNDLE_FORMAT_VERSION = 2

export const flowBundleStore = (log: ApLogger, apiClient: WorkerToApiContract, basePath: string) => ({
    async tryFetch({ flowVersionId, projectId }: TryFetchParams): Promise<MaterializedFlowBundle | null> {
        const cache = cacheState(path.join(cacheUtils(basePath).getGlobalCacheBundlesPath(), flowVersionId))
        const { state } = await cache.getOrSetCache({
            key: flowVersionId,
            // Local-first: a cached, current-schema manifest is a hit — no RPC, no disk writes.
            cacheMiss: (value) => isNil(parseManifest(value)),
            // Cold path only: fetch over RPC. Any failure (RPC, signed-URL download)
            // degrades to a MISS so the caller falls back to the legacy resolve
            // path — a bundle is an optimization and must never fail the run.
            installFn: async () => {
                const { data: state, error } = await tryCatch(async () => {
                    const response = await apiClient.getFlowBundle({ flowVersionId, projectId })
                    const data = await resolveBundleData(response)
                    if (isNil(data)) {
                        return MISS
                    }
                    const manifest = parseManifest(data.toString('utf8'))
                    if (isNil(manifest)) {
                        log.info({ flowVersion: { id: flowVersionId } }, 'Ignoring stale-schema flow bundle, rebuilding')
                        return MISS
                    }
                    return JSON.stringify(manifest)
                })
                if (error) {
                    log.warn({ error: String(error), flowVersion: { id: flowVersionId } }, 'Failed to fetch flow bundle, falling back to resolve')
                    return MISS
                }
                return state
            },
            // Never persist a miss, so a later-published bundle is picked up on the next run.
            skipSave: (value) => value === MISS,
        })
        const manifest = parseManifest(state)
        return isNil(manifest) ? null : { flowVersion: manifest.flowVersion, pieces: manifest.pieces }
    },

    async publish({ flowVersion, pieces, projectId, platformId }: PublishParams): Promise<void> {
        const manifest: FlowBundleManifest = { formatVersion: BUNDLE_FORMAT_VERSION, flowVersion, pieces }
        const data = Buffer.from(JSON.stringify(manifest), 'utf8')
        const prepared = await apiClient.prepareFlowBundleUpload({
            flowVersionId: flowVersion.id,
            projectId,
            platformId,
            size: data.length,
        })
        if (prepared.kind === 'skip') {
            return
        }
        if (prepared.kind === 'url') {
            await bundleHttp.put(prepared.url, data)
            return
        }
        await apiClient.uploadFlowBundle({
            flowVersionId: flowVersion.id,
            projectId,
            platformId,
            data,
        })
    },
})

async function resolveBundleData(response: GetFlowBundleResponse | null): Promise<Buffer | null> {
    if (isNil(response)) {
        return null
    }
    return response.kind === 'url' ? bundleHttp.getBuffer(response.url) : response.data
}

function parseManifest(value: string | null): FlowBundleManifest | null {
    if (isNil(value) || value === MISS) {
        return null
    }
    const { data: manifest } = tryCatchSync(() => JSON.parse(value) as FlowBundleManifest)
    if (isNil(manifest)
        || manifest.formatVersion !== BUNDLE_FORMAT_VERSION
        || manifest.flowVersion?.schemaVersion !== LATEST_FLOW_SCHEMA_VERSION) {
        return null
    }
    return manifest
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

type MaterializedFlowBundle = {
    flowVersion: FlowVersion
    pieces: PiecePackage[]
}

type FlowBundleManifest = {
    formatVersion: number
    flowVersion: FlowVersion
    pieces: PiecePackage[]
}
