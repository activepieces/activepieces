import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { isNil, tryCatch, tryCatchSync } from '@activepieces/core-utils'
import { type ApLogger, fileSystemUtils } from '@activepieces/server-utils'
import { FlowVersion, GetFlowBundleResponse, LATEST_FLOW_SCHEMA_VERSION, PiecePackage, WorkerToApiContract } from '@activepieces/shared'
import writeFileAtomic from 'write-file-atomic'
import { bundleHttp } from '../../utils/bundle-http'
import { cacheUtils } from '../cache-paths'
import { codeCache } from './code/code-cache'
import { flowSteps } from './flow-steps'

const MANIFEST_FILE = 'manifest.json'

export const flowBundleStore = (log: ApLogger, apiClient: WorkerToApiContract, basePath: string) => ({
    async tryFetch({ flowVersionId, projectId }: TryFetchParams): Promise<MaterializedFlowBundle | null> {
        const manifestPath = path.join(cacheUtils(basePath).getGlobalCacheBundlesPath(), flowVersionId, MANIFEST_FILE)
        const cached = await readManifest(manifestPath)
        if (!isNil(cached)) {
            return { flowVersion: cached.flowVersion, pieces: cached.pieces }
        }
        const { data: manifest, error } = await tryCatch(async () => {
            const response = await apiClient.getFlowBundle({ flowVersionId, projectId })
            const data = await resolveBundleData(response)
            if (isNil(data)) {
                return null
            }
            const raw = data.toString('utf8')
            const parsed = parseManifest(raw)
            if (isNil(parsed)) {
                log.info({ flowVersion: { id: flowVersionId } }, 'Ignoring stale-schema flow bundle, rebuilding')
                return null
            }
            await materializeCode({ manifest: parsed, basePath })
            await writeManifest({ manifestPath, raw })
            return parsed
        })
        if (error) {
            log.warn({ error: String(error), flowVersion: { id: flowVersionId } }, 'Failed to fetch flow bundle, falling back to resolve')
            return null
        }
        return isNil(manifest) ? null : { flowVersion: manifest.flowVersion, pieces: manifest.pieces }
    },

    async publish({ flowVersion, pieces, projectId, platformId }: PublishParams): Promise<void> {
        const codes = codeCache(cacheUtils(basePath).getGlobalCodeCachePath())
        const compiledSteps = await Promise.all(flowSteps.code(flowVersion).map(async ({ name: stepName }) => ({
            stepName,
            compiledJs: await codes.readCompiledStep({ flowVersionId: flowVersion.id, stepName }),
        })))
        const manifest: FlowBundleManifest = { flowVersion, pieces, codes: compiledSteps }
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

async function readManifest(manifestPath: string): Promise<FlowBundleManifest | null> {
    const { data } = await tryCatch(() => readFile(manifestPath, 'utf8'))
    return isNil(data) ? null : parseManifest(data)
}

async function writeManifest({ manifestPath, raw }: WriteManifestParams): Promise<void> {
    await fileSystemUtils.threadSafeMkdir(path.dirname(manifestPath))
    await writeFileAtomic(manifestPath, raw, 'utf8')
}

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
    if (isNil(value) || value === '') {
        return null
    }
    const { data: manifest } = tryCatchSync(() => JSON.parse(value) as FlowBundleManifest)
    if (isNil(manifest) || manifest.flowVersion?.schemaVersion !== LATEST_FLOW_SCHEMA_VERSION) {
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

type WriteManifestParams = {
    manifestPath: string
    raw: string
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
