import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { inspect } from 'node:util'
import { DenoPermission, formatPieceError, FriendlyPieceError } from '@activepieces/core-utils'
import { CodeSandbox } from '../../../src/lib/core/code/code-sandbox-common'
import { denoCodeSandbox } from '../../../src/lib/core/code/deno-code-sandbox'
import { noOpCodeSandbox } from '../../../src/lib/core/code/no-op-code-sandbox'
import { v8IsolateCodeSandbox } from '../../../src/lib/core/code/v8-isolate-code-sandbox'

const deno = denoCodeSandbox([DenoPermission.READ_TMP, DenoPermission.WRITE_TMP])

let directory: string

async function codeFile({ name, source }: { name: string, source: string }): Promise<string> {
    const filePath = path.join(directory, `${name}.js`)
    await writeFile(filePath, source)
    return filePath
}

async function failureOf({ sandbox, codeFilePath }: { sandbox: CodeSandbox, codeFilePath: string }): Promise<FriendlyPieceError> {
    try {
        await sandbox.runCodeModule({ codeFilePath, inputs: {} })
    }
    catch (error) {
        return formatPieceError(error, { raw: inspect(error) })
    }
    throw new Error('expected the code module to throw')
}

beforeAll(async () => {
    directory = await mkdtemp(path.join(tmpdir(), 'ap-code-error-shape-'))
})

describe('a code step error reads the same in every sandbox', () => {
    it('reports a thrown Error with no "Error: " prefix', async () => {
        const commonjs = await codeFile({ name: 'plain', source: 'exports.code = async () => { throw new Error("Card declined") }' })
        const esm = await codeFile({ name: 'plain-esm', source: 'export const code = async () => { throw new Error("Card declined") }' })

        expect((await failureOf({ sandbox: noOpCodeSandbox, codeFilePath: commonjs })).message).toBe('Card declined')
        expect((await failureOf({ sandbox: v8IsolateCodeSandbox, codeFilePath: commonjs })).message).toBe('Card declined')
        expect((await failureOf({ sandbox: deno, codeFilePath: esm })).message).toBe('Card declined')
    })

    it('carries the error class as errorName instead of smearing it into the message', async () => {
        const commonjs = await codeFile({ name: 'typeerror', source: 'exports.code = async () => { null.foo() }' })
        const esm = await codeFile({ name: 'typeerror-esm', source: 'export const code = async () => { null.foo() }' })

        for (const failure of [
            await failureOf({ sandbox: noOpCodeSandbox, codeFilePath: commonjs }),
            await failureOf({ sandbox: v8IsolateCodeSandbox, codeFilePath: commonjs }),
            await failureOf({ sandbox: deno, codeFilePath: esm }),
        ]) {
            expect(failure.errorName).toBe('TypeError')
            expect(failure.message).not.toMatch(/^TypeError: /)
        }
    })

    it('drops own properties instead of appending a mangled inspect dump', async () => {
        const codeFilePath = await codeFile({
            name: 'props',
            source: 'exports.code = async () => { const e = new Error("Card declined"); e.code = "CARD_DECLINED"; throw e }',
        })

        expect((await failureOf({ sandbox: noOpCodeSandbox, codeFilePath })).message).toBe('Card declined')
        expect((await failureOf({ sandbox: v8IsolateCodeSandbox, codeFilePath })).message).toBe('Card declined')
    })

    it('keeps a JSON payload thrown as the message parseable without stripping a prefix', async () => {
        const codeFilePath = await codeFile({
            name: 'json',
            source: 'exports.code = async () => { throw new Error(JSON.stringify({ code: "CARD_DECLINED" })) }',
        })

        const { message } = await failureOf({ sandbox: noOpCodeSandbox, codeFilePath })

        expect(JSON.parse(message)).toEqual({ code: 'CARD_DECLINED' })
    })

    it('still describes a rejected promise', async () => {
        const codeFilePath = await codeFile({ name: 'rejection', source: 'exports.code = async () => Promise.reject(new Error("Card declined"))' })

        expect((await failureOf({ sandbox: noOpCodeSandbox, codeFilePath })).message).toBe('Card declined')
    })

    it('falls back to inspect for a thrown value that is not an Error', async () => {
        const thrownString = await codeFile({ name: 'string', source: 'exports.code = async () => { throw "boom" }' })
        const thrownObject = await codeFile({ name: 'object', source: 'exports.code = async () => { throw { code: "CARD_DECLINED" } }' })

        expect((await failureOf({ sandbox: noOpCodeSandbox, codeFilePath: thrownString })).message).toBe("'boom'")
        expect((await failureOf({ sandbox: noOpCodeSandbox, codeFilePath: thrownObject })).message).toContain('CARD_DECLINED')
    })

    it('keeps the user code frame reachable for debugging', async () => {
        const codeFilePath = await codeFile({ name: 'frame', source: 'exports.code = async () => { throw new Error("Card declined") }' })

        const { raw } = await failureOf({ sandbox: noOpCodeSandbox, codeFilePath })

        expect(raw).toContain('frame.js')
    })
})
