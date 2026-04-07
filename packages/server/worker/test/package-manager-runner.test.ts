import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Logger } from 'pino'

const mockSpawnWithKill = vi.fn()

vi.mock('../src/lib/utils/exec', () => ({
    spawnWithKill: (...args: unknown[]) => mockSpawnWithKill(...args),
}))

const fakeLog = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
} as unknown as Logger

beforeEach(() => {
    vi.clearAllMocks()
})

afterEach(() => {
    vi.resetModules()
})

describe('bunRunner', () => {
    it('calls bun install with --filter for workspace paths', async () => {
        const { bunRunner } = await import('../src/lib/cache/code/bun-runner')
        mockSpawnWithKill.mockResolvedValueOnce({ stdout: '', stderr: '' })

        await bunRunner(fakeLog).install({
            path: '/tmp/test',
            filtersPath: ['pieces/piece-a-1.0.0'],
        })

        expect(mockSpawnWithKill).toHaveBeenCalledOnce()
        const call = mockSpawnWithKill.mock.calls[0][0]
        expect(call.cmd).toBe('bun')
        expect(call.args).toEqual([
            'install',
            '--ignore-scripts',
            '--linker=hoisted',
            '--filter', './pieces/piece-a-1.0.0',
        ])
        expect(call.options.cwd).toBe('/tmp/test')
    })

    it('calls bun install without --filter when filtersPath is empty', async () => {
        const { bunRunner } = await import('../src/lib/cache/code/bun-runner')
        mockSpawnWithKill.mockResolvedValueOnce({ stdout: '', stderr: '' })

        await bunRunner(fakeLog).install({
            path: '/tmp/test',
            filtersPath: [],
        })

        const call = mockSpawnWithKill.mock.calls[0][0]
        expect(call.cmd).toBe('bun')
        expect(call.args).toEqual(['install', '--ignore-scripts', '--linker=hoisted'])
    })

    it('calls esbuild for build', async () => {
        const { bunRunner } = await import('../src/lib/cache/code/bun-runner')
        mockSpawnWithKill.mockResolvedValueOnce({ stdout: '', stderr: '' })

        await bunRunner(fakeLog).build({
            path: '/tmp/test',
            entryFile: '/tmp/test/index.ts',
            outputFile: '/tmp/test/index.js',
        })

        const call = mockSpawnWithKill.mock.calls[0][0]
        expect(call.cmd).toBe('esbuild')
        expect(call.args).toContain('--bundle')
        expect(call.args).toContain('--platform=node')
        expect(call.args).toContain('--format=cjs')
        expect(call.args).toContain('--outfile=/tmp/test/index.js')
    })

    it('throws on install failure', async () => {
        const { bunRunner } = await import('../src/lib/cache/code/bun-runner')
        mockSpawnWithKill.mockRejectedValueOnce(new Error('bun not found'))

        await expect(bunRunner(fakeLog).install({
            path: '/tmp/test',
            filtersPath: [],
        })).rejects.toThrow('bun not found')
    })

    it('rejects invalid filter paths', async () => {
        const { bunRunner } = await import('../src/lib/cache/code/bun-runner')

        await expect(bunRunner(fakeLog).install({
            path: '/tmp/test',
            filtersPath: ['../escape'],
        })).rejects.toThrow('Invalid filter path')
    })
})

describe('pnpmRunner', () => {
    it('calls pnpm install with --filter for workspace paths', async () => {
        const { pnpmRunner } = await import('../src/lib/cache/code/pnpm-runner')
        mockSpawnWithKill.mockResolvedValueOnce({ stdout: '', stderr: '' })

        await pnpmRunner(fakeLog).install({
            path: '/tmp/test',
            filtersPath: ['pieces/piece-a-1.0.0'],
        })

        expect(mockSpawnWithKill).toHaveBeenCalledOnce()
        const call = mockSpawnWithKill.mock.calls[0][0]
        expect(call.cmd).toBe('pnpm')
        expect(call.args).toEqual([
            'install',
            '--prefer-offline',
            '--ignore-scripts',
            '--filter', './pieces/piece-a-1.0.0',
        ])
        expect(call.options.cwd).toBe('/tmp/test')
    })

    it('calls pnpm install without --filter when filtersPath is empty', async () => {
        const { pnpmRunner } = await import('../src/lib/cache/code/pnpm-runner')
        mockSpawnWithKill.mockResolvedValueOnce({ stdout: '', stderr: '' })

        await pnpmRunner(fakeLog).install({
            path: '/tmp/test',
            filtersPath: [],
        })

        const call = mockSpawnWithKill.mock.calls[0][0]
        expect(call.cmd).toBe('pnpm')
        expect(call.args).toEqual(['install', '--prefer-offline', '--ignore-scripts'])
    })

    it('handles multiple workspace filters', async () => {
        const { pnpmRunner } = await import('../src/lib/cache/code/pnpm-runner')
        mockSpawnWithKill.mockResolvedValueOnce({ stdout: '', stderr: '' })

        await pnpmRunner(fakeLog).install({
            path: '/tmp/test',
            filtersPath: ['pieces/piece-a-1.0.0', 'pieces/piece-b-2.0.0'],
        })

        const call = mockSpawnWithKill.mock.calls[0][0]
        expect(call.args).toEqual([
            'install',
            '--prefer-offline',
            '--ignore-scripts',
            '--filter', './pieces/piece-a-1.0.0',
            '--filter', './pieces/piece-b-2.0.0',
        ])
    })

    it('throws on install failure', async () => {
        const { pnpmRunner } = await import('../src/lib/cache/code/pnpm-runner')
        mockSpawnWithKill.mockRejectedValueOnce(new Error('pnpm ERR!'))

        await expect(pnpmRunner(fakeLog).install({
            path: '/tmp/test',
            filtersPath: [],
        })).rejects.toThrow('pnpm ERR!')
    })

    it('rejects invalid filter paths', async () => {
        const { pnpmRunner } = await import('../src/lib/cache/code/pnpm-runner')

        await expect(pnpmRunner(fakeLog).install({
            path: '/tmp/test',
            filtersPath: ['../escape'],
        })).rejects.toThrow('Invalid filter path')
    })
})

