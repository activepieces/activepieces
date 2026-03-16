import { mkdir, rm, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { PackageType, PieceType } from '@activepieces/shared'
import type { PiecePackage, WorkerToApiContract } from '@activepieces/shared'

vi.mock('../../src/lib/config/logger', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
        child: vi.fn().mockReturnValue({
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
        }),
    },
}))

vi.mock('../../src/lib/config/worker-settings', () => ({
    workerSettings: {
        getSettings: vi.fn().mockReturnValue({
            EXECUTION_MODE: 'UNSANDBOXED',
        }),
    },
}))

let bunInstallCallCount = 0
let bunInstallConcurrent = 0
let bunInstallMaxConcurrent = 0

vi.mock('../../src/lib/cache/code/bun-runner', () => ({
    bunRunner: () => ({
        install: vi.fn(async () => {
            bunInstallConcurrent++
            bunInstallMaxConcurrent = Math.max(bunInstallMaxConcurrent, bunInstallConcurrent)
            bunInstallCallCount++
            // Simulate bun install taking some time
            await new Promise((r) => setTimeout(r, 50))
            bunInstallConcurrent--
            return { stdout: '', stderr: '' }
        }),
        build: vi.fn(),
    }),
}))

// Must mock cache-paths to use temp dirs
let mockCommonPath = ''
let mockLatestVersionPath = ''

vi.mock('../../src/lib/cache/cache-paths', () => ({
    getGlobalCacheCommonPath: () => mockCommonPath,
    getGlobalCachePathLatestVersion: () => mockLatestVersionPath,
}))

import { pieceInstaller } from '../../src/lib/cache/pieces/piece-installer'

function createMockPiece(name: string, version: string): PiecePackage {
    return {
        pieceName: name,
        pieceVersion: version,
        packageType: PackageType.REGISTRY,
        pieceType: PieceType.OFFICIAL,
    } as PiecePackage
}

function createMockApiClient(): WorkerToApiContract {
    return {
        getPieceArchive: vi.fn(),
        getUsedPieces: vi.fn(),
        markPieceAsUsed: vi.fn(),
    } as unknown as WorkerToApiContract
}

function createMockLog() {
    return {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
        child: vi.fn().mockReturnThis(),
    } as any
}

describe('pieceInstaller — stress tests with shared cache', () => {
    let testDir: string

    beforeEach(async () => {
        testDir = join(tmpdir(), `piece-stress-${Date.now()}-${Math.random().toString(36).slice(2)}`)
        await mkdir(testDir, { recursive: true })
        mockCommonPath = join(testDir, 'common')
        mockLatestVersionPath = testDir
        await mkdir(mockCommonPath, { recursive: true })

        bunInstallCallCount = 0
        bunInstallConcurrent = 0
        bunInstallMaxConcurrent = 0
    })

    afterEach(async () => {
        await rm(testDir, { recursive: true, force: true })
    })

    it('5 concurrent install calls for the same piece: bun install called only once', async () => {
        const piece = createMockPiece('@activepieces/piece-gmail', '1.0.0')
        const log = createMockLog()
        const api = createMockApiClient()

        const tasks = Array.from({ length: 5 }, () =>
            pieceInstaller(log, api).install({
                pieces: [piece],
                includeFilters: false,
            }),
        )

        await Promise.all(tasks)

        // Due to the ready marker check + double-check inside lock,
        // bun install should only run once
        expect(bunInstallCallCount).toBe(1)
    }, 30_000)

    it('5 concurrent install calls for different pieces: all install eventually', async () => {
        const pieces = Array.from({ length: 5 }, (_, i) =>
            createMockPiece(`@activepieces/piece-${i}`, '1.0.0'),
        )
        const log = createMockLog()
        const api = createMockApiClient()

        // Each "worker" installs all 5 pieces at once
        const tasks = Array.from({ length: 3 }, () =>
            pieceInstaller(log, api).install({
                pieces,
                includeFilters: false,
            }),
        )

        await Promise.all(tasks)

        // The first caller installs all 5, subsequent callers should skip
        // bun install is called once per install batch (not per piece)
        expect(bunInstallCallCount).toBeGreaterThanOrEqual(1)
        // Max concurrent should be 1 per lock path
        expect(bunInstallMaxConcurrent).toBe(1)
    }, 30_000)

    it('installing same piece twice is idempotent', async () => {
        const piece = createMockPiece('@activepieces/piece-slack', '2.0.0')
        const log = createMockLog()
        const api = createMockApiClient()

        await pieceInstaller(log, api).install({
            pieces: [piece],
            includeFilters: false,
        })

        const countAfterFirst = bunInstallCallCount

        await pieceInstaller(log, api).install({
            pieces: [piece],
            includeFilters: false,
        })

        // Second install should not call bun install again (piece is marked ready)
        expect(bunInstallCallCount).toBe(countAfterFirst)
    }, 15_000)
})
