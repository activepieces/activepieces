import { randomUUID } from 'node:crypto'
import { access, cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PackageType, PieceType } from '@activepieces/shared'
import type { OfficialPiecePackage } from '@activepieces/shared'
import type { ApLogger } from '@activepieces/server-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { spawnWithKill } from '../../../src/lib/utils/exec'

let testWorkspace = ''

vi.mock('../../../src/lib/cache/cache-paths', () => ({
    cacheUtils: () => ({
        getGlobalCacheCommonPath: () => testWorkspace,
        getGlobalCachePathLatestVersion: () => testWorkspace,
    }),
}))

const { pieceInstaller } = await import('../../../src/lib/cache/pieces/piece-installer')

const PIECE_VERSION = '1.0.0'

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

const bundleSource = { publicApiUrl: 'http://localhost:3000/api/', engineToken: 'test-token' }

function makePiece(pieceName: string): OfficialPiecePackage {
    return {
        packageType: PackageType.REGISTRY,
        pieceType: PieceType.OFFICIAL,
        pieceName,
        pieceVersion: PIECE_VERSION,
    }
}

function piecePath(pieceName: string): string {
    return join(testWorkspace, 'pieces', `${pieceName}-${PIECE_VERSION}`)
}

function installedPackageDir(pieceName: string): string {
    return join(piecePath(pieceName), 'node_modules', pieceName)
}

async function pathExists(target: string): Promise<boolean> {
    return access(target).then(() => true, () => false)
}

async function packBundle(pieceName: string, exportName: string): Promise<void> {
    const sourceDir = join(testWorkspace, 'fixture-src', exportName)
    await mkdir(join(sourceDir, 'src'), { recursive: true })
    await writeFile(join(sourceDir, 'package.json'), JSON.stringify({
        name: pieceName,
        version: PIECE_VERSION,
        main: 'src/index.js',
    }), 'utf8')
    await writeFile(join(sourceDir, 'src', 'index.js'), `module.exports = { ${exportName}: { name: '${pieceName}' } }\n`, 'utf8')

    const packDir = join(testWorkspace, 'fixture-pack', exportName)
    await mkdir(packDir, { recursive: true })
    await spawnWithKill({
        cmd: 'bun',
        args: ['pm', 'pack', '--destination', packDir],
        options: { cwd: sourceDir },
        printOutput: false,
        timeoutMs: 60_000,
    })

    const packed = (await readdir(packDir)).find(entry => entry.endsWith('.tgz'))
    expect(packed).toBeDefined()
    await mkdir(piecePath(pieceName), { recursive: true })
    await cp(join(packDir, packed as string), join(piecePath(pieceName), 'bundle.tgz'))
}

async function installPieces(pieceNames: string[]): Promise<void> {
    await pieceInstaller(fakeLog, testWorkspace, fakeGetSettings).install({
        pieces: pieceNames.map(makePiece),
        includeFilters: true,
        ...bundleSource,
    })
}

async function pinLockToLegacyConfigVersion(): Promise<void> {
    const lockPath = join(testWorkspace, 'bun.lock')
    const lock = await readFile(lockPath, 'utf8')
    expect(lock).toContain('"configVersion"')
    await writeFile(lockPath, lock.replace(/"configVersion": *\d+/, '"configVersion": 0'), 'utf8')
}

beforeEach(async () => {
    testWorkspace = join(tmpdir(), `piece-installer-layout-${randomUUID()}`)
    await mkdir(testWorkspace, { recursive: true })
})

afterEach(async () => {
    await rm(testWorkspace, { recursive: true, force: true })
})

describe('pieceInstaller layout', () => {
    it('installs a piece where the engine resolver looks for it', async () => {
        const pieceName = '@apfixture/piece-solo'
        await packBundle(pieceName, 'pieceSolo')

        await installPieces([pieceName])

        const packageDir = installedPackageDir(pieceName)
        expect(await pathExists(packageDir)).toBe(true)

        const manifest = JSON.parse(await readFile(join(packageDir, 'package.json'), 'utf8'))
        const entry = join(packageDir, manifest.main)
        expect(await pathExists(entry)).toBe(true)
        expect(createRequire(import.meta.url)(entry)).toHaveProperty('pieceSolo')
        expect(await pathExists(join(piecePath(pieceName), 'ready'))).toBe(true)
    }, 120_000)

    it('reinstalls a piece whose nested node_modules went missing, so a broken workspace heals', async () => {
        const pieceName = '@apfixture/piece-heal'
        await packBundle(pieceName, 'pieceHeal')

        await installPieces([pieceName])
        expect(await pathExists(installedPackageDir(pieceName))).toBe(true)

        await rm(join(piecePath(pieceName), 'node_modules'), { recursive: true, force: true })
        expect(await pathExists(join(piecePath(pieceName), 'ready'))).toBe(true)

        await installPieces([pieceName])

        expect(await pathExists(installedPackageDir(pieceName))).toBe(true)
        expect(await pathExists(join(piecePath(pieceName), 'ready'))).toBe(true)
    }, 120_000)

    it('installs a new piece into a workspace whose lockfile pins the legacy layout', async () => {
        const first = '@apfixture/piece-first'
        const second = '@apfixture/piece-second'

        await packBundle(first, 'pieceFirst')
        await installPieces([first])
        expect(await pathExists(installedPackageDir(first))).toBe(true)

        await pinLockToLegacyConfigVersion()

        await packBundle(second, 'pieceSecond')
        await installPieces([second])

        expect(await pathExists(installedPackageDir(second))).toBe(true)
        expect(await pathExists(installedPackageDir(first))).toBe(true)
    }, 120_000)
})
