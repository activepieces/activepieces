import { access, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PackageType, PieceType } from '@activepieces/shared'
import type { OfficialPiecePackage } from '@activepieces/shared'
import type { ApLogger } from '@activepieces/server-utils'

// Module-level variable updated per test so the vi.mock factory can reference it
let testWorkspace = ''

const mockGet = vi.fn()
const mockGetPieceBundleUrl = vi.fn()
const mockBunInstall = vi.fn()

vi.mock('@activepieces/server-utils', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@activepieces/server-utils')>()
    return {
        ...actual,
        safeHttp: { retryingAxios: { get: mockGet } },
    }
})

vi.mock('../../../src/lib/cache/code/bun-runner', () => ({
    bunRunner: () => ({ install: mockBunInstall }),
}))

vi.mock('../../../src/lib/cache/cache-paths', () => ({
    cacheUtils: () => ({
        getGlobalCacheCommonPath: () => testWorkspace,
        getGlobalCachePathLatestVersion: () => testWorkspace,
    }),
}))

// Import after mocks are registered
const { pieceInstaller } = await import('../../../src/lib/cache/pieces/piece-installer')

function makePiece(name: string, version = '1.0.0'): OfficialPiecePackage {
    return {
        packageType: PackageType.REGISTRY,
        pieceType: PieceType.OFFICIAL,
        pieceName: name,
        pieceVersion: version,
    }
}

function pieceDirPath(piece: OfficialPiecePackage): string {
    return join(testWorkspace, 'pieces', `${piece.pieceName}-${piece.pieceVersion}`)
}

function readyFilePath(piece: OfficialPiecePackage): string {
    return join(pieceDirPath(piece), 'ready')
}

async function pathExists(p: string): Promise<boolean> {
    return access(p).then(() => true, () => false)
}

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

const fakeApiClient = { getPieceBundleUrl: mockGetPieceBundleUrl } as never

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

beforeEach(async () => {
    testWorkspace = join(tmpdir(), `piece-installer-test-${randomUUID()}`)
    await mkdir(testWorkspace, { recursive: true })
    vi.clearAllMocks()
    mockGet.mockResolvedValue({ data: new ArrayBuffer(8) })
    mockGetPieceBundleUrl.mockResolvedValue(null)
    mockBunInstall.mockResolvedValue({ output: '' })
})

afterEach(async () => {
    const { rm } = await import('node:fs/promises')
    await rm(testWorkspace, { recursive: true, force: true })
})

describe('pieceInstaller (registry pieces)', () => {
    it('downloads the tarball from npm then bun-installs it when no signed url', async () => {
        const piece = makePiece('@activepieces/piece-a')
        const installer = pieceInstaller(fakeLog, fakeApiClient, testWorkspace, fakeGetSettings)

        await installer.install({ pieces: [piece], includeFilters: true })

        expect(mockGet.mock.calls[0]?.[0]).toBe('https://registry.npmjs.org/@activepieces/piece-a/-/piece-a-1.0.0.tgz')
        expect(await pathExists(join(pieceDirPath(piece), 'package.tgz'))).toBe(true)
        expect(mockBunInstall).toHaveBeenCalledOnce()
        expect(await pathExists(readyFilePath(piece))).toBe(true)
    })

    it('downloads the tarball from the signed url the API returns', async () => {
        const piece = makePiece('@activepieces/piece-b')
        mockGetPieceBundleUrl.mockResolvedValueOnce('https://s3.example.com/pieces/@activepieces-piece-b-1.0.0.tgz?sig=abc')
        const installer = pieceInstaller(fakeLog, fakeApiClient, testWorkspace, fakeGetSettings)

        await installer.install({ pieces: [piece], includeFilters: true })

        expect(mockGet.mock.calls[0]?.[0]).toBe('https://s3.example.com/pieces/@activepieces-piece-b-1.0.0.tgz?sig=abc')
        expect(mockBunInstall).toHaveBeenCalledOnce()
        expect(await pathExists(readyFilePath(piece))).toBe(true)
    })

    it('falls back to npm when the signed url download fails', async () => {
        const piece = makePiece('@activepieces/piece-c')
        mockGetPieceBundleUrl.mockResolvedValueOnce('https://s3.example.com/pieces/@activepieces-piece-c-1.0.0.tgz?sig=abc')
        mockGet
            .mockReset()
            .mockRejectedValueOnce(new Error('403 expired'))
            .mockResolvedValueOnce({ data: new ArrayBuffer(8) })
        const installer = pieceInstaller(fakeLog, fakeApiClient, testWorkspace, fakeGetSettings)

        await installer.install({ pieces: [piece], includeFilters: true })

        expect(mockGet).toHaveBeenCalledTimes(2)
        expect(mockGet.mock.calls[1]?.[0]).toBe('https://registry.npmjs.org/@activepieces/piece-c/-/piece-c-1.0.0.tgz')
        expect(await pathExists(readyFilePath(piece))).toBe(true)
    })

    it('rolls back and throws when bun install fails for a single piece', async () => {
        const piece = makePiece('@activepieces/piece-d')
        mockBunInstall.mockReset().mockRejectedValue(new Error('bun resolve error'))
        const installer = pieceInstaller(fakeLog, fakeApiClient, testWorkspace, fakeGetSettings)

        await expect(installer.install({ pieces: [piece], includeFilters: true })).rejects.toThrow('bun resolve error')
        expect(await pathExists(pieceDirPath(piece))).toBe(false)
    })

    it('skips pieces that are already installed (node_modules present)', async () => {
        const piece = makePiece('@activepieces/piece-cached')
        const pieceDir = pieceDirPath(piece)
        await mkdir(join(pieceDir, 'node_modules'), { recursive: true })
        await writeFile(join(pieceDir, 'ready'), 'true')

        const installer = pieceInstaller(fakeLog, fakeApiClient, testWorkspace, fakeGetSettings)
        await installer.install({ pieces: [piece], includeFilters: true })

        expect(mockGet).not.toHaveBeenCalled()
        expect(mockBunInstall).not.toHaveBeenCalled()
    })
})
