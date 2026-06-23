import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PackageType, PieceType } from '@activepieces/shared'
import type { OfficialPiecePackage, PrivatePiecePackage } from '@activepieces/shared'
import type { ApLogger } from '@activepieces/server-utils'

// Module-level variable updated per test so the vi.mock factory can reference it
let testWorkspace = ''

const mockInstall = vi.fn()

vi.mock('../../../src/lib/cache/code/bun-runner', () => ({
    bunRunner: () => ({
        install: mockInstall,
    }),
}))

vi.mock('../../../src/lib/cache/cache-paths', () => ({
    cacheUtils: () => ({
        getGlobalCacheCommonPath: () => testWorkspace,
        getGlobalCachePathLatestVersion: () => testWorkspace,
    }),
}))

// Import after mocks are registered
const { pieceInstaller, isValidPackageName } = await import('../../../src/lib/cache/pieces/piece-installer')

function makePiece(name: string, version = '1.0.0'): OfficialPiecePackage {
    return {
        packageType: PackageType.REGISTRY,
        pieceType: PieceType.OFFICIAL,
        pieceName: name,
        pieceVersion: version,
    }
}

function makeArchivePiece(name: string, version = '1.0.0'): PrivatePiecePackage {
    return {
        packageType: PackageType.ARCHIVE,
        pieceType: PieceType.CUSTOM,
        pieceName: name,
        pieceVersion: version,
        archiveId: randomUUID(),
        platformId: 'platform-1',
    }
}

function pieceDirPath(piece: OfficialPiecePackage | PrivatePiecePackage): string {
    return join(testWorkspace, 'pieces', `${piece.pieceName}-${piece.pieceVersion}`)
}

function readyFilePath(piece: OfficialPiecePackage | PrivatePiecePackage): string {
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

// REGISTRY pieces don't call apiClient.getPieceArchive so an empty object suffices
const fakeApiClient = {} as never

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
})

afterEach(async () => {
    const { rm } = await import('node:fs/promises')
    await rm(testWorkspace, { recursive: true, force: true })
})

