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
        expect(call.args).toEqual(['install', '--ignore-scripts'])
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

describe('packageManagerRunner', () => {
    it('defaults to bun when AP_PACKAGE_MANAGER is not set', async () => {
        vi.doMock('../src/lib/config/configs', () => ({
            system: { get: () => undefined },
            WorkerSystemProp: { PACKAGE_MANAGER: 'AP_PACKAGE_MANAGER' },
        }))
        const { packageManagerRunner, packageManagerName } = await import('../src/lib/cache/code/package-manager-runner')
        mockSpawnWithKill.mockResolvedValueOnce({ stdout: '', stderr: '' })

        await packageManagerRunner(fakeLog).install({ path: '/tmp/test', filtersPath: [] })

        const call = mockSpawnWithKill.mock.calls[0][0]
        expect(call.cmd).toBe('bun')
        expect(packageManagerName).toBe('bun')
    })

    it('uses pnpm when AP_PACKAGE_MANAGER=pnpm', async () => {
        vi.doMock('../src/lib/config/configs', () => ({
            system: { get: () => 'pnpm' },
            WorkerSystemProp: { PACKAGE_MANAGER: 'AP_PACKAGE_MANAGER' },
        }))
        const { packageManagerRunner, packageManagerName } = await import('../src/lib/cache/code/package-manager-runner')
        mockSpawnWithKill.mockResolvedValueOnce({ stdout: '', stderr: '' })

        await packageManagerRunner(fakeLog).install({ path: '/tmp/test', filtersPath: [] })

        const call = mockSpawnWithKill.mock.calls[0][0]
        expect(call.cmd).toBe('pnpm')
        expect(packageManagerName).toBe('pnpm')
    })

    it('uses bun when AP_PACKAGE_MANAGER=bun', async () => {
        vi.doMock('../src/lib/config/configs', () => ({
            system: { get: () => 'bun' },
            WorkerSystemProp: { PACKAGE_MANAGER: 'AP_PACKAGE_MANAGER' },
        }))
        const { packageManagerRunner, packageManagerName } = await import('../src/lib/cache/code/package-manager-runner')
        mockSpawnWithKill.mockResolvedValueOnce({ stdout: '', stderr: '' })

        await packageManagerRunner(fakeLog).install({ path: '/tmp/test', filtersPath: [] })

        const call = mockSpawnWithKill.mock.calls[0][0]
        expect(call.cmd).toBe('bun')
        expect(packageManagerName).toBe('bun')
    })

    it('is case insensitive — AP_PACKAGE_MANAGER=PNPM works', async () => {
        vi.doMock('../src/lib/config/configs', () => ({
            system: { get: () => 'PNPM' },
            WorkerSystemProp: { PACKAGE_MANAGER: 'AP_PACKAGE_MANAGER' },
        }))
        const { packageManagerRunner, packageManagerName } = await import('../src/lib/cache/code/package-manager-runner')
        mockSpawnWithKill.mockResolvedValueOnce({ stdout: '', stderr: '' })

        await packageManagerRunner(fakeLog).install({ path: '/tmp/test', filtersPath: [] })

        const call = mockSpawnWithKill.mock.calls[0][0]
        expect(call.cmd).toBe('pnpm')
        expect(packageManagerName).toBe('pnpm')
    })

    it('defaults to bun for unknown values', async () => {
        vi.doMock('../src/lib/config/configs', () => ({
            system: { get: () => 'yarn' },
            WorkerSystemProp: { PACKAGE_MANAGER: 'AP_PACKAGE_MANAGER' },
        }))
        const { packageManagerRunner, packageManagerName } = await import('../src/lib/cache/code/package-manager-runner')
        mockSpawnWithKill.mockResolvedValueOnce({ stdout: '', stderr: '' })

        await packageManagerRunner(fakeLog).install({ path: '/tmp/test', filtersPath: [] })

        const call = mockSpawnWithKill.mock.calls[0][0]
        expect(call.cmd).toBe('bun')
        expect(packageManagerName).toBe('bun')
    })
})
