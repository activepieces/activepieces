import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { ActivepiecesError, ErrorCode } from '@activepieces/core-utils'
import { describe, expect, it, vi } from 'vitest'
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
    DEV_PIECES: [] as string[],
    ENVIRONMENT: 'production',
    REUSE_SANDBOX: undefined,
    FLOW_TIMEOUT_SECONDS: 600,
    MAX_FILE_SIZE_MB: 10,
    MAX_FLOW_RUN_LOG_SIZE_MB: 10,
    NETWORK_MODE: 'UNRESTRICTED' as never,
    SANDBOX_MEMORY_LIMIT: '1048576',
    SANDBOX_PROPAGATED_ENV_VARS: [] as string[],
    SSRF_ALLOW_LIST: [] as string[],
})

describe('piece-cache pieceName path traversal', () => {
    const getPieceMock = vi.fn()
    const apiClient = { getPiece: getPieceMock } as unknown as WorkerToApiContract
    const basePath = join(tmpdir(), `piece-cache-test-${randomUUID()}`)

    it.each([
        '../../common/node_modules/x',
        '../../../usr/local/lib',
        '..',
        '@activepieces/..',
    ])('rejects a traversal pieceName %j before any fetch', async (pieceName) => {
        getPieceMock.mockReset()
        let thrown: unknown
        try {
            await pieceCache(fakeLog, apiClient, basePath, fakeGetSettings).getPiece({
                pieceName,
                pieceVersion: '1.0.0',
                platformId: 'platform-1',
            })
        }
        catch (error) {
            thrown = error
        }
        if (!(thrown instanceof ActivepiecesError)) {
            throw new Error(`expected an ActivepiecesError, got: ${String(thrown)}`)
        }
        expect(thrown.error.code).toBe(ErrorCode.VALIDATION)
        if (thrown.error.code === ErrorCode.VALIDATION) {
            expect(thrown.error.params.message).toContain('pieceName')
        }
        expect(getPieceMock).not.toHaveBeenCalled()
    })
})
