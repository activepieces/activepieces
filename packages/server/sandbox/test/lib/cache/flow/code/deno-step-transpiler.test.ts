import { mkdtemp, realpath, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

process.env.AP_DENO_PATH = path.join(path.dirname(require.resolve('deno/bin.cjs')), 'deno')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let denoStepTranspiler: any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let deno: any
let stepDir: string

beforeAll(async () => {
    const transpilerModule = await import('../../../../../src/lib/cache/flow/code/deno-step-transpiler')
    denoStepTranspiler = transpilerModule.denoStepTranspiler
    const coreUtils = await import('@activepieces/core-utils')
    deno = coreUtils.deno
    stepDir = await realpath(await mkdtemp(path.join(tmpdir(), 'ap-transpiler-test-')))
})

afterAll(async () => {
    await rm(stepDir, { recursive: true, force: true })
})

async function runTranspiledAsCommonJs(code: string): Promise<unknown> {
    const cjsPath = path.join(stepDir, 'index.cjs')
    await writeFile(cjsPath, code)
    return deno.run({
        body: `
    const { createRequire } = await import('node:module');
    const mod = createRequire(${JSON.stringify(cjsPath)})(${JSON.stringify(cjsPath)});
    const result = await mod.code();
`,
        permissions: [],
        cwd: stepDir,
        allowReadPaths: [stepDir],
    })
}

describe('denoStepTranspiler', () => {
    it('transpiles an ESM step to CommonJS', async () => {
        const result = await denoStepTranspiler.toCommonJs({
            source: 'export const code = async (inputs: { a: number }) => inputs.a + 1',
        })
        expect(result.fallbackToEsm).toBeUndefined()
        expect(result.code).toContain('exports.')
        expect(result.code).not.toMatch(/^"use strict";/)
    })

    it('transpiles a source whose first statement is an undeclared assignment alongside an export, and the output runs', async () => {
        const result = await denoStepTranspiler.toCommonJs({
            source: 'cv = (x) => x;\nexport const code = async () => cv(1);',
        })
        expect(result.fallbackToEsm).toBeUndefined()
        await expect(runTranspiledAsCommonJs(result.code)).resolves.toBe(1)
    })

    it('falls back to ESM for top-level await, reporting why', async () => {
        const result = await denoStepTranspiler.toCommonJs({
            source: 'const value = await Promise.resolve(1);\nexport const code = async () => value;',
        })
        expect(result.fallbackToEsm).toBe(true)
        expect(result.code).toBeUndefined()
        expect(result.error).toMatch(/await/)
    })

    it('falls back to ESM when the source cannot be transpiled at all, reporting the transform error', async () => {
        const result = await denoStepTranspiler.toCommonJs({
            source: 'export const code = async () => { const htmlInput = <center>broken</div>; }',
        })
        expect(result.fallbackToEsm).toBe(true)
        expect(result.code).toBeUndefined()
        expect(typeof result.error).toBe('string')
        expect(result.error.length).toBeGreaterThan(0)
    })
})
