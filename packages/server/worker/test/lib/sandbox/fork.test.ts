import { ChildProcess } from 'child_process'
import path from 'path'
import { describe, it, expect, afterEach } from 'vitest'
import { simpleProcess } from '../../../src/lib/sandbox/fork'

const fixturePath = path.resolve(__dirname, '../../fixtures/echo-env.js')
const children: ChildProcess[] = []

afterEach(() => {
    for (const child of children) {
        try { child.kill('SIGKILL') }
        catch { /* already dead */ }
    }
    children.length = 0
})

describe('simpleProcess', () => {
    it('forks real process with correct execArgv and env vars', async () => {
        const maker = simpleProcess(fixturePath, '/code-dir')

        const child = await maker.create({
            sandboxId: 'sb-fork-1',
            command: [],
            mounts: [],
            env: { CUSTOM_VAR: 'hello', AP_SANDBOX_WS_PORT: '9999' },
            resourceLimits: {
                memoryLimitMb: 512,
                cpuMsPerSec: 1000,
                timeLimitSeconds: 300,
            },
        })
        children.push(child)

        const msg = await new Promise<{ env: Record<string, string>, execArgv: string[] }>((resolve, reject) => {
            child.on('message', (m) => resolve(m as { env: Record<string, string>, execArgv: string[] }))
            child.on('error', reject)
            setTimeout(() => reject(new Error('timeout waiting for child message')), 10000)
        })

        expect(msg.execArgv).toContain('--no-node-snapshot')
        expect(msg.execArgv).toContain('--expose-gc')
        expect(msg.execArgv).toContain('--max-old-space-size=512')
        expect(msg.env.AP_BASE_CODE_DIRECTORY).toBe('/code-dir')
        expect(msg.env.SANDBOX_ID).toBe('sb-fork-1')
        expect(msg.env.CUSTOM_VAR).toBe('hello')
        expect(msg.env.AP_SANDBOX_WS_PORT).toBe('9999')
    }, 15000)

    it('passes through integer memoryLimitMb to --max-old-space-size', async () => {
        const maker = simpleProcess(fixturePath, '/code')

        const child = await maker.create({
            sandboxId: 'sb-fork-2',
            command: [],
            mounts: [],
            env: {},
            resourceLimits: {
                memoryLimitMb: 300,
                cpuMsPerSec: 1000,
                timeLimitSeconds: 60,
            },
        })
        children.push(child)

        const msg = await new Promise<{ env: Record<string, string>, execArgv: string[] }>((resolve, reject) => {
            child.on('message', (m) => resolve(m as { env: Record<string, string>, execArgv: string[] }))
            child.on('error', reject)
            setTimeout(() => reject(new Error('timeout waiting for child message')), 10000)
        })

        expect(msg.execArgv).toContain('--max-old-space-size=300')
    }, 15000)
})
