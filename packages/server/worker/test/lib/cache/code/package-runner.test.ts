import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { Logger } from 'pino'

const mockSpawnWithKill = vi.fn()
const mockExecPromise = vi.fn()
const mockThreadSafeMkdir = vi.fn()

vi.mock('../../../../src/lib/utils/exec', () => ({
    spawnWithKill: mockSpawnWithKill,
    execPromise: mockExecPromise,
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
    it('calls esbuild with correct args', async () => {
        mockExecPromise.mockResolvedValueOnce({ stdout: '', stderr: '' })

        await packageRunner(fakeLog).build({
            path: '/path',
            entryFile: '/path/index.ts',
            outputFile: '/path/index.js',
        })

        expect(mockExecPromise).toHaveBeenCalledOnce()
        const [cmd] = mockExecPromise.mock.calls[0]
        expect(cmd).toBe('esbuild /path/index.ts --bundle --platform=node --format=cjs --outfile=/path/index.js')
    })
})
