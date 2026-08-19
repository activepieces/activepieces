import { randomUUID } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { FlowVersionState } from '@activepieces/shared'
import type { Logger } from 'pino'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('../../../../src/lib/config/worker-settings', () => ({
    workerSettings: {
        getSettings: () => ({
            EXECUTION_MODE: 'SANDBOX_CODE_ONLY',
            DEV_PIECES: [],
        }),
    },
}))

const { codeBuilder } = await import('../../../../src/lib/cache/code/code-builder')

const SECRET = `SECRET_${randomUUID()}`

const log = {
    debug: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
} as unknown as Logger

let secretDir: string
let codesFolder: string

async function buildStep(code: string, packageJson = '{}'): Promise<BuiltStep> {
    const flowVersionId = `fv_${randomUUID().replace(/-/g, '').slice(0, 12)}`
    const name = 'step_one'
    await codeBuilder(log).processCodeStep({
        codesFolderPath: codesFolder,
        artifact: {
            name,
            sourceCode: { code, packageJson },
            flowVersionId,
            flowVersionState: FlowVersionState.DRAFT,
        },
    })
    const stepDir = path.join(codesFolder, flowVersionId, name)
    return {
        artifact: readFileSync(path.join(stepDir, 'index.js'), 'utf8'),
        generatedPackageJson: readFileSync(path.join(stepDir, 'package.json'), 'utf8'),
    }
}

function executeLikeIsolate({ artifact, inputs }: ExecuteParams): Promise<unknown> {
    const body = `const exports = Object.create(null); const module = { exports };\n${artifact}\nreturn module.exports.code(inputs);`
    return Promise.resolve().then(() => new Function('inputs', 'require', body)(inputs, undefined))
}

beforeAll(() => {
    secretDir = mkdtempSync(path.join(tmpdir(), 'code-builder-secret-'))
    codesFolder = mkdtempSync(path.join(tmpdir(), 'code-builder-codes-'))
    writeFileSync(path.join(secretDir, 'creds.json'), JSON.stringify({ token: SECRET }))
    writeFileSync(path.join(secretDir, 'creds.txt'), SECRET)
    writeFileSync(path.join(secretDir, 'environ'), `PATHV=/usr/local/bin\0AP_WORKER_TOKEN=${SECRET}\0`)
    writeFileSync(path.join(secretDir, 'weird`${x}.js'), `module.exports = ${JSON.stringify(SECRET)}`)
})

afterAll(() => {
    rmSync(secretDir, { recursive: true, force: true })
    rmSync(codesFolder, { recursive: true, force: true })
})

describe('codeBuilder compiles and runs a step', () => {
    it('produces an artifact the isolate wrapper can execute', async () => {
        const { artifact } = await buildStep('export const code = async (inputs) => ({ doubled: inputs.a * 2 })')
        await expect(executeLikeIsolate({ artifact, inputs: { a: 21 } })).resolves.toEqual({ doubled: 42 })
    })

    it('reports a syntax error in the step source with its location', async () => {
        const { artifact } = await buildStep('export const code = async () => { this is not valid }')
        const message = await executeLikeIsolate({ artifact, inputs: {} }).then(() => '', (error: Error) => error.message)
        expect(message).toContain('Compilation Error')
        expect(message).toMatch(/index\.ts:\d+:\d+/)
    })

    it('strips every dependency when the execution mode disallows packages', async () => {
        const { generatedPackageJson } = await buildStep(
            'export const code = async () => 1',
            JSON.stringify({ dependencies: { lodash: '4.17.21' }, overrides: { lodash: 'file:/etc' } }),
        )
        expect(JSON.parse(generatedPackageJson)).toEqual({ dependencies: {} })
    })
})

describe('codeBuilder refuses to read outside the step folder', () => {
    it.each([
        ['the reported proc environ payload', (dir: string) => `export const code = async () => { const data = await import('/usr/..${dir}/../${path.basename(dir)}/environ'); return { data } }`],
        ['a json file, which esbuild would inline in full', (dir: string) => `import c from '${dir}/creds.json'; export const code = async () => c`],
        ['a txt file, which esbuild would inline in full', (dir: string) => `import c from '${dir}/creds.txt'; export const code = async () => c`],
        ['a concatenated dynamic import', (dir: string) => `export const code = async () => await import('${dir}/creds' + '.json')`],
    ])('blocks %s', async (_label, makeCode) => {
        const { artifact } = await buildStep(makeCode(secretDir))
        expect(artifact).not.toContain(SECRET)
        expect(artifact).not.toContain('PATHV')
        const message = await executeLikeIsolate({ artifact, inputs: {} }).then(() => '', (error: Error) => error.message)
        expect(message).toContain('Importing files outside the step folder is not allowed')
    })

    it('writes a runnable artifact even when the blocked path contains backticks and template syntax', async () => {
        const weirdPath = path.join(secretDir, 'weird`${x}.js')
        const { artifact } = await buildStep(`import s from ${JSON.stringify(weirdPath)}; export const code = async () => s`)
        expect(artifact).not.toContain(SECRET)
        const message = await executeLikeIsolate({ artifact, inputs: {} }).then(() => '', (error: Error) => error.message)
        expect(message).toContain('Importing files outside the step folder is not allowed')
    })
})

type BuiltStep = {
    artifact: string
    generatedPackageJson: string
}

type ExecuteParams = {
    artifact: string
    inputs: unknown
}
