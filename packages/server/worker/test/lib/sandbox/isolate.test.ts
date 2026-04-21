import { EventEmitter } from 'node:events'
import path from 'path'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { spawnMock, mkdirMock, execPromiseMock } = vi.hoisted(() => ({
    spawnMock: vi.fn(),
    mkdirMock: vi.fn(),
    execPromiseMock: vi.fn(),
}))

vi.mock('child_process', () => ({
    spawn: spawnMock,
}))

vi.mock('fs/promises', () => ({
    mkdir: mkdirMock,
}))

vi.mock('../../../src/lib/utils/exec', () => ({
    execPromise: execPromiseMock,
}))

import { isolateProcess, getIsolateExecutableName } from '../../../src/lib/sandbox/isolate'
import { SandboxLogger, SandboxMount } from '../../../src/lib/sandbox/types'

function createMockLogger(): SandboxLogger {
    return {
        info: vi.fn(),
        debug: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
    }
}

function createMockChild() {
    const child = new EventEmitter() as EventEmitter & { stdout: null, stderr: null }
    child.stdout = null
    child.stderr = null
    return child
}

const BASE_ENV: Record<string, string> = {
    HOME: '/tmp/',
    NODE_PATH: '/usr/src/node_modules',
    AP_EXECUTION_MODE: 'SANDBOX_PROCESS',
    AP_SANDBOX_WS_PORT: '12345',
}

const etcDir = path.resolve(process.cwd(), 'packages/server/api/src/assets/etc')

async function callCreate({
    mounts = [],
    env = BASE_ENV,
    boxId = 7,
    enginePath = '/host/cache/common/main.js',
    sandboxId = 'sb-abc',
}: {
    mounts?: SandboxMount[]
    env?: Record<string, string>
    boxId?: number
    enginePath?: string
    sandboxId?: string
} = {}) {
    const maker = isolateProcess(createMockLogger(), enginePath, '/host/cache/codes', boxId)
    return maker.create({
        sandboxId,
        command: [],
        mounts,
        env,
        resourceLimits: { memoryLimitMb: 256, cpuMsPerSec: 1000, timeLimitSeconds: 60 },
    })
}

