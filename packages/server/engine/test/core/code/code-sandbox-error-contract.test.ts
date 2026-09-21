import { unlink, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { inspect } from 'node:util'
import { apId, formatPieceError, FriendlyPieceError } from '@activepieces/core-utils'
import { CodeSandbox } from '../../../src/lib/core/code/code-sandbox-common'
import { denoCodeSandbox, DenoPermission } from '../../../src/lib/core/code/deno-code-sandbox'
import { noOpCodeSandbox } from '../../../src/lib/core/code/no-op-code-sandbox'
import { v8IsolateCodeSandbox } from '../../../src/lib/core/code/v8-isolate-code-sandbox'

const SANDBOXES: SandboxUnderTest[] = [
    { name: 'noOp', sandbox: noOpCodeSandbox, wrap: (body) => `exports.code = async () => { ${body} }`, extension: 'js' },
    { name: 'v8Isolate', sandbox: v8IsolateCodeSandbox, wrap: (body) => `exports.code = async () => { ${body} }`, extension: 'js' },
    { name: 'deno', sandbox: denoCodeSandbox([DenoPermission.NET]), wrap: (body) => `export const code = async () => { ${body} }`, extension: 'ts' },
]

const CHILD_PROCESS_SANDBOXES = SANDBOXES.filter((entry) => entry.name !== 'v8Isolate')

const THROWING_BODIES: ThrowingBody[] = [
    { label: 'a plain Error', body: 'throw new Error("Card declined")', message: 'Card declined' },
    { label: 'a subclassed Error', body: 'null.x', message: "Cannot read properties of null (reading 'x')", errorName: 'TypeError' },
    { label: 'an Error carrying own properties', body: 'const e = new Error("Card declined"); e.code = "X"; throw e', message: 'Card declined' },
    { label: 'an Error whose message is JSON', body: 'throw new Error(JSON.stringify({ code: 42 }))', message: '{"code":42}' },
    { label: 'a thrown string', body: 'throw "boom"', message: 'boom' },
]

async function resolveStepError({ sandbox, wrap, extension, body }: ResolveStepErrorParams): Promise<FriendlyPieceError> {
    const codeFilePath = path.join(os.tmpdir(), `ap-error-contract-${apId()}.${extension}`)
    await writeFile(codeFilePath, wrap(body), 'utf8')
    try {
        await sandbox.runCodeModule({ codeFilePath, inputs: {} })
        throw new Error('expected the code step to fail')
    }
    catch (error) {
        return formatPieceError(error, { raw: inspect(error) })
    }
    finally {
        await unlink(codeFilePath).catch(() => undefined)
    }
}

describe('code sandbox error contract', () => {
    describe.each(THROWING_BODIES)('$label', ({ body, message, errorName }) => {
        it.each(SANDBOXES)('reads the same on $name', async ({ sandbox, wrap, extension }) => {
            const stepError = await resolveStepError({ sandbox, wrap, extension, body })

            expect(stepError.message).toBe(message)
            expect(stepError.errorName).toBe(errorName)
            expect(stepError.raw).toContain(message)
        })
    })

    it.each(CHILD_PROCESS_SANDBOXES)('keeps captured output out of the message on $name', async ({ sandbox, wrap, extension }) => {
        const stepError = await resolveStepError({ sandbox, wrap, extension, body: 'console.log("noisy"); throw new Error("Card declined")' })

        expect(stepError.message).toBe('Card declined')
        expect(stepError.raw).toContain('noisy')
    })

    it.each(CHILD_PROCESS_SANDBOXES)('falls back instead of losing the failure when reading the thrown value throws on $name', async ({ sandbox, wrap, extension }) => {
        const stepError = await resolveStepError({ sandbox, wrap, extension, body: 'const e = new Error("x"); Object.defineProperty(e, "message", { get() { throw new Error("nested") } }); throw e' })

        expect(stepError.message).toBe('Code execution failed')
    })
})

type SandboxUnderTest = {
    name: string
    sandbox: CodeSandbox
    wrap: (body: string) => string
    extension: string
}

type ThrowingBody = {
    label: string
    body: string
    message: string
    errorName?: string
}

type ResolveStepErrorParams = {
    sandbox: CodeSandbox
    wrap: (body: string) => string
    extension: string
    body: string
}
