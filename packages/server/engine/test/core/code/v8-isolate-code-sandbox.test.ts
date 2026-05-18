import { writeFile, unlink } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { v8IsolateCodeSandbox } from '../../../src/lib/core/code/v8-isolate-code-sandbox'

describe('v8IsolateCodeSandbox', () => {
    describe('runCodeModule', () => {
        let tmpFile: string

        beforeEach(() => {
            tmpFile = path.join(os.tmpdir(), `v8-sandbox-test-${Date.now()}.js`)
        })

        afterEach(async () => {
            await unlink(tmpFile).catch(() => undefined)
        })

        async function runWithSource(source: string, inputs: Record<string, unknown> = {}): Promise<unknown> {
            await writeFile(tmpFile, source, 'utf8')
            return v8IsolateCodeSandbox.runCodeModule({ codeFilePath: tmpFile, inputs })
        }

        // --- correct execution ---

        it('executes module.exports.code and returns inputs', async () => {
            const source = `module.exports = { code: async (inputs) => inputs }`
            const result = await runWithSource(source, { key: 'value' })
            expect(result).toEqual({ key: 'value' })
        })

        it('executes exports.code pattern (esbuild assignment style)', async () => {
            const source = `exports.code = async (inputs) => ({ doubled: inputs.n * 2 })`
            const result = await runWithSource(source, { n: 3 })
            expect(result).toEqual({ doubled: 6 })
        })

        it('makes inputs accessible inside the code function', async () => {
            const source = `module.exports = { code: async (inputs) => inputs.greeting }`
            const result = await runWithSource(source, { greeting: 'hello' })
            expect(result).toBe('hello')
        })

        it('supports async/await inside the code function', async () => {
            const source = `module.exports = { code: async () => { const v = await Promise.resolve(42); return v } }`
            const result = await runWithSource(source)
            expect(result).toBe(42)
        })

        it('propagates user errors thrown inside code', async () => {
            const source = `module.exports = { code: async () => { throw new Error('user error') } }`
            await expect(runWithSource(source)).rejects.toThrow('user error')
        })

        // --- sandbox boundary ---

        it('blocks top-level require (ReferenceError)', async () => {
            const source = `const cp = require('child_process'); module.exports = { code: async () => null }`
            await expect(runWithSource(source)).rejects.toThrow(/require/)
        })

        it('blocks require inside the code function (ReferenceError)', async () => {
            const source = `module.exports = { code: async () => { require('fs'); return null } }`
            await expect(runWithSource(source)).rejects.toThrow(/require/)
        })

        it('blocks access to the process global (ReferenceError)', async () => {
            const source = `module.exports = { code: async () => process.env }`
            await expect(runWithSource(source)).rejects.toThrow(/process/)
        })
    })
})
