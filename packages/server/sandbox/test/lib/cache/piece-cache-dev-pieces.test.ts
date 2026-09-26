import { randomUUID } from 'node:crypto'
import { rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PackageType, PieceType } from '@activepieces/shared'
import type { WorkerToApiContract } from '@activepieces/shared'
import type { ApLogger } from '@activepieces/server-utils'
import { pieceCache } from '../../../src/lib/cache/pieces/piece-cache'

const fakeLog = {
    level: 'silent',
    silent: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
    child: vi.fn().mockReturnThis(),
} as unknown as ApLogger

const fakeGetSettings = () => ({
    EXECUTION_MODE: 'UNSANDBOXED',
    DEV_PIECES: ['csv'],
    ENVIRONMENT: 'dev',
    REUSE_SANDBOX: undefined,
    FLOW_TIMEOUT_SECONDS: 600,
    MAX_FILE_SIZE_MB: 10,
    MAX_FLOW_RUN_LOG_SIZE_MB: 10,
    NETWORK_MODE: 'UNRESTRICTED' as never,
    SANDBOX_MEMORY_LIMIT: '1048576',
    SANDBOX_PROPAGATED_ENV_VARS: [] as string[],
    SSRF_ALLOW_LIST: [] as string[],
})

describe('piece-cache dev pieces', () => {
    const basePath = join(tmpdir(), `piece-cache-dev-test-${randomUUID()}`)
    const getPieceMock = vi.fn(async ({ name, version }: { name: string, version: string }) => ({
        packageType: PackageType.REGISTRY,
        pieceType: PieceType.OFFICIAL,
        name,
        version,
    }))
    const apiClient = { getPiece: getPieceMock } as unknown as WorkerToApiContract

    afterEach(() => {
        getPieceMock.mockClear()
        rmSync(basePath, { recursive: true, force: true })
    })

    async function getPieceTwice(pieceName: string): Promise<void> {
        const cache = pieceCache(fakeLog, apiClient, basePath, fakeGetSettings)
        await cache.getPiece({ pieceName, pieceVersion: '1.0.0', platformId: 'platform-1' })
        await cache.getPiece({ pieceName, pieceVersion: '1.0.0', platformId: 'platform-1' })
    }

    it('always refetches a dev piece referenced by its full package name', async () => {
        await getPieceTwice('@activepieces/piece-csv')
        expect(getPieceMock).toHaveBeenCalledTimes(2)
    })

    it('serves a non-dev piece from the disk cache after the first fetch', async () => {
        await getPieceTwice('@activepieces/piece-gmail')
        expect(getPieceMock).toHaveBeenCalledTimes(1)
    })
})
