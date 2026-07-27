import { unlink, writeFile } from 'node:fs/promises'
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
            const source = 'module.exports = { code: async (inputs) => inputs }'
            const result = await runWithSource(source, { key: 'value' })
            expect(result).toEqual({ key: 'value' })
        })

        it('executes exports.code pattern (esbuild assignment style)', async () => {
            const source = 'exports.code = async (inputs) => ({ doubled: inputs.n * 2 })'
            const result = await runWithSource(source, { n: 3 })
            expect(result).toEqual({ doubled: 6 })
        })

        it('makes inputs accessible inside the code function', async () => {
            const source = 'module.exports = { code: async (inputs) => inputs.greeting }'
            const result = await runWithSource(source, { greeting: 'hello' })
            expect(result).toBe('hello')
        })

        it('supports async/await inside the code function', async () => {
            const source = 'module.exports = { code: async () => { const v = await Promise.resolve(42); return v } }'
            const result = await runWithSource(source)
            expect(result).toBe(42)
        })

        it('propagates user errors thrown inside code', async () => {
            const source = 'module.exports = { code: async () => { throw new Error(\'user error\') } }'
            await expect(runWithSource(source)).rejects.toThrow('user error')
        })

        // --- sandbox boundary ---

        it('blocks top-level require (ReferenceError)', async () => {
            const source = 'const cp = require(\'child_process\'); module.exports = { code: async () => null }'
            await expect(runWithSource(source)).rejects.toThrow(/require/)
        })

        it('blocks require inside the code function (ReferenceError)', async () => {
            const source = 'module.exports = { code: async () => { require(\'fs\'); return null } }'
            await expect(runWithSource(source)).rejects.toThrow(/require/)
        })

        it('blocks access to the process global (ReferenceError)', async () => {
            const source = 'module.exports = { code: async () => process.env }'
            await expect(runWithSource(source)).rejects.toThrow(/process/)
        })

        // --- memory limit (128 MB isolate cap) ---
        //
        // Reproduces the "Apply Watermark" incident: a code step that decodes a full-resolution
        // photo into a raw RGBA bitmap exceeds the hardcoded 128 MB isolate cap and the step fails
        // with an out-of-memory error. This is a regression baseline — when the engine's handling of
        // this changes (e.g. a configurable limit, or clearer error classification), update the
        // assertions here and diff the behaviour. An image's decoded size is width*height*4 bytes and
        // is independent of the compressed file size; we allocate raw byte buffers as the faithful,
        // dependency-free stand-in for what Jimp/sharp hold in memory.

        // Allocates `megabytes` MB inside the isolate in ~16 MB chunks (filled so pages are actually
        // committed), mimicking decode + watermark-composite working set.
        const imageWorkloadSource = (megabytes: number): string => `
            module.exports = {
                code: async () => {
                    const CHUNK_MB = 16
                    const chunks = []
                    let allocatedMb = 0
                    while (allocatedMb < ${megabytes}) {
                        chunks.push(new Uint8Array(CHUNK_MB * 1024 * 1024).fill(allocatedMb & 0xff))
                        allocatedMb += CHUNK_MB
                    }
                    return { allocatedMb }
                },
            }`

        it('succeeds when the working set fits under the 128 MB cap (~48 MB image)', async () => {
            const result = await runWithSource(imageWorkloadSource(48))
            expect(result).toEqual({ allocatedMb: 48 })
        })

        it('fails with an out-of-memory error when the working set exceeds the 128 MB cap (~512 MB image)', async () => {
            // Baseline today: the OOM surfaces as a raw V8 `RangeError: Array buffer allocation failed`
            // from inside the isolate — it is NOT classified as a memory-limit error here (that mapping
            // only happens at the outer sandbox process-exit layer for a SIGKILL). The broad matcher
            // stays green if a fix wraps it in a clearer "memory limit exceeded" message, but breaks
            // loudly if the allocation starts SUCCEEDING (e.g. the 128 MB cap is raised) — which is the
            // signal to re-baseline this test against the new behaviour.
            await expect(runWithSource(imageWorkloadSource(512))).rejects.toThrow(
                /Array buffer allocation failed|out of memory|memory limit/i,
            )
        }, 30_000)
    })
})
