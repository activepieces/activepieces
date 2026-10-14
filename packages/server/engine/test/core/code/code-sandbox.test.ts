import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'

process.env.AP_DENO_PATH = path.join(path.dirname(require.resolve('deno/bin.cjs')), 'deno')

async function loadSandboxModule(executionMode: string) {
    vi.resetModules()
    process.env.AP_EXECUTION_MODE = executionMode
    return import('../../../src/lib/core/code/code-sandbox')
}

async function loadLegacySandboxes() {
    const noOp = (await import('../../../src/lib/core/code/no-op-code-sandbox')).noOpCodeSandbox
    const v8Isolate = (await import('../../../src/lib/core/code/v8-isolate-code-sandbox')).v8IsolateCodeSandbox
    return { noOp, v8Isolate }
}

describe('initCodeSandbox selection', () => {
    it.each(['UNSANDBOXED', 'SANDBOX_PROCESS'])('useDeno=false in %s mode returns the no-op sandbox', async (mode) => {
        const { initCodeSandbox } = await loadSandboxModule(mode)
        const { noOp } = await loadLegacySandboxes()
        const sandbox = await initCodeSandbox({ useDeno: false })
        expect(sandbox).toBe(noOp)
    })

    it.each(['SANDBOX_CODE_ONLY', 'SANDBOX_CODE_AND_PROCESS'])('useDeno=false in %s mode returns the v8 isolate sandbox', async (mode) => {
        const { initCodeSandbox } = await loadSandboxModule(mode)
        const { v8Isolate } = await loadLegacySandboxes()
        const sandbox = await initCodeSandbox({ useDeno: false })
        expect(sandbox).toBe(v8Isolate)
    })

    it.each(['UNSANDBOXED', 'SANDBOX_PROCESS', 'SANDBOX_CODE_ONLY', 'SANDBOX_CODE_AND_PROCESS'])('useDeno=true in %s mode returns the deno sandbox', async (mode) => {
        const { initCodeSandbox } = await loadSandboxModule(mode)
        const { noOp, v8Isolate } = await loadLegacySandboxes()
        const sandbox = await initCodeSandbox({ useDeno: true })
        expect(sandbox).not.toBe(noOp)
        expect(sandbox).not.toBe(v8Isolate)
    })

    it('caches one instance per kind without mixing them', async () => {
        const { initCodeSandbox } = await loadSandboxModule('UNSANDBOXED')
        const denoSandbox = await initCodeSandbox({ useDeno: true })
        const legacySandbox = await initCodeSandbox({ useDeno: false })
        expect(denoSandbox).not.toBe(legacySandbox)
        expect(await initCodeSandbox({ useDeno: true })).toBe(denoSandbox)
        expect(await initCodeSandbox({ useDeno: false })).toBe(legacySandbox)
    })
})
