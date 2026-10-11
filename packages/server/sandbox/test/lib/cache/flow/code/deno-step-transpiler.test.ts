import path from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'

process.env.AP_DENO_PATH = path.join(path.dirname(require.resolve('deno/bin.cjs')), 'deno')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let denoStepTranspiler: any

beforeAll(async () => {
    const module = await import('../../../../../src/lib/cache/flow/code/deno-step-transpiler')
    denoStepTranspiler = module.denoStepTranspiler
})

describe('denoStepTranspiler', () => {
    it('transpiles an ESM step to CommonJS', async () => {
        const result = await denoStepTranspiler.toCommonJs({
            source: 'export const code = async (inputs: { a: number }) => inputs.a + 1',
        })
        expect(result.fallbackToEsm).toBeUndefined()
        expect(result.code).toContain('exports.')
        expect(result.code).not.toMatch(/^"use strict";/)
    })

    it('transpiles a source whose first statement is an undeclared assignment alongside an export', async () => {
        const result = await denoStepTranspiler.toCommonJs({
            source: 'cv = (x) => x;\nexport const code = async () => cv(1);',
        })
        expect(result.fallbackToEsm).toBeUndefined()
        expect(result.code).toContain('cv = ')
        expect(result.code).toContain('exports.')
    })

    it('falls back to ESM for top-level await', async () => {
        const result = await denoStepTranspiler.toCommonJs({
            source: 'const value = await Promise.resolve(1);\nexport const code = async () => value;',
        })
        expect(result).toEqual({ fallbackToEsm: true })
    })

    it('falls back to ESM when the source cannot be transpiled at all', async () => {
        const result = await denoStepTranspiler.toCommonJs({
            source: 'export const code = async () => { const htmlInput = <center>broken</div>; }',
        })
        expect(result).toEqual({ fallbackToEsm: true })
    })
})
