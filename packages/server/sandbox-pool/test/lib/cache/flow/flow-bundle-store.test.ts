import { rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { isNil } from '@activepieces/core-utils'
import { type ApLogger } from '@activepieces/server-utils'
import { FlowActionType, FlowTriggerType, FlowVersion, FlowVersionState, LATEST_FLOW_SCHEMA_VERSION, PackageType, PieceType, WorkerToApiContract } from '@activepieces/shared'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cacheUtils } from '../../../../src/lib/cache/cache-paths'
import { codeCache } from '../../../../src/lib/cache/flow/code/code-cache'
import { flowBundleStore } from '../../../../src/lib/cache/flow/flow-bundle-store'
import { bundleHttp } from '../../../../src/lib/utils/bundle-http'

vi.mock('../../../../src/lib/utils/bundle-http', () => ({
    bundleHttp: { getBuffer: vi.fn(), put: vi.fn() },
}))

const folders: string[] = []

function uniqueBasePath(): string {
    const folder = join(tmpdir(), `flow-bundle-store-test-${randomUUID()}`)
    folders.push(folder)
    return folder
}

const fakeLog = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), child: vi.fn().mockReturnThis() } as unknown as ApLogger

function buildFlowVersion(overrides: Partial<FlowVersion> = {}): FlowVersion {
    return {
        id: 'fv1',
        created: '2026-01-01T00:00:00.000Z',
        updated: '2026-01-01T00:00:00.000Z',
        flowId: 'flow1',
        displayName: 'Test Flow',
        updatedBy: null,
        valid: true,
        schemaVersion: LATEST_FLOW_SCHEMA_VERSION,
        agentIds: [],
        state: FlowVersionState.LOCKED,
        connectionIds: [],
        backupFiles: null,
        notes: [],
        trigger: {
            name: 'trigger',
            type: FlowTriggerType.EMPTY,
            displayName: 'Trigger',
            valid: true,
            settings: {},
            nextAction: {
                name: 'step_1',
                type: FlowActionType.CODE,
                displayName: 'Code',
                valid: true,
                settings: { sourceCode: { code: 'x', packageJson: '{}' }, input: {}, inputUiInfo: {} },
            },
        },
        ...overrides,
    } as unknown as FlowVersion
}

const piece = { packageType: PackageType.REGISTRY, pieceType: PieceType.OFFICIAL, pieceName: '@activepieces/piece-http', pieceVersion: '1.0.0' }

function inMemoryApiClient(): { apiClient: WorkerToApiContract, getFlowBundle: ReturnType<typeof vi.fn> } {
    let stored: Buffer | null = null
    const getFlowBundle = vi.fn(async () => (isNil(stored) ? null : { kind: 'inline', data: stored }))
    const apiClient = {
        getFlowBundle,
        async prepareFlowBundleUpload() {
            return { kind: 'inline' }
        },
        async uploadFlowBundle({ data }: { data: Buffer }) {
            stored = data
        },
    } as unknown as WorkerToApiContract
    return { apiClient, getFlowBundle }
}

afterEach(async () => {
    for (const f of folders) {
        await rm(f, { recursive: true, force: true })
    }
    folders.length = 0
    vi.clearAllMocks()
})

