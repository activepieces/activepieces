import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { ExecutionMode } from '@activepieces/shared'
import type { ApLogger } from '@activepieces/server-utils'

// EXECUTION_MODE is read at call time via workerSettings.getSettings(), so a single
// mutable holder lets each test pick the mode before invoking getCustomPiecesPath.
let executionMode: ExecutionMode = ExecutionMode.UNSANDBOXED

vi.mock('../../../../src/lib/config/worker-settings', () => ({
    workerSettings: {
        getSettings: () => ({ EXECUTION_MODE: executionMode, DEV_PIECES: [] }),
    },
}))

const { cacheRootPaths, LATEST_CACHE_VERSION } = await import('../../../../src/lib/execute/cache/cache-paths')
const { pieceInstaller } = await import('../../../../src/lib/execute/cache/pieces/piece-installer')

const fakeLog = { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn(), child: vi.fn().mockReturnThis() } as unknown as ApLogger
const fakeApiClient = {} as never
const getCustomPiecesPath = (platformId: string, cacheRoot?: string): string =>
    pieceInstaller(fakeLog, fakeApiClient).getCustomPiecesPath(platformId, cacheRoot)

const ROOT = '/tmp/parity-root'

// SRE-132: pins the exact on-disk layout the cache preparer produces so the per-project
// image build (SRE-135) cannot silently diverge from what the engine reads on the worker pool.
describe('cache layout parity', () => {
    describe('cacheRootPaths', () => {
        it('lays out every subpath under <root>/<version> with stable names', () => {
            const paths = cacheRootPaths(ROOT)
            const latest = path.resolve(ROOT, LATEST_CACHE_VERSION)

            expect(paths).toEqual({
                latestVersion: latest,
                common: path.join(latest, 'common'),
                codes: path.join(latest, 'codes'),
                pieces: path.join(latest, 'pieces-metadata'),
                flows: path.join(latest, 'flows'),
                enginePath: path.join(latest, 'common', 'main.js'),
            })
        })

        it('resolves a relative root to an absolute path (engine reads a fixed resolved path)', () => {
            const paths = cacheRootPaths('cache')

            expect(path.isAbsolute(paths.latestVersion)).toBe(true)
            expect(paths.latestVersion).toBe(path.resolve('cache', LATEST_CACHE_VERSION))
        })
    })

    describe('getCustomPiecesPath routes by EXECUTION_MODE', () => {
        it('UNSANDBOXED → pieces live in common/ (the cloud-image layout)', () => {
            executionMode = ExecutionMode.UNSANDBOXED
            expect(getCustomPiecesPath('platform-1', ROOT)).toBe(cacheRootPaths(ROOT).common)
        })

        it('SANDBOX_CODE_ONLY → pieces live in common/', () => {
            executionMode = ExecutionMode.SANDBOX_CODE_ONLY
            expect(getCustomPiecesPath('platform-1', ROOT)).toBe(cacheRootPaths(ROOT).common)
        })

        it('SANDBOX_PROCESS → pieces live in a per-platform custom_pieces/ subtree', () => {
            executionMode = ExecutionMode.SANDBOX_PROCESS
            expect(getCustomPiecesPath('platform-1', ROOT)).toBe(
                path.resolve(cacheRootPaths(ROOT).latestVersion, 'custom_pieces', 'platform-1'),
            )
        })

        it('SANDBOX_CODE_AND_PROCESS → pieces live in a per-platform custom_pieces/ subtree', () => {
            executionMode = ExecutionMode.SANDBOX_CODE_AND_PROCESS
            expect(getCustomPiecesPath('platform-2', ROOT)).toBe(
                path.resolve(cacheRootPaths(ROOT).latestVersion, 'custom_pieces', 'platform-2'),
            )
        })
    })
})
