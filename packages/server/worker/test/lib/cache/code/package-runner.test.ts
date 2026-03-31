import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { Logger } from 'pino'

const mockSpawnWithKill = vi.fn()
const mockThreadSafeMkdir = vi.fn()

vi.mock('../../../../src/lib/utils/exec', () => ({
    spawnWithKill: mockSpawnWithKill,
}))

vi.mock('@activepieces/server-utils', () => ({
    fileSystemUtils: {
        threadSafeMkdir: mockThreadSafeMkdir,
    },
    apDayjsDuration: (_val: number, _unit: string) => ({ asMilliseconds: () => 600000 }),
}))

const { packageRunner } = await import('../../../../src/lib/cache/code/package-runner')

const fakeLog = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn().mockReturnThis(),
} as unknown as Logger

beforeEach(() => {
    vi.clearAllMocks()
    mockThreadSafeMkdir.mockResolvedValue(undefined)
})

describe('packageRunner.install', () => {
    it('runs pnpm install with --prefer-offline and --ignore-scripts in the given path', async () => {
        mockSpawnWithKill.mockResolvedValueOnce({ stdout: '', stderr: '' })

        await packageRunner(fakeLog).install({ path: '/workspace/pieces/my-piece-1.0.0' })

        expect(mockSpawnWithKill).toHaveBeenCalledOnce()
        const { cmd, options } = mockSpawnWithKill.mock.calls[0][0]
        expect(cmd).toBe('pnpm install --prefer-offline --ignore-scripts')
        expect(options.cwd).toBe('/workspace/pieces/my-piece-1.0.0')
    })

    it('spawnWithKill rejects — error propagates to caller', async () => {
        const boom = new Error('spawn error')
        mockSpawnWithKill.mockRejectedValueOnce(boom)

        await expect(
            packageRunner(fakeLog).install({ path: '/workspace' }),
        ).rejects.toThrow('spawn error')
    })
})

describe('packageRunner.build', () => {
    it('calls esbuild via spawnWithKill with explicit args — no shell interpolation', async () => {
        mockSpawnWithKill.mockResolvedValueOnce({ stdout: '', stderr: '' })

        await packageRunner(fakeLog).build({
            path: '/path',
            entryFile: '/path/index.ts',
            outputFile: '/path/index.js',
        })

        expect(mockSpawnWithKill).toHaveBeenCalledTimes(1)
        const { cmd, args, options } = mockSpawnWithKill.mock.calls[0][0]
        expect(cmd).toBe('esbuild')
        expect(args).toEqual([
            '/path/index.ts',
            '--bundle',
            '--platform=node',
            '--format=cjs',
            '--outfile=/path/index.js',
        ])
        expect(options.cwd).toBe('/path')
    })

    it('shell metacharacters in path are passed as literal args, not interpreted', async () => {
        mockSpawnWithKill.mockResolvedValueOnce({ stdout: '', stderr: '' })

        const maliciousPath = '/codes/abc/; touch /tmp/rce; #'
        await packageRunner(fakeLog).build({
            path: maliciousPath,
            entryFile: `${maliciousPath}/index.ts`,
            outputFile: `${maliciousPath}/index.js`,
        })

        const { cmd, args } = mockSpawnWithKill.mock.calls[0][0]
        // The malicious string must appear verbatim in the args array, never split by shell
        expect(cmd).toBe('esbuild')
        expect(args[0]).toBe(`${maliciousPath}/index.ts`)
    })
})