describe('packageManager', () => {
    it('uses bun when AP_PACKAGE_MANAGER=bun (no probe)', async () => {
        vi.doMock('../src/lib/config/configs', () => ({
            system: { get: () => 'bun' },
            WorkerSystemProp: { PACKAGE_MANAGER: 'AP_PACKAGE_MANAGER' },
        }))
        const { packageManager } = await import('../src/lib/cache/code/package-manager-runner')
        packageManager.resetForTesting()

        await packageManager.init(fakeLog)

        expect(packageManager.name()).toBe('bun')
        expect(mockSpawnWithKill).not.toHaveBeenCalled()
    })

    it('uses pnpm when AP_PACKAGE_MANAGER=pnpm (no probe)', async () => {
        vi.doMock('../src/lib/config/configs', () => ({
            system: { get: () => 'pnpm' },
            WorkerSystemProp: { PACKAGE_MANAGER: 'AP_PACKAGE_MANAGER' },
        }))
        const { packageManager } = await import('../src/lib/cache/code/package-manager-runner')
        packageManager.resetForTesting()

        await packageManager.init(fakeLog)

        expect(packageManager.name()).toBe('pnpm')
        expect(mockSpawnWithKill).not.toHaveBeenCalled()
    })

    it('is case insensitive — AP_PACKAGE_MANAGER=PNPM works', async () => {
        vi.doMock('../src/lib/config/configs', () => ({
            system: { get: () => 'PNPM' },
            WorkerSystemProp: { PACKAGE_MANAGER: 'AP_PACKAGE_MANAGER' },
        }))
        const { packageManager } = await import('../src/lib/cache/code/package-manager-runner')
        packageManager.resetForTesting()

        await packageManager.init(fakeLog)

        expect(packageManager.name()).toBe('pnpm')
    })

    it('auto-detects bun when env var is not set and bun --version succeeds', async () => {
        vi.doMock('../src/lib/config/configs', () => ({
            system: { get: () => undefined },
            WorkerSystemProp: { PACKAGE_MANAGER: 'AP_PACKAGE_MANAGER' },
        }))
        mockSpawnWithKill.mockResolvedValueOnce({ stdout: '1.0.0', stderr: '' })
        const { packageManager } = await import('../src/lib/cache/code/package-manager-runner')
        packageManager.resetForTesting()

        await packageManager.init(fakeLog)

        expect(packageManager.name()).toBe('bun')
        expect(mockSpawnWithKill).toHaveBeenCalledOnce()
        const call = mockSpawnWithKill.mock.calls[0][0]
        expect(call.cmd).toBe('bun')
        expect(call.args).toEqual(['--version'])
    })

    it('falls back to pnpm when env var is not set and bun --version fails', async () => {
        vi.doMock('../src/lib/config/configs', () => ({
            system: { get: () => undefined },
            WorkerSystemProp: { PACKAGE_MANAGER: 'AP_PACKAGE_MANAGER' },
        }))
        mockSpawnWithKill.mockRejectedValueOnce(new Error('bun not found'))
        const { packageManager } = await import('../src/lib/cache/code/package-manager-runner')
        packageManager.resetForTesting()

        await packageManager.init(fakeLog)

        expect(packageManager.name()).toBe('pnpm')
    })

    it('falls back to pnpm for unknown env var values and bun probe fails', async () => {
        vi.doMock('../src/lib/config/configs', () => ({
            system: { get: () => 'yarn' },
            WorkerSystemProp: { PACKAGE_MANAGER: 'AP_PACKAGE_MANAGER' },
        }))
        mockSpawnWithKill.mockRejectedValueOnce(new Error('bun not found'))
        const { packageManager } = await import('../src/lib/cache/code/package-manager-runner')
        packageManager.resetForTesting()

        await packageManager.init(fakeLog)

        expect(packageManager.name()).toBe('pnpm')
    })

    it('throws when name() is called before init', async () => {
        vi.doMock('../src/lib/config/configs', () => ({
            system: { get: () => undefined },
            WorkerSystemProp: { PACKAGE_MANAGER: 'AP_PACKAGE_MANAGER' },
        }))
        const { packageManager } = await import('../src/lib/cache/code/package-manager-runner')
        packageManager.resetForTesting()

        expect(() => packageManager.name()).toThrow('Package manager not initialized')
    })

    it('only initializes once even if called multiple times', async () => {
        vi.doMock('../src/lib/config/configs', () => ({
            system: { get: () => undefined },
            WorkerSystemProp: { PACKAGE_MANAGER: 'AP_PACKAGE_MANAGER' },
        }))
        mockSpawnWithKill.mockResolvedValue({ stdout: '1.0.0', stderr: '' })
        const { packageManager } = await import('../src/lib/cache/code/package-manager-runner')
        packageManager.resetForTesting()

        await packageManager.init(fakeLog)
        await packageManager.init(fakeLog)

        expect(packageManager.name()).toBe('bun')
        expect(mockSpawnWithKill).toHaveBeenCalledOnce()
    })
})
