import { access, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PackageType, PieceType } from '@activepieces/shared'
import type { OfficialPiecePackage } from '@activepieces/shared'
import type { Logger } from 'pino'

// Module-level variable updated per test so the vi.mock factory can reference it
let testWorkspace = ''

const mockInstall = vi.fn()

vi.mock('../src/lib/cache/code/bun-runner', () => ({
    bunRunner: () => ({
        install: mockInstall,
    }),
}))

vi.mock('../src/lib/config/worker-settings', () => ({
    workerSettings: {
        getSettings: () => ({
            EXECUTION_MODE: 'UNSANDBOXED',
            DEV_PIECES: [],
        }),
    },
}))

vi.mock('../src/lib/cache/cache-paths', () => ({
    getGlobalCacheCommonPath: () => testWorkspace,
    getGlobalCachePathLatestVersion: () => testWorkspace,
}))

// Import after mocks are registered
const { pieceInstaller } = await import('../src/lib/cache/pieces/piece-installer')

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
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn().mockReturnThis(),
} as unknown as Logger

// REGISTRY pieces don't call apiClient.getPieceArchive so an empty object suffices
const fakeApiClient = {} as never

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
        const installer = pieceInstaller(fakeLog, fakeApiClient)

        mockInstall.mockResolvedValueOnce({ output: '' })

        await installer.install({ pieces: [piece1, piece2], includeFilters: true })

        expect(mockInstall).toHaveBeenCalledOnce()
        expect(await pathExists(readyFilePath(piece1))).toBe(true)
        expect(await pathExists(readyFilePath(piece2))).toBe(true)
    })

    it('batch fails with good and bad piece — good piece marked ready, bad piece rolled back', async () => {
        const good = makePiece('@activepieces/piece-good')
        const bad = makePiece('@activepieces/piece-bad')
        const installer = pieceInstaller(fakeLog, fakeApiClient)

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
        const installer = pieceInstaller(fakeLog, fakeApiClient)

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
        const installer = pieceInstaller(fakeLog, fakeApiClient)

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

        const installer = pieceInstaller(fakeLog, fakeApiClient)
        await installer.install({ pieces: [piece], includeFilters: true })

        expect(mockInstall).not.toHaveBeenCalled()
    })

    it('individual fallback always passes --filter path regardless of includeFilters', async () => {
        const piece1 = makePiece('@activepieces/piece-filter-a')
        const piece2 = makePiece('@activepieces/piece-filter-b')
        const installer = pieceInstaller(fakeLog, fakeApiClient)

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