describe('isolateProcess', () => {
    beforeEach(() => {
        spawnMock.mockReset()
        mkdirMock.mockReset()
        execPromiseMock.mockReset()
        spawnMock.mockImplementation(() => createMockChild())
        mkdirMock.mockResolvedValue(undefined)
        execPromiseMock.mockResolvedValue({ stdout: '', stderr: '' })
    })

    describe('pre-spawn', () => {
        it('runs isolate --cleanup then --init before spawning', async () => {
            await callCreate({ boxId: 3 })

            expect(execPromiseMock).toHaveBeenCalledTimes(2)
            expect(execPromiseMock.mock.calls[0][0]).toMatch(/--box-id=3 --cleanup$/)
            expect(execPromiseMock.mock.calls[1][0]).toMatch(/--box-id=3 --init$/)
            expect(execPromiseMock.mock.invocationCallOrder[0]).toBeLessThan(spawnMock.mock.invocationCallOrder[0])
        })

        it('pre-creates a sandbox rootfs directory for each mount', async () => {
            const mounts: SandboxMount[] = [
                { hostPath: '/host/common', sandboxPath: '/root/common' },
                { hostPath: '/host/codes/fv-1', sandboxPath: '/root/codes/fv-1', optional: true },
            ]
            await callCreate({ mounts, boxId: 9 })

            expect(mkdirMock).toHaveBeenCalledWith('/var/local/lib/isolate/9/root/root/common', { recursive: true })
            expect(mkdirMock).toHaveBeenCalledWith('/var/local/lib/isolate/9/root/root/codes/fv-1', { recursive: true })
            expect(mkdirMock).toHaveBeenCalledTimes(2)
        })

        it('refuses to mkdir or spawn when a mount sandboxPath escapes /root/', async () => {
            const mounts: SandboxMount[] = [{ hostPath: '/host/evil', sandboxPath: '/root/../etc' }]

            await expect(callCreate({ mounts })).rejects.toThrow(/outside sandbox rootfs/)
            expect(mkdirMock).not.toHaveBeenCalled()
            expect(spawnMock).not.toHaveBeenCalled()
        })

        it('refuses absolute paths outside /root/', async () => {
            const mounts: SandboxMount[] = [{ hostPath: '/host/evil', sandboxPath: '/etc/passwd' }]
            await expect(callCreate({ mounts })).rejects.toThrow(/outside sandbox rootfs/)
            expect(spawnMock).not.toHaveBeenCalled()
        })
    })

    describe('argv', () => {
        it('emits all static --dir flags in the expected order', async () => {
            await callCreate()

            const args: string[] = spawnMock.mock.calls[0][1]
            expect(args.slice(0, 4)).toEqual([
                '--dir=/usr/bin/',
                '--dir=/usr/local/',
                `--dir=/etc/=${etcDir}`,
                '--dir=/usr/src/node_modules/',
            ])
        })

        it('never drops the /etc mount (binds to the bundled etcDir)', async () => {
            await callCreate()
            const args: string[] = spawnMock.mock.calls[0][1]
            const etcMount = args.find((a) => a.startsWith('--dir=/etc/='))
            expect(etcMount).toBe(`--dir=/etc/=${etcDir}`)
            expect(args.some((a) => a === '--dir=/etc/' || a === '--dir=/etc')).toBe(false)
        })

        it('renders dynamic mounts as --dir=<sandbox>=<host>', async () => {
            const mounts: SandboxMount[] = [
                { hostPath: '/host/common', sandboxPath: '/root/common' },
                { hostPath: '/host/codes/fv-1', sandboxPath: '/root/codes/fv-1' },
            ]
            await callCreate({ mounts })

            const args: string[] = spawnMock.mock.calls[0][1]
            expect(args).toContain('--dir=/root/common=/host/common')
            expect(args).toContain('--dir=/root/codes/fv-1=/host/codes/fv-1')
        })

        it('appends :maybe suffix on optional mounts', async () => {
            const mounts: SandboxMount[] = [
                { hostPath: '/host/custom', sandboxPath: '/root/custom_pieces', optional: true },
            ]
            await callCreate({ mounts })

            const args: string[] = spawnMock.mock.calls[0][1]
            expect(args).toContain('--dir=/root/custom_pieces=/host/custom:maybe')
        })

        it('emits exactly one --dir per mount, no duplicates', async () => {
            const mounts: SandboxMount[] = [
                { hostPath: '/host/a', sandboxPath: '/root/a' },
                { hostPath: '/host/b', sandboxPath: '/root/b', optional: true },
            ]
            await callCreate({ mounts })

            const args: string[] = spawnMock.mock.calls[0][1]
            const dynamicDirs = args.filter((a) => a.startsWith('--dir=/root/'))
            expect(dynamicDirs).toEqual([
                '--dir=/root/a=/host/a',
                '--dir=/root/b=/host/b:maybe',
            ])
        })

        it('includes --box-id, --chdir=/root, --processes, --share-net', async () => {
            await callCreate({ boxId: 42 })
            const args: string[] = spawnMock.mock.calls[0][1]
            expect(args).toContain('--box-id=42')
            expect(args).toContain('--chdir=/root')
            expect(args).toContain('--processes')
            expect(args).toContain('--share-net')
        })

        it('runs node with engine path at /root/common/<basename>', async () => {
            await callCreate({ enginePath: '/any/where/engine-main.js' })
            const args: string[] = spawnMock.mock.calls[0][1]
            expect(args[args.length - 2]).toBe(process.execPath)
            expect(args[args.length - 1]).toBe('/root/common/engine-main.js')
            expect(args[args.length - 3]).toBe('--')
            expect(args[args.length - 4]).toBe('--run')
        })

        it('spawns with shell: false', async () => {
            await callCreate()
            expect(spawnMock.mock.calls[0][2]).toEqual({ shell: false })
        })
    })

    describe('env', () => {
        it('injects AP_BASE_CODE_DIRECTORY=/root/codes and SANDBOX_ID=<sandboxId>', async () => {
            await callCreate({ sandboxId: 'sb-xyz' })
            const args: string[] = spawnMock.mock.calls[0][1]
            expect(args).toContain('--env=AP_BASE_CODE_DIRECTORY=/root/codes')
            expect(args).toContain('--env=SANDBOX_ID=sb-xyz')
        })

        it('forwards every caller-provided env entry as --env=K=V', async () => {
            await callCreate({
                env: {
                    ...BASE_ENV,
                    MY_SECRET: 'hunter2',
                },
            })
            const args: string[] = spawnMock.mock.calls[0][1]
            expect(args).toContain('--env=MY_SECRET=hunter2')
            expect(args).toContain('--env=HOME=/tmp/')
            expect(args).toContain('--env=NODE_PATH=/usr/src/node_modules')
            expect(args).toContain('--env=AP_EXECUTION_MODE=SANDBOX_PROCESS')
        })

        it('does not allow caller-supplied env to override injected AP_BASE_CODE_DIRECTORY or SANDBOX_ID', async () => {
            await callCreate({
                sandboxId: 'sb-xyz',
                env: {
                    ...BASE_ENV,
                    AP_BASE_CODE_DIRECTORY: '/etc',
                    SANDBOX_ID: 'spoofed',
                },
            })
            const args: string[] = spawnMock.mock.calls[0][1]
            const baseCodeDirArgs = args.filter((a) => a.startsWith('--env=AP_BASE_CODE_DIRECTORY='))
            const sandboxIdArgs = args.filter((a) => a.startsWith('--env=SANDBOX_ID='))
            expect(baseCodeDirArgs).toEqual(['--env=AP_BASE_CODE_DIRECTORY=/root/codes'])
            expect(sandboxIdArgs).toEqual(['--env=SANDBOX_ID=sb-xyz'])
        })

        it.each([
            'HOME',
            'NODE_PATH',
            'AP_EXECUTION_MODE',
            'AP_SANDBOX_WS_PORT',
        ])('throws when required env "%s" is missing', async (missingKey) => {
            const env = { ...BASE_ENV } as Record<string, string>
            delete env[missingKey]
            await expect(callCreate({ env })).rejects.toThrow(/Required sandbox env/)
            expect(execPromiseMock).not.toHaveBeenCalled()
            expect(mkdirMock).not.toHaveBeenCalled()
            expect(spawnMock).not.toHaveBeenCalled()
        })

        it.each([
            'HOME',
            'NODE_PATH',
            'AP_EXECUTION_MODE',
        ])('throws when required env "%s" is empty string', async (key) => {
            const env = { ...BASE_ENV, [key]: '' }
            await expect(callCreate({ env })).rejects.toThrow(/Required sandbox env/)
            expect(execPromiseMock).not.toHaveBeenCalled()
            expect(spawnMock).not.toHaveBeenCalled()
        })

        it.each([
            ['starts with digit', '9HOME'],
            ['contains hyphen', 'MY-VAR'],
            ['contains space', 'MY VAR'],
            ['contains equals', 'MY=VAR'],
        ])('rejects malformed env key (%s)', async (_label, badKey) => {
            const env = { ...BASE_ENV, [badKey]: 'v' }
            await expect(callCreate({ env })).rejects.toThrow(/Invalid sandbox env key/)
            expect(execPromiseMock).not.toHaveBeenCalled()
            expect(spawnMock).not.toHaveBeenCalled()
        })

        it('accepts lowercase env keys (e.g. http_proxy honored by curl/wget)', async () => {
            const env = { ...BASE_ENV, http_proxy: 'http://127.0.0.1:1080' }
            const result = await callCreate({ env })
            expect(result).toBeDefined()
            expect(spawnMock).toHaveBeenCalledTimes(1)
        })

        it.each([
            ['newline', 'line1\nline2'],
            ['carriage return', 'line1\rline2'],
            ['NUL', 'value\0withNull'],
        ])('rejects env values containing %s', async (_label, badValue) => {
            const env = { ...BASE_ENV, MY_VAR: badValue }
            await expect(callCreate({ env })).rejects.toThrow(/must not contain newlines or NUL bytes/)
            expect(execPromiseMock).not.toHaveBeenCalled()
            expect(spawnMock).not.toHaveBeenCalled()
        })
    })

    describe('getIsolateExecutableName', () => {
        it('returns isolate-arm on arm', () => {
            expect(getIsolateExecutableName('arm')).toBe('isolate-arm')
        })

        it('returns isolate-arm on arm64', () => {
            expect(getIsolateExecutableName('arm64')).toBe('isolate-arm')
        })

        it('returns isolate on x64', () => {
            expect(getIsolateExecutableName('x64')).toBe('isolate')
        })

        it('falls back to isolate for unknown archs', () => {
            expect(getIsolateExecutableName('ppc64' as NodeJS.Architecture)).toBe('isolate')
        })
    })
})
