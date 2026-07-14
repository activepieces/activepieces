import path from 'node:path'
import { isNil, tryCatch, tryCatchSync } from '@activepieces/core-utils'
import { type ApLogger } from '@activepieces/server-utils'
import { FlowVersion, GetFlowBundleResponse, LATEST_FLOW_SCHEMA_VERSION, PiecePackage, WorkerToApiContract } from '@activepieces/shared'
import { bundleHttp } from '../../utils/bundle-http'
import { cacheUtils } from '../cache-paths'
import { cacheState } from '../cache-state'
import { codeCache } from './code/code-cache'
import { flowSteps } from './flow-steps'

const MISS = ''
// Bump when the SET of pieces we resolve into a bundle changes for a reason the flow's schemaVersion does
// not capture (e.g. #13798 started including agent-tool pieces). Bundles built before the bump lack the
// field, so parseManifest rejects them and they rebuild on next run — schemaVersion alone can't catch this.
const FLOW_BUNDLE_FORMAT_VERSION = 2

export const flowBundleStore = (log: ApLogger, apiClient: WorkerToApiContract, basePath: string) => ({
    async tryFetch({ flowVersionId, projectId }: TryFetchParams): Promise<MaterializedFlowBundle | null> {
        const cache = cacheState(path.join(cacheUtils(basePath).getGlobalCacheBundlesPath(), flowVersionId))
        const { state } = await cache.getOrSetCache({
            key: flowVersionId,
            // Local-first: a cached, current-schema manifest is a hit — no RPC, no disk writes.
            cacheMiss: (value) => isNil(parseManifest(value)),
            // Cold path only: fetch over RPC and materialize compiled code to disk.
            // Any failure (RPC, signed-URL download, disk write) degrades to a MISS so
            // the caller falls back to the legacy resolve path — a bundle is an
            // optimization and must never fail the run.
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
                    await materializeCode({ manifest, basePath })
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
        const codes = codeCache(cacheUtils(basePath).getGlobalCodeCachePath())
        const compiledSteps = await Promise.all(flowSteps.code(flowVersion).map(async ({ name: stepName }) => ({
            stepName,
            compiledJs: await codes.readCompiledStep({ flowVersionId: flowVersion.id, stepName }),
        })))
        const manifest: FlowBundleManifest = { flowVersion, pieces, codes: compiledSteps, bundleFormatVersion: FLOW_BUNDLE_FORMAT_VERSION }
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
    if (isNil(manifest) || manifest.flowVersion?.schemaVersion !== LATEST_FLOW_SCHEMA_VERSION || manifest.bundleFormatVersion !== FLOW_BUNDLE_FORMAT_VERSION) {
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
    bundleFormatVersion: number
}

type CompiledCodeStep = {
    stepName: string
    compiledJs: string
}
