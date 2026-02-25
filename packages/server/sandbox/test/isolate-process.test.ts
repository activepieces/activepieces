import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CreateSandboxProcessParams, SandboxLogger } from '../src/lib/types'

const mockExecPromise = vi.fn().mockResolvedValue({ stdout: '', stderr: '' })
vi.mock('@activepieces/server-shared', () => ({
    execPromise: (...args: unknown[]) => mockExecPromise(...args),
}))

const mockSpawn = vi.fn()
vi.mock('child_process', async (importOriginal) => {
    const actual = await importOriginal<typeof import('child_process')>()
    return {
        ...actual,
        spawn: (...args: unknown[]) => mockSpawn(...args),
    }
})

import { isolateProcess } from '../src/lib/isolate/isolate-process'

function createTestLogger(): SandboxLogger {
    return {
        info: vi.fn(),
        debug: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
    }
}

describe('isolateProcess', () => {
    beforeEach(() => {
        mockSpawn.mockReset()
        mockExecPromise.mockReset().mockResolvedValue({ stdout: '', stderr: '' })
        mockSpawn.mockReturnValue({
            stdout: { on: vi.fn() },
            stderr: { on: vi.fn() },
            on: vi.fn(),
            pid: 1234,
        })
    })

    it('should cleanup and init isolate sandbox before spawning', async () => {
        const log = createTestLogger()
        const processMaker = isolateProcess(log)

        await processMaker.create({
            sandboxId: 'test-sandbox',
            command: ['/usr/local/bin/node', '/root/main.js'],
            mounts: [],
            env: {},
            resourceLimits: { memoryBytes: 0, cpuMsPerSec: 0, timeLimitSeconds: 10 },
        })

        expect(mockExecPromise).toHaveBeenCalledTimes(2)
        expect(mockExecPromise.mock.calls[0][0]).toContain('--cleanup')
        expect(mockExecPromise.mock.calls[1][0]).toContain('--init')
    })

    it('should pass mounts as --dir args with correct format', async () => {
        const log = createTestLogger()
        const processMaker = isolateProcess(log)

        await processMaker.create({
            sandboxId: 'mount-test',
            command: ['/usr/local/bin/node', '/root/main.js'],
            mounts: [
                { hostPath: '/cache/common', sandboxPath: '/root' },
                { hostPath: '/cache/codes', sandboxPath: '/codes' },
                { hostPath: '/opt/pieces/node_modules', sandboxPath: '/node_modules', optional: true },
            ],
            env: {},
            resourceLimits: { memoryBytes: 0, cpuMsPerSec: 0, timeLimitSeconds: 10 },
        })

        const spawnArgs = mockSpawn.mock.calls[0][1] as string[]
        expect(spawnArgs).toContain('--dir=/root=/cache/common')
        expect(spawnArgs).toContain('--dir=/codes=/cache/codes')
        expect(spawnArgs).toContain('--dir=/node_modules=/opt/pieces/node_modules:maybe')
    })

    it('should pass env vars as --env args', async () => {
        const log = createTestLogger()
        const processMaker = isolateProcess(log)

        await processMaker.create({
            sandboxId: 'env-test',
            command: ['/usr/local/bin/node', '/root/main.js'],
            mounts: [],
            env: {
                SANDBOX_ID: 'env-test',
                HOME: '/tmp/',
                AP_BASE_CODE_DIRECTORY: '/codes',
            },
            resourceLimits: { memoryBytes: 0, cpuMsPerSec: 0, timeLimitSeconds: 10 },
        })

        const spawnArgs = mockSpawn.mock.calls[0][1] as string[]
        expect(spawnArgs).toContain("--env=SANDBOX_ID='env-test'")
        expect(spawnArgs).toContain("--env=HOME='/tmp/'")
        expect(spawnArgs).toContain("--env=AP_BASE_CODE_DIRECTORY='/codes'")
    })

    it('should always include --dir=/usr/bin/, --share-net, --processes, --chdir=/root', async () => {
        const log = createTestLogger()
        const processMaker = isolateProcess(log)

        await processMaker.create({
            sandboxId: 'flags-test',
            command: ['/usr/local/bin/node', '/root/main.js'],
            mounts: [],
            env: {},
            resourceLimits: { memoryBytes: 0, cpuMsPerSec: 0, timeLimitSeconds: 10 },
        })

        const spawnArgs = mockSpawn.mock.calls[0][1] as string[]
        expect(spawnArgs).toContain('--dir=/usr/bin/')
        expect(spawnArgs).toContain('--share-net')
        expect(spawnArgs).toContain('--processes')
        expect(spawnArgs).toContain('--chdir=/root')
        expect(spawnArgs).toContain('--run')
    })

    it('should place command binary and args after --run and env vars', async () => {
        const log = createTestLogger()
        const processMaker = isolateProcess(log)

        await processMaker.create({
            sandboxId: 'command-test',
            command: ['/usr/local/bin/node', '/root/main.js'],
            mounts: [],
            env: { FOO: 'bar' },
            resourceLimits: { memoryBytes: 0, cpuMsPerSec: 0, timeLimitSeconds: 10 },
        })

        const spawnArgs = mockSpawn.mock.calls[0][1] as string[]
        const runIndex = spawnArgs.indexOf('--run')
        const envIndex = spawnArgs.indexOf("--env=FOO='bar'")
        const nodeIndex = spawnArgs.indexOf('/usr/local/bin/node')
        const mainIndex = spawnArgs.indexOf('/root/main.js')

        expect(runIndex).toBeGreaterThan(-1)
        expect(envIndex).toBeGreaterThan(runIndex)
        expect(nodeIndex).toBeGreaterThan(envIndex)
        expect(mainIndex).toBeGreaterThan(nodeIndex)
    })

    it('should assign unique box ids to different sandboxes', async () => {
        const log = createTestLogger()
        const processMaker = isolateProcess(log)

        const baseParams: CreateSandboxProcessParams = {
            sandboxId: '',
            command: ['/usr/local/bin/node', '/root/main.js'],
            mounts: [],
            env: {},
            resourceLimits: { memoryBytes: 0, cpuMsPerSec: 0, timeLimitSeconds: 10 },
        }

        await processMaker.create({ ...baseParams, sandboxId: 'sandbox-a' })
        await processMaker.create({ ...baseParams, sandboxId: 'sandbox-b' })

        const firstCallArgs = mockSpawn.mock.calls[0][1] as string[]
        const secondCallArgs = mockSpawn.mock.calls[1][1] as string[]

        const boxIdA = firstCallArgs.find(a => a.startsWith('--box-id='))
        const boxIdB = secondCallArgs.find(a => a.startsWith('--box-id='))

        expect(boxIdA).toBeDefined()
        expect(boxIdB).toBeDefined()
        expect(boxIdA).not.toBe(boxIdB)
    })

    it('should only pass explicitly provided env vars, not host process.env', async () => {
        const log = createTestLogger()
        const processMaker = isolateProcess(log)

        await processMaker.create({
            sandboxId: 'env-isolation-test',
            command: ['/usr/local/bin/node', '/root/main.js'],
            mounts: [],
            env: {
                SANDBOX_ID: 'env-isolation-test',
                AP_EXECUTION_MODE: 'SANDBOX',
            },
            resourceLimits: { memoryBytes: 0, cpuMsPerSec: 0, timeLimitSeconds: 10 },
        })

        const spawnArgs = mockSpawn.mock.calls[0][1] as string[]
        const envArgs = spawnArgs.filter(a => a.startsWith('--env='))

        // Only the 2 explicitly provided env vars should be present
        expect(envArgs).toHaveLength(2)
        expect(envArgs).toContain("--env=SANDBOX_ID='env-isolation-test'")
        expect(envArgs).toContain("--env=AP_EXECUTION_MODE='SANDBOX'")

        // Common host env vars should NOT leak into the sandbox
        const envString = envArgs.join(' ')
        expect(envString).not.toContain('PATH=')
        expect(envString).not.toContain('USER=')
        expect(envString).not.toContain('SHELL=')
        expect(envString).not.toContain('LANG=')
        expect(envString).not.toContain('TERM=')
    })

    it('should spawn with shell: true to match old isolate behavior', async () => {
        const log = createTestLogger()
        const processMaker = isolateProcess(log)

        await processMaker.create({
            sandboxId: 'shell-test',
            command: ['/usr/local/bin/node', '/root/main.js'],
            mounts: [],
            env: {},
            resourceLimits: { memoryBytes: 0, cpuMsPerSec: 0, timeLimitSeconds: 10 },
        })

        const spawnOptions = mockSpawn.mock.calls[0][2]
        expect(spawnOptions).toEqual({ shell: true })
    })
})
