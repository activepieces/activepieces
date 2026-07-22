import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

// Resolve the deno binary shipped by the `deno` npm devDependency so the test
// does not depend on a system-wide install / PATH.
process.env.AP_DENO_PATH = path.join(path.dirname(require.resolve('deno/bin.cjs')), 'deno')

let stepDir: string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let denoCodeSandbox: any

beforeAll(async () => {
    // Dynamic import so AP_DENO_PATH is set before the module reads it.
    ;({ denoCodeSandbox } = await import('../../../src/lib/core/code/deno-code-sandbox'))
    stepDir = await mkdtemp(path.join(tmpdir(), 'ap-deno-test-'))
})

afterAll(async () => {
    await rm(stepDir, { recursive: true, force: true })
})

async function runModule(source: string, inputs: Record<string, unknown> = {}): Promise<unknown> {
    const codeFilePath = path.join(stepDir, 'index.js')
    await writeFile(codeFilePath, source)
    return denoCodeSandbox.runCodeModule({ codeFilePath, inputs })
}

const PERMISSION_DENIED = /NotCapable|PermissionDenied/

describe('denoCodeSandbox permission boundary', () => {
    describe('blocks unpermitted operations', () => {
        it('rejects outbound network access', async () => {
            await expect(runModule(`exports.code = async () => (await fetch('https://example.com')).status`))
                .rejects.toThrow(PERMISSION_DENIED)
        })

        it('rejects reading a file outside the step directory', async () => {
            await expect(runModule(`exports.code = async () => Deno.readTextFile('/etc/hosts')`))
                .rejects.toThrow(PERMISSION_DENIED)
        })

        it('rejects reading environment variables', async () => {
            await expect(runModule(`exports.code = async () => Deno.env.toObject()`))
                .rejects.toThrow(PERMISSION_DENIED)
        })

        it('rejects the symlink escape (link inside dir -> outside, read through it)', async () => {
            await expect(runModule(`exports.code = async () => {
                await Deno.symlink('/etc/passwd', './escape')
                return Deno.readTextFile('./escape')
            }`)).rejects.toThrow(PERMISSION_DENIED)
        })

        it('rejects spawning a subprocess', async () => {
            await expect(runModule(`exports.code = async () => {
                const out = await new Deno.Command('sh', { args: ['-c', 'id'] }).output()
                return new TextDecoder().decode(out.stdout)
            }`)).rejects.toThrow(PERMISSION_DENIED)
        })

        it('rejects writing outside the step directory', async () => {
            await expect(runModule(`exports.code = async () => Deno.writeTextFile('/tmp/ap-pwned.txt', 'hi')`))
                .rejects.toThrow(PERMISSION_DENIED)
        })

        it('rejects path traversal out of the step directory', async () => {
            await expect(runModule(`exports.code = async () => Deno.readTextFile('../../../../etc/hosts')`))
                .rejects.toThrow(PERMISSION_DENIED)
        })
    })

    describe('allows permitted operations', () => {
        it('runs pure compute over inputs', async () => {
            const result = await runModule(`exports.code = async (inputs) => ({ doubled: inputs.n * 2 })`, { n: 21 })
            expect(result).toEqual({ doubled: 42 })
        })

        it('reads and writes files inside the step directory', async () => {
            const result = await runModule(`exports.code = async (inputs) => {
                await Deno.writeTextFile('./data.json', JSON.stringify(inputs))
                return JSON.parse(await Deno.readTextFile('./data.json'))
            }`, { hello: 'world' })
            expect(result).toEqual({ hello: 'world' })
        })

        it('surfaces user thrown errors', async () => {
            await expect(runModule(`exports.code = async () => { throw new Error('boom') }`))
                .rejects.toThrow(/boom/)
        })
    })

    describe('runScript', () => {
        it('evaluates an expression with context', async () => {
            const result = await denoCodeSandbox.runScript({ script: '1 + a', scriptContext: { a: 41 }, functions: {} })
            expect(result).toBe(42)
        })

        it('resolves an async expression', async () => {
            const result = await denoCodeSandbox.runScript({ script: 'Promise.resolve(7)', scriptContext: {}, functions: {} })
            expect(result).toBe(7)
        })

        it('runs without any permissions (network blocked)', async () => {
            await expect(denoCodeSandbox.runScript({ script: `fetch('https://example.com')`, scriptContext: {}, functions: {} }))
                .rejects.toThrow(PERMISSION_DENIED)
        })
    })
})
