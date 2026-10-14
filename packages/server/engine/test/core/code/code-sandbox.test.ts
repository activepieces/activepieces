import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'

process.env.AP_DENO_PATH = path.join(path.dirname(require.resolve('deno/bin.cjs')), 'deno')

async function loadSandboxModule(executionMode: string) {
    vi.resetModules()
    process.env.AP_EXECUTION_MODE = executionMode
    return import('../../../src/lib/core/code/code-sandbox')
}

describe('initCodeSandbox selection', () => {
    it.each(['UNSANDBOXED', 'SANDBOX_PROCESS', 'SANDBOX_CODE_ONLY', 'SANDBOX_CODE_AND_PROCESS'])('returns the deno sandbox in %s mode', async (mode) => {
        const { initCodeSandbox } = await loadSandboxModule(mode)
        const sandbox = await initCodeSandbox()
        expect(typeof sandbox.runCodeModule).toBe('function')
        expect(typeof sandbox.runScript).toBe('function')
    })

    it('caches a single instance', async () => {
        const { initCodeSandbox } = await loadSandboxModule('UNSANDBOXED')
        const first = await initCodeSandbox()
        expect(await initCodeSandbox()).toBe(first)
    })

    it('throws when the execution mode is missing', async () => {
        vi.resetModules()
        delete process.env.AP_EXECUTION_MODE
        const { initCodeSandbox } = await import('../../../src/lib/core/code/code-sandbox')
        await expect(initCodeSandbox()).rejects.toThrow('AP_EXECUTION_MODE')
    })

    it('throws on an invalid execution mode', async () => {
        const { initCodeSandbox } = await loadSandboxModule('NOT_A_MODE')
        await expect(initCodeSandbox()).rejects.toThrow('Invalid AP_EXECUTION_MODE')
    })
})