describe('flowBundleStore', () => {
    it('publish then tryFetch round-trips flow + pieces and materializes compiled code on disk', async () => {
        const basePath = uniqueBasePath()
        const { apiClient } = inMemoryApiClient()
        const flowVersion = buildFlowVersion()
        const codes = codeCache(cacheUtils(basePath).getGlobalCodeCachePath())
        await codes.writeCompiledStep({ flowVersionId: flowVersion.id, stepName: 'step_1', compiledJs: 'exports.code = () => 1' })

        await flowBundleStore(fakeLog, apiClient, basePath).publish({ flowVersion, pieces: [piece], projectId: 'p1', platformId: 'plat1' })

        const fetchBasePath = uniqueBasePath()
        const fetched = await flowBundleStore(fakeLog, apiClient, fetchBasePath).tryFetch({ flowVersionId: flowVersion.id, projectId: 'p1' })

        expect(fetched?.flowVersion.id).toBe('fv1')
        expect(fetched?.pieces).toEqual([piece])
        const fetchedCodes = codeCache(cacheUtils(fetchBasePath).getGlobalCodeCachePath())
        expect(await fetchedCodes.readCompiledStep({ flowVersionId: flowVersion.id, stepName: 'step_1' })).toBe('exports.code = () => 1')
    })

    it('tryFetch is local-first: a second fetch is served from the local cache with no further RPC', async () => {
        const basePath = uniqueBasePath()
        const { apiClient, getFlowBundle } = inMemoryApiClient()
        const flowVersion = buildFlowVersion()
        const codes = codeCache(cacheUtils(basePath).getGlobalCodeCachePath())
        await codes.writeCompiledStep({ flowVersionId: flowVersion.id, stepName: 'step_1', compiledJs: 'exports.code = () => 1' })
        await flowBundleStore(fakeLog, apiClient, basePath).publish({ flowVersion, pieces: [piece], projectId: 'p1', platformId: 'plat1' })

        const first = await flowBundleStore(fakeLog, apiClient, basePath).tryFetch({ flowVersionId: flowVersion.id, projectId: 'p1' })
        const second = await flowBundleStore(fakeLog, apiClient, basePath).tryFetch({ flowVersionId: flowVersion.id, projectId: 'p1' })

        expect(first?.flowVersion.id).toBe('fv1')
        expect(second?.flowVersion.id).toBe('fv1')
        expect(getFlowBundle).toHaveBeenCalledTimes(1)
    })

    it('tryFetch returns null when no bundle is stored', async () => {
        const basePath = uniqueBasePath()
        const apiClient = { async getFlowBundle() { return null } } as unknown as WorkerToApiContract
        expect(await flowBundleStore(fakeLog, apiClient, basePath).tryFetch({ flowVersionId: 'fv1', projectId: 'p1' })).toBeNull()
    })

    it('tryFetch ignores a bundle whose schemaVersion is stale (self-heals via rebuild)', async () => {
        const basePath = uniqueBasePath()
        const { apiClient } = inMemoryApiClient()
        const staleFlowVersion = buildFlowVersion({ schemaVersion: '1' })
        const codes = codeCache(cacheUtils(basePath).getGlobalCodeCachePath())
        await codes.writeCompiledStep({ flowVersionId: staleFlowVersion.id, stepName: 'step_1', compiledJs: 'old' })

        await flowBundleStore(fakeLog, apiClient, basePath).publish({ flowVersion: staleFlowVersion, pieces: [piece], projectId: 'p1', platformId: 'plat1' })

        expect(await flowBundleStore(fakeLog, apiClient, basePath).tryFetch({ flowVersionId: staleFlowVersion.id, projectId: 'p1' })).toBeNull()
    })

    it('publish uploads via signed PUT (no inline RPC) when prepare returns a url', async () => {
        const basePath = uniqueBasePath()
        const put = vi.mocked(bundleHttp.put).mockResolvedValue(undefined)
        const apiClient = {
            async prepareFlowBundleUpload() { return { kind: 'url', url: 'https://s3/put' } },
            async uploadFlowBundle() { throw new Error('inline upload must not be called') },
        } as unknown as WorkerToApiContract
        const flowVersion = buildFlowVersion()
        const codes = codeCache(cacheUtils(basePath).getGlobalCodeCachePath())
        await codes.writeCompiledStep({ flowVersionId: flowVersion.id, stepName: 'step_1', compiledJs: 'exports.code = () => 1' })

        await flowBundleStore(fakeLog, apiClient, basePath).publish({ flowVersion, pieces: [piece], projectId: 'p1', platformId: 'plat1' })

        expect(put).toHaveBeenCalledOnce()
        expect(put.mock.calls[0][0]).toBe('https://s3/put')
    })

    it('tryFetch downloads from a signed URL and materializes compiled code', async () => {
        const basePath = uniqueBasePath()
        const flowVersion = buildFlowVersion()
        const manifest = { flowVersion, pieces: [piece], codes: [{ stepName: 'step_1', compiledJs: 'exports.code = () => 1' }] }
        vi.mocked(bundleHttp.getBuffer).mockResolvedValue(Buffer.from(JSON.stringify(manifest), 'utf8'))
        const apiClient = {
            getFlowBundle: vi.fn(async () => ({ kind: 'url', url: 'https://s3/get' })),
        } as unknown as WorkerToApiContract

        const fetched = await flowBundleStore(fakeLog, apiClient, basePath).tryFetch({ flowVersionId: flowVersion.id, projectId: 'p1' })

        expect(fetched?.flowVersion.id).toBe('fv1')
        expect(bundleHttp.getBuffer).toHaveBeenCalledWith('https://s3/get')
        const fetchedCodes = codeCache(cacheUtils(basePath).getGlobalCodeCachePath())
        expect(await fetchedCodes.readCompiledStep({ flowVersionId: flowVersion.id, stepName: 'step_1' })).toBe('exports.code = () => 1')
    })

    it('tryFetch returns null and does not cache when the signed-URL download fails (retries next run)', async () => {
        const basePath = uniqueBasePath()
        vi.mocked(bundleHttp.getBuffer).mockRejectedValue(new Error('network down'))
        const getFlowBundle = vi.fn(async () => ({ kind: 'url', url: 'https://s3/get' }))
        const apiClient = { getFlowBundle } as unknown as WorkerToApiContract

        const first = await flowBundleStore(fakeLog, apiClient, basePath).tryFetch({ flowVersionId: 'fv1', projectId: 'p1' })
        const second = await flowBundleStore(fakeLog, apiClient, basePath).tryFetch({ flowVersionId: 'fv1', projectId: 'p1' })

        expect(first).toBeNull()
        expect(second).toBeNull()
        expect(getFlowBundle).toHaveBeenCalledTimes(2)
    })
})
