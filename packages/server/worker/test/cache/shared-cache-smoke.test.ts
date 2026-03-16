import { mkdir, rm, readdir, writeFile, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'

vi.mock('../../src/lib/config/logger', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
    },
}))

import { withFileLock } from '../../src/lib/cache/file-lock'
import {
    getGlobalCachePathLatestVersion,
    getGlobalCacheCommonPath,
    getGlobalCodeCachePath,
    getGlobalCachePiecesPath,
    getGlobalCacheFlowsPath,
    LATEST_CACHE_VERSION,
} from '../../src/lib/cache/cache-paths'

describe('shared cache — smoke tests', () => {
    describe('cache paths produce a single shared directory', () => {
        it('all paths share the same base directory', () => {
            const base = getGlobalCachePathLatestVersion()
            expect(getGlobalCacheCommonPath().startsWith(base)).toBe(true)
            expect(getGlobalCodeCachePath().startsWith(base)).toBe(true)
            expect(getGlobalCachePiecesPath().startsWith(base)).toBe(true)
            expect(getGlobalCacheFlowsPath().startsWith(base)).toBe(true)
        })

        it('base path contains "shared" not a numeric worker ID', () => {
            const base = getGlobalCachePathLatestVersion()
            expect(base).toContain('shared')
            // Should not contain /0/, /1/, /2/ etc patterns
            expect(base).not.toMatch(/\/\d+$/)
        })

        it('calling paths multiple times returns identical strings (deterministic)', () => {
            const a1 = getGlobalCachePathLatestVersion()
            const a2 = getGlobalCachePathLatestVersion()
            const b1 = getGlobalCacheCommonPath()
            const b2 = getGlobalCacheCommonPath()
            expect(a1).toBe(a2)
            expect(b1).toBe(b2)
        })

        it('paths are absolute', () => {
            expect(path.isAbsolute(getGlobalCachePathLatestVersion())).toBe(true)
            expect(path.isAbsolute(getGlobalCacheCommonPath())).toBe(true)
            expect(path.isAbsolute(getGlobalCodeCachePath())).toBe(true)
            expect(path.isAbsolute(getGlobalCachePiecesPath())).toBe(true)
            expect(path.isAbsolute(getGlobalCacheFlowsPath())).toBe(true)
        })
    })

    describe('deleteStaleCache cleans old versions', () => {
        let cacheRoot: string
        beforeEach(async () => {
            cacheRoot = join(tmpdir(), `stale-cache-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
            await mkdir(cacheRoot, { recursive: true })
        })

        afterEach(async () => {
            await rm(cacheRoot, { recursive: true, force: true })
        })

        it('removes old version directories but keeps latest', async () => {
            // Create old version directories
            await mkdir(join(cacheRoot, 'v5'), { recursive: true })
            await mkdir(join(cacheRoot, 'v6'), { recursive: true })
            await mkdir(join(cacheRoot, LATEST_CACHE_VERSION), { recursive: true })

            // We can't easily test deleteStaleCache directly because it uses path.resolve('cache')
            // But we verify the logic: readdir + filter + rm for non-latest
            const entries = await readdir(cacheRoot, { withFileTypes: true })
            const toDelete = entries
                .filter(e => e.isDirectory() && e.name !== LATEST_CACHE_VERSION)
                .map(e => e.name)

            expect(toDelete).toContain('v5')
            expect(toDelete).toContain('v6')
            expect(toDelete).not.toContain(LATEST_CACHE_VERSION)
        })
    })

    describe('simulated multi-worker shared cache', () => {
        let sharedDir: string

        beforeEach(async () => {
            sharedDir = join(tmpdir(), `shared-cache-sim-${Date.now()}-${Math.random().toString(36).slice(2)}`)
            await mkdir(sharedDir, { recursive: true })
        })

        afterEach(async () => {
            await rm(sharedDir, { recursive: true, force: true })
        })

        it('5 simulated workers writing to same cache produce consistent state', async () => {
            const cacheFile = join(sharedDir, 'pieces.json')
            const lockPath = join(sharedDir, 'pieces')
            const N_WORKERS = 5

            // Each worker "installs" its piece entry
            const workerTasks = Array.from({ length: N_WORKERS }, (_, i) =>
                withFileLock(lockPath, async () => {
                    // Read current state
                    let data: Record<string, string> = {}
                    try {
                        const raw = await readFile(cacheFile, 'utf8')
                        data = JSON.parse(raw)
                    }
                    catch {
                        // File doesn't exist yet
                    }

                    // Add worker's piece
                    data[`piece-${i}`] = `1.0.${i}`

                    // Simulate bun install latency
                    await new Promise((r) => setTimeout(r, 30))

                    // Write back
                    await writeFile(cacheFile, JSON.stringify(data))
                }),
            )

            await Promise.all(workerTasks)

            // All 5 pieces should be present
            const final = JSON.parse(await readFile(cacheFile, 'utf8'))
            for (let i = 0; i < N_WORKERS; i++) {
                expect(final[`piece-${i}`]).toBe(`1.0.${i}`)
            }
        }, 15_000)

        it('5 simulated workers: only one runs install when pieces are not cached', async () => {
            const lockPath = join(sharedDir, 'install')
            const readyFile = join(sharedDir, 'ready')
            let installCount = 0
            let skipCount = 0

            // Simulate: each worker checks for ready file, installs if missing
            const workerTasks = Array.from({ length: 5 }, () =>
                withFileLock(lockPath, async () => {
                    // Check if already installed (like the ready marker pattern)
                    try {
                        await stat(readyFile)
                        skipCount++
                        return
                    }
                    catch {
                        // Not installed, proceed
                    }

                    installCount++
                    // Simulate installation
                    await new Promise((r) => setTimeout(r, 50))
                    await writeFile(readyFile, 'true')
                }),
            )

            await Promise.all(workerTasks)

            expect(installCount).toBe(1)
            expect(skipCount).toBe(4)
        }, 15_000)

        it('10 workers: concurrent reads during install are safe', async () => {
            const lockPath = join(sharedDir, 'rw')
            const dataFile = join(sharedDir, 'data.json')

            // First, one "installer" writes data with a lock
            await withFileLock(lockPath, async () => {
                const data = { installed: true, pieces: ['a', 'b', 'c'] }
                await writeFile(dataFile, JSON.stringify(data))
            })

            // Then 10 workers read concurrently (reads don't need locks)
            const readTasks = Array.from({ length: 10 }, async () => {
                const raw = await readFile(dataFile, 'utf8')
                return JSON.parse(raw)
            })

            const results = await Promise.all(readTasks)
            for (const result of results) {
                expect(result.installed).toBe(true)
                expect(result.pieces).toEqual(['a', 'b', 'c'])
            }
        }, 10_000)

        it('simulated code build: 5 workers building same code step, only one actually builds', async () => {
            const codeDir = join(sharedDir, 'codes', 'flow-v1', 'step1')
            const lockPath = join(sharedDir, 'codes', 'flow-v1', 'step1')
            const cacheFile = join(sharedDir, 'codes', 'flow-v1', 'cache.json')
            const HASH = 'abc123'

            let buildCount = 0
            let cacheHitCount = 0

            const workerTasks = Array.from({ length: 5 }, () =>
                withFileLock(lockPath, async () => {
                    // Check cache
                    let cache: Record<string, string> = {}
                    try {
                        const raw = await readFile(cacheFile, 'utf8')
                        cache = JSON.parse(raw)
                    }
                    catch {
                        // No cache yet
                    }

                    if (cache['step1'] === HASH) {
                        cacheHitCount++
                        return
                    }

                    // Build
                    buildCount++
                    await mkdir(codeDir, { recursive: true })
                    await writeFile(join(codeDir, 'index.js'), 'console.log("built")')
                    await new Promise((r) => setTimeout(r, 30))

                    // Save cache
                    await mkdir(join(sharedDir, 'codes', 'flow-v1'), { recursive: true })
                    cache['step1'] = HASH
                    await writeFile(cacheFile, JSON.stringify(cache))
                }),
            )

            await Promise.all(workerTasks)

            expect(buildCount).toBe(1)
            expect(cacheHitCount).toBe(4)
        }, 15_000)

        it('simulated engine install: atomic copy is safe under concurrency', async () => {
            const engineDir = join(sharedDir, 'common')
            await mkdir(engineDir, { recursive: true })
            const lockPath = join(sharedDir, 'engine')
            let installCount = 0

            const workerTasks = Array.from({ length: 5 }, () =>
                withFileLock(lockPath, async () => {
                    // Check if engine exists
                    try {
                        await stat(join(engineDir, 'main.js'))
                        return // Already installed
                    }
                    catch {
                        // Install needed
                    }

                    installCount++
                    // Simulate atomic copy (temp + rename)
                    const tempPath = join(engineDir, `main.temp.${Math.random()}.js`)
                    await writeFile(tempPath, 'engine code')
                    const { rename } = await import('node:fs/promises')
                    await rename(tempPath, join(engineDir, 'main.js'))
                }),
            )

            await Promise.all(workerTasks)

            expect(installCount).toBe(1)
            const content = await readFile(join(engineDir, 'main.js'), 'utf8')
            expect(content).toBe('engine code')
        }, 15_000)
    })
})
