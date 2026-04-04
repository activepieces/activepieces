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

vi.mock('../src/lib/cache/code/package-runner', () => ({
    packageRunner: () => ({
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
    it('two pieces succeed — both marked ready, install called per piece', async () => {
        const piece1 = makePiece('@activepieces/piece-a')
        const piece2 = makePiece('@activepieces/piece-b')
        const installer = pieceInstaller(fakeLog, fakeApiClient)

        mockInstall.mockResolvedValue({ output: '' })

        await installer.install({ pieces: [piece1, piece2] })

        expect(mockInstall).toHaveBeenCalledTimes(2)
        expect(mockInstall).toHaveBeenCalledWith({ path: pieceDirPath(piece1) })
        expect(mockInstall).toHaveBeenCalledWith({ path: pieceDirPath(piece2) })
        expect(await pathExists(readyFilePath(piece1))).toBe(true)
        expect(await pathExists(readyFilePath(piece2))).toBe(true)
    })

    it('good piece succeeds, bad piece fails — good marked ready, bad rolled back, error names bad', async () => {
        const good = makePiece('@activepieces/piece-good')
        const bad = makePiece('@activepieces/piece-bad')
        const installer = pieceInstaller(fakeLog, fakeApiClient)

        mockInstall.mockImplementation(({ path }: { path: string }) => {
            if (path.includes('piece-bad')) {
                return Promise.reject(new Error('install failure'))
            }
            return Promise.resolve({ output: '' })
        })

        const error = await installer.install({ pieces: [good, bad] }).catch(e => e as Error)

        expect(error).toBeInstanceOf(Error)
        expect(error.message).toContain('@activepieces/piece-bad@1.0.0')
        expect(error.message).not.toContain('@activepieces/piece-good@1.0.0')

        expect(await pathExists(readyFilePath(good))).toBe(true)
        expect(await pathExists(pieceDirPath(bad))).toBe(false)
    })

    it('both pieces fail — both rolled back, error names both', async () => {
        const piece1 = makePiece('@activepieces/piece-x')
        const piece2 = makePiece('@activepieces/piece-y')
        const installer = pieceInstaller(fakeLog, fakeApiClient)

        mockInstall.mockRejectedValue(new Error('install failure'))

        const error = await installer.install({ pieces: [piece1, piece2] }).catch(e => e as Error)

        expect(error).toBeInstanceOf(Error)
        expect(error.message).toContain('@activepieces/piece-x@1.0.0')
        expect(error.message).toContain('@activepieces/piece-y@1.0.0')

        expect(await pathExists(pieceDirPath(piece1))).toBe(false)
        expect(await pathExists(pieceDirPath(piece2))).toBe(false)
    })

    it('single piece fails — rolled back, error thrown', async () => {
        const piece = makePiece('@activepieces/piece-solo')
        const installer = pieceInstaller(fakeLog, fakeApiClient)

        mockInstall.mockRejectedValue(new Error('install failure'))

        await expect(installer.install({ pieces: [piece] })).rejects.toThrow('@activepieces/piece-solo@1.0.0')

        expect(mockInstall).toHaveBeenCalledTimes(1)
        expect(mockInstall).toHaveBeenCalledWith({ path: pieceDirPath(piece) })
        expect(await pathExists(pieceDirPath(piece))).toBe(false)
    })

    it('piece already installed — pnpm install never called', async () => {
        const piece = makePiece('@activepieces/piece-cached')
        const pieceDir = pieceDirPath(piece)

        await mkdir(pieceDir, { recursive: true })
        await writeFile(join(pieceDir, 'ready'), 'true')

        const installer = pieceInstaller(fakeLog, fakeApiClient)
        await installer.install({ pieces: [piece] })

        expect(mockInstall).not.toHaveBeenCalled()
    })
})
