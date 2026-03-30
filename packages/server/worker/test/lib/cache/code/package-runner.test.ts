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
    it('no filters — cmd includes pnpm install with no --filter', async () => {
        mockSpawnWithKill.mockResolvedValueOnce({ stdout: '', stderr: '' })

        await packageRunner(fakeLog).install({ path: '/workspace', filtersPath: [] })

        expect(mockSpawnWithKill).toHaveBeenCalledOnce()
        const { cmd } = mockSpawnWithKill.mock.calls[0][0]
        expect(cmd).toContain('pnpm install')
        expect(cmd).toContain('--prefer-offline')
        expect(cmd).toContain('--ignore-scripts')
        expect(cmd).not.toContain('--filter')
    })

    it('filter paths — cmd includes --filter for each path', async () => {
        mockSpawnWithKill.mockResolvedValueOnce({ stdout: '', stderr: '' })

        await packageRunner(fakeLog).install({
            path: '/workspace',
            filtersPath: ['pieces/name-1.0.0', 'pieces/other-2.0.0'],
        })

        const { cmd } = mockSpawnWithKill.mock.calls[0][0]
        expect(cmd).toContain('--filter ./pieces/name-1.0.0')
        expect(cmd).toContain('--filter ./pieces/other-2.0.0')
    })

    it('invalid filter path — throws before spawning', async () => {
        await expect(
            packageRunner(fakeLog).install({
                path: '/workspace',
                filtersPath: ['../evil/../path'],
            }),
        ).rejects.toThrow('Invalid filter path')

        expect(mockSpawnWithKill).not.toHaveBeenCalled()
    })

    it('spawnWithKill rejects — error is re-thrown', async () => {
        const boom = new Error('spawn error')
        mockSpawnWithKill.mockRejectedValueOnce(boom)

        await expect(
            packageRunner(fakeLog).install({ path: '/workspace', filtersPath: [] }),
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