describe('pieceInstaller', () => {
    it('batch install succeeds — all pieces marked ready', async () => {
        const piece1 = makePiece('@activepieces/piece-a')
        const piece2 = makePiece('@activepieces/piece-b')
        const installer = pieceInstaller(fakeLog, fakeApiClient, testWorkspace, fakeGetSettings)

        mockInstall.mockResolvedValueOnce({ output: '' })

        await installer.install({ pieces: [piece1, piece2], includeFilters: true })

        expect(mockInstall).toHaveBeenCalledOnce()
        expect(await pathExists(readyFilePath(piece1))).toBe(true)
        expect(await pathExists(readyFilePath(piece2))).toBe(true)
    })

    it('batch fails with good and bad piece — good piece marked ready, bad piece rolled back', async () => {
        const good = makePiece('@activepieces/piece-good')
        const bad = makePiece('@activepieces/piece-bad')
        const installer = pieceInstaller(fakeLog, fakeApiClient, testWorkspace, fakeGetSettings)

        mockInstall
            .mockRejectedValueOnce(new Error('workspace:* resolve error'))  // batch attempt
            .mockResolvedValueOnce({ output: '' })                           // good individual
            .mockRejectedValueOnce(new Error('workspace:* resolve error'))  // bad individual

        const error = await installer.install({ pieces: [good, bad], includeFilters: false }).catch(e => e as Error)

        expect(error).toBeInstanceOf(Error)
        expect(error.message).toContain('@activepieces/piece-bad@1.0.0')
        expect(error.message).not.toContain('@activepieces/piece-good@1.0.0')
        expect(mockInstall).toHaveBeenCalledTimes(3)

        expect(await pathExists(readyFilePath(good))).toBe(true)
        expect(await pathExists(pieceDirPath(bad))).toBe(false)
    })

    it('batch fails with both pieces bad — both rolled back, error names both', async () => {
        const piece1 = makePiece('@activepieces/piece-x')
        const piece2 = makePiece('@activepieces/piece-y')
        const installer = pieceInstaller(fakeLog, fakeApiClient, testWorkspace, fakeGetSettings)

        mockInstall
            .mockRejectedValueOnce(new Error('workspace:* resolve error'))  // batch
            .mockRejectedValueOnce(new Error('workspace:* resolve error'))  // piece-x individual
            .mockRejectedValueOnce(new Error('workspace:* resolve error'))  // piece-y individual

        const error = await installer.install({ pieces: [piece1, piece2], includeFilters: false }).catch(e => e as Error)

        expect(error).toBeInstanceOf(Error)
        expect(error.message).toContain('@activepieces/piece-x@1.0.0')
        expect(error.message).toContain('@activepieces/piece-y@1.0.0')
        expect(mockInstall).toHaveBeenCalledTimes(3)

        expect(await pathExists(pieceDirPath(piece1))).toBe(false)
        expect(await pathExists(pieceDirPath(piece2))).toBe(false)
    })

    it('single piece fails — rolled back immediately, no individual retry', async () => {
        const piece = makePiece('@activepieces/piece-solo')
        const installer = pieceInstaller(fakeLog, fakeApiClient, testWorkspace, fakeGetSettings)

        mockInstall.mockRejectedValueOnce(new Error('install failure'))

        await expect(installer.install({ pieces: [piece], includeFilters: true })).rejects.toThrow('install failure')

        expect(mockInstall).toHaveBeenCalledOnce()
        expect(await pathExists(pieceDirPath(piece))).toBe(false)
    })

    it('piece already installed — bun install never called', async () => {
        const piece = makePiece('@activepieces/piece-cached')
        const pieceDir = pieceDirPath(piece)

        await mkdir(join(pieceDir, 'node_modules'), { recursive: true })
        await writeFile(join(pieceDir, 'ready'), 'true')

        const installer = pieceInstaller(fakeLog, fakeApiClient, testWorkspace, fakeGetSettings)
        await installer.install({ pieces: [piece], includeFilters: true })

        expect(mockInstall).not.toHaveBeenCalled()
    })

    it('archive piece installs through bun with a unique suffixed workspace name pointing at its tgz', async () => {
        const piece = makeArchivePiece('@acme/piece-sample', '0.3.3')
        const getPieceArchive = vi.fn().mockResolvedValue(Buffer.from('tgz'))
        const installer = pieceInstaller(fakeLog, { getPieceArchive } as never, testWorkspace, fakeGetSettings)

        mockInstall.mockResolvedValueOnce({ output: '' })

        await installer.install({ pieces: [piece], includeFilters: true })

        // The archive is downloaded once and installed through the shared bun workspace.
        expect(getPieceArchive).toHaveBeenCalledOnce()
        expect(mockInstall).toHaveBeenCalledOnce()
        expect(await pathExists(readyFilePath(piece))).toBe(true)

        // The folder's package.json carries the unique `<pieceName>-<pieceVersion>` workspace name
        // (never the raw piece name) and depends on the saved .tgz — so multiple cached versions of
        // the same piece can never collide on a bun workspace name.
        const manifest = JSON.parse(await readFile(join(pieceDirPath(piece), 'package.json'), 'utf8'))
        expect(manifest.name).toBe('@acme/piece-sample-0.3.3')
        expect(manifest.dependencies['@acme/piece-sample']).toContain('.tgz')
    })

    it('skips pieces whose name is a relative path — they never reach the shared bun workspace', async () => {
        const good = makePiece('@activepieces/piece-good')
        // Stale `usedPieces` data from a since-reverted build can carry a relative path as the
        // pieceName. Writing it as a workspace member corrupts the shared bun.lock and breaks every
        // other piece (and cache pre-warm / deploy), so it must be dropped before any member is built.
        const poison = makePiece('../../../common/pieces/@activepieces/piece-algolia', '0.0.3')
        const installer = pieceInstaller(fakeLog, fakeApiClient, testWorkspace, fakeGetSettings)

        mockInstall.mockResolvedValueOnce({ output: '' })

        await installer.install({ pieces: [good, poison], includeFilters: true })

        expect(mockInstall).toHaveBeenCalledOnce()
        expect(mockInstall.mock.calls[0]?.[0].filtersPath).toEqual([
            expect.stringContaining('@activepieces/piece-good-1.0.0'),
        ])
        expect(await pathExists(readyFilePath(good))).toBe(true)
    })

    it('install made up only of invalid-named pieces is a no-op — bun never runs', async () => {
        const poison = makePiece('../../../common/pieces/@activepieces/piece-algolia', '0.0.3')
        const installer = pieceInstaller(fakeLog, fakeApiClient, testWorkspace, fakeGetSettings)

        await installer.install({ pieces: [poison], includeFilters: true })

        expect(mockInstall).not.toHaveBeenCalled()
    })

    it('mixes valid and invalid pieces — only valid ones reach bun, both filters present for valid', async () => {
        const goodA = makePiece('@activepieces/piece-a')
        const goodB = makePiece('piece-b-unscoped')
        const poison1 = makePiece('../../../common/pieces/@activepieces/piece-x', '0.0.3')
        const poison2 = makePiece('@activepieces/piece-y/extra', '1.2.3')
        const installer = pieceInstaller(fakeLog, fakeApiClient, testWorkspace, fakeGetSettings)

        mockInstall.mockResolvedValueOnce({ output: '' })

        await installer.install({ pieces: [goodA, poison1, goodB, poison2], includeFilters: true })

        expect(mockInstall).toHaveBeenCalledOnce()
        const filtersPath = mockInstall.mock.calls[0]?.[0].filtersPath as string[]
        expect(filtersPath).toHaveLength(2)
        expect(filtersPath.some(f => f.includes('@activepieces/piece-a-1.0.0'))).toBe(true)
        expect(filtersPath.some(f => f.includes('piece-b-unscoped-1.0.0'))).toBe(true)
        expect(filtersPath.some(f => f.includes('piece-x'))).toBe(false)
        expect(filtersPath.some(f => f.includes('piece-y'))).toBe(false)
    })

    it('individual fallback always passes --filter path regardless of includeFilters', async () => {
        const piece1 = makePiece('@activepieces/piece-filter-a')
        const piece2 = makePiece('@activepieces/piece-filter-b')
        const installer = pieceInstaller(fakeLog, fakeApiClient, testWorkspace, fakeGetSettings)

        mockInstall
            .mockRejectedValueOnce(new Error('batch error'))
            .mockResolvedValueOnce({ output: '' })
            .mockResolvedValueOnce({ output: '' })

        // Use includeFilters: false so the batch call has no filters
        await installer.install({ pieces: [piece1, piece2], includeFilters: false })

        expect(mockInstall).toHaveBeenCalledTimes(3)

        // Batch call uses empty filtersPath because includeFilters is false
        expect(mockInstall.mock.calls[0]?.[0]).toMatchObject({ filtersPath: [] })

        // Individual calls must always include the --filter path (sequential order)
        expect(mockInstall.mock.calls[1]?.[0]).toMatchObject({
            filtersPath: [expect.stringContaining(`${piece1.pieceName}-${piece1.pieceVersion}`)],
        })
        expect(mockInstall.mock.calls[2]?.[0]).toMatchObject({
            filtersPath: [expect.stringContaining(`${piece2.pieceName}-${piece2.pieceVersion}`)],
        })
    })
})

describe('isValidPackageName', () => {
    it.each([
        '@activepieces/piece-algolia',
        '@activepieces/piece-add-event',
        '@acme/piece-sample',
        // the `<name>-<version>` workspace-member form is itself a single-slash scoped name
        '@activepieces/piece-algolia-0.0.3',
        'tslib',
        'piece-b-unscoped',
        'lodash.merge',
        '@a/b',
        'a',
    ])('accepts valid package name %j', (name) => {
        expect(isValidPackageName(name)).toBe(true)
    })

    it.each([
        // the production poison: a relative path masquerading as a piece name
        '../../../common/pieces/@activepieces/piece-algolia',
        '../../../common/pieces/@activepieces/piece-algolia-0.0.3',
        '..',
        '../foo',
        './foo',
        'foo/..',
        '@activepieces/..',
        // more than one path segment (scoped names allow exactly one slash)
        '@activepieces/piece-y/extra',
        'a/b/c',
        'foo/bar',
        // malformed scopes
        '@/name',
        '@scope/',
        // empty
        '',
    ])('rejects invalid package name %j', (name) => {
        expect(isValidPackageName(name)).toBe(false)
    })
})
