import { describe, it, expect, vi, beforeEach } from 'vitest'

const { spawnMock, execPromiseMock } = vi.hoisted(() => ({
    spawnMock: vi.fn().mockReturnValue({
        pid: 999,
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
    }),
    execPromiseMock: vi.fn().mockResolvedValue({ stdout: '', stderr: '' }),
}))

vi.mock('child_process', () => ({
    spawn: spawnMock,
}))

vi.mock('@activepieces/server-common', () => ({
    execPromise: execPromiseMock,
}))

import { isolateProcess } from '../../../src/lib/sandbox/isolate'
import { SandboxLogger } from '../../../src/lib/sandbox/types'

function createMockLogger(): SandboxLogger {
    return {
        info: vi.fn(),
        debug: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
    }
}

describe('isolateProcess', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('assigns incrementing sandbox box-ids', async () => {
        const log = createMockLogger()
        const maker = isolateProcess(log)

        await maker.create({
            sandboxId: 'iso-a',
            command: ['/usr/bin/node', 'engine.js'],
            mounts: [],
            env: { KEY: 'val' },
            resourceLimits: { memoryBytes: 256 * 1024 * 1024, cpuMsPerSec: 1000, timeLimitSeconds: 60 },
        })

        await maker.create({
            sandboxId: 'iso-b',
            command: ['/usr/bin/node', 'engine.js'],
            mounts: [],
            env: { KEY: 'val' },
            resourceLimits: { memoryBytes: 256 * 1024 * 1024, cpuMsPerSec: 1000, timeLimitSeconds: 60 },
        })

        const firstCleanupCall = execPromiseMock.mock.calls[0][0] as string
        const secondCleanupCall = execPromiseMock.mock.calls[2][0] as string

        const firstBoxId = firstCleanupCall.match(/--box-id=(\d+)/)?.[1]
        const secondBoxId = secondCleanupCall.match(/--box-id=(\d+)/)?.[1]
        expect(firstBoxId).not.toBe(secondBoxId)
    })

    it('runs cleanup and init before spawning', async () => {
        const log = createMockLogger()
        const maker = isolateProcess(log)

        await maker.create({
            sandboxId: 'iso-cleanup',
            command: ['/usr/bin/node', 'engine.js'],
            mounts: [],
            env: {},
            resourceLimits: { memoryBytes: 256 * 1024 * 1024, cpuMsPerSec: 1000, timeLimitSeconds: 60 },
        })

        expect(execPromiseMock).toHaveBeenCalledTimes(2)
        const cleanupCall = execPromiseMock.mock.calls[0][0] as string
        const initCall = execPromiseMock.mock.calls[1][0] as string
        expect(cleanupCall).toContain('--cleanup')
        expect(initCall).toContain('--init')
        expect(spawnMock).toHaveBeenCalledTimes(1)
    })

    it('constructs correct args including mount dirs, env vars, --share-net, --processes, --chdir', async () => {
        const log = createMockLogger()
        const maker = isolateProcess(log)

        await maker.create({
            sandboxId: 'iso-args',
            command: ['/usr/bin/node', 'engine.js', '--flag'],
            mounts: [
                { hostPath: '/host/code', sandboxPath: '/sandbox/code' },
                { hostPath: '/host/opt', sandboxPath: '/sandbox/opt', optional: true },
            ],
            env: { FOO: 'bar', BAZ: 'qux' },
            resourceLimits: { memoryBytes: 256 * 1024 * 1024, cpuMsPerSec: 1000, timeLimitSeconds: 60 },
        })

        const args = spawnMock.mock.calls[0][1] as string[]
        expect(args).toContain('--dir=/usr/bin/')
        expect(args).toContain('--dir=/sandbox/code=/host/code')
        expect(args).toContain('--dir=/sandbox/opt=/host/opt:maybe')
        expect(args).toContain('--share-net')
        expect(args).toContain('--processes')
        expect(args).toContain('--chdir=/root')
        expect(args).toContain('--run')
        expect(args).toContain("--env=FOO='bar'")
        expect(args).toContain("--env=BAZ='qux'")
        expect(args).toContain('/usr/bin/node')
        expect(args).toContain('engine.js')
        expect(args).toContain('--flag')
    })

    it('uses correct binary name for arm64 vs x86', async () => {
        const log = createMockLogger()
        const maker = isolateProcess(log)

        await maker.create({
            sandboxId: 'iso-arch',
            command: ['/usr/bin/node'],
            mounts: [],
            env: {},
            resourceLimits: { memoryBytes: 256 * 1024 * 1024, cpuMsPerSec: 1000, timeLimitSeconds: 60 },
        })

        const binaryPath = spawnMock.mock.calls[0][0] as string
        if (process.arch === 'arm64' || process.arch === 'arm') {
            expect(binaryPath).toContain('isolate-arm')
        }
        else {
            expect(binaryPath).toContain('isolate')
        }
    })
})
