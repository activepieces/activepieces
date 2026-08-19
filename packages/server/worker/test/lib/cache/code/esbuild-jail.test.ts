import { randomUUID } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { build } from 'esbuild'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { esbuildJail, OUTSIDE_STEP_FOLDER_MESSAGE } from '../../../../src/lib/cache/code/esbuild-jail'

const SECRET = `SECRET_${randomUUID()}`

let secretDir: string
const codePaths: string[] = []

beforeAll(() => {
    secretDir = mkdtempSync(path.join(tmpdir(), 'jail-secret-'))
    writeFileSync(path.join(secretDir, 'secret.txt'), SECRET)
    writeFileSync(path.join(secretDir, 'secret.json'), JSON.stringify({ token: SECRET }))
    writeFileSync(path.join(secretDir, 'secret.js'), `module.exports = ${JSON.stringify(SECRET)}`)
    writeFileSync(path.join(secretDir, 'noextension'), `${SECRET}\nbroken !! syntax\n`)
})

afterAll(() => {
    rmSync(secretDir, { recursive: true, force: true })
    for (const codePath of codePaths) {
        rmSync(codePath, { recursive: true, force: true })
    }
})

async function compile({ code, prepare }: CompileParams): Promise<CompileResult> {
    const codePath = mkdtempSync(path.join(tmpdir(), 'jail-code-'))
    codePaths.push(codePath)
    mkdirSync(path.join(codePath, 'node_modules'), { recursive: true })
    prepare?.(codePath)
    writeFileSync(path.join(codePath, 'index.ts'), code)
    const outputFile = path.join(codePath, 'index.js')
    try {
        await build({
            entryPoints: [path.join(codePath, 'index.ts')],
            bundle: true,
            platform: 'node',
            format: 'cjs',
            outfile: outputFile,
            absWorkingDir: codePath,
            logLevel: 'silent',
            plugins: [esbuildJail(codePath)],
        })
        return { built: true, bundle: readFileSync(outputFile, 'utf8'), error: '' }
    }
    catch (error) {
        const messages = (error as { errors?: { text: string, location?: { lineText?: string } }[] }).errors ?? []
        return {
            built: false,
            bundle: '',
            error: messages.map((message) => `${message.text} ${message.location?.lineText ?? ''}`).join(' | '),
        }
    }
}

function addLocalPackage({ codePath, name, value }: AddLocalPackageParams): void {
    const packageDir = path.join(codePath, 'node_modules', name)
    mkdirSync(packageDir, { recursive: true })
    writeFileSync(path.join(packageDir, 'package.json'), JSON.stringify({ name, main: 'index.js' }))
    writeFileSync(path.join(packageDir, 'index.js'), `module.exports = ${JSON.stringify(value)}`)
}

describe('esbuildJail blocks reads outside the step folder', () => {
    it.each([
        ['absolute text file', (dir: string) => `export const code = async () => await import('${dir}/secret.txt')`],
        ['absolute json file', (dir: string) => `import x from '${dir}/secret.json'; export const code = async () => x`],
        ['absolute js module', (dir: string) => `import x from '${dir}/secret.js'; export const code = async () => x`],
        ['extensionless file', (dir: string) => `import '${dir}/noextension'; export const code = async () => 1`],
        ['require call', (dir: string) => `const x = require('${dir}/secret.json'); export const code = async () => x`],
        ['export star', (dir: string) => `export * from '${dir}/secret.json'; export const code = async () => 1`],
    ])('blocks %s', async (_label, makeCode) => {
        const result = await compile({ code: makeCode(secretDir) })
        expect(result.built).toBe(false)
        expect(result.error).toContain(OUTSIDE_STEP_FOLDER_MESSAGE)
        expect(result.error).not.toContain(SECRET)
    })

    it('blocks a concatenated dynamic import, which esbuild constant-folds', async () => {
        const result = await compile({
            code: `export const code = async () => await import('${secretDir}/secret' + '.json')`,
        })
        expect(result.built).toBe(false)
        expect(result.error).toContain(OUTSIDE_STEP_FOLDER_MESSAGE)
        expect(result.error).not.toContain(SECRET)
    })

    it('blocks a relative traversal that escapes the step folder', async () => {
        const escape = '../'.repeat(24) + secretDir.replace(/^\//, '') + '/secret.json'
        const result = await compile({ code: `export const code = async () => await import('${escape}')` })
        expect(result.built).toBe(false)
        expect(result.error).toContain(OUTSIDE_STEP_FOLDER_MESSAGE)
        expect(result.error).not.toContain(SECRET)
    })

    it('blocks a symlink inside the step folder that points outside', async () => {
        const result = await compile({
            code: 'import s from \'./leak.js\'; export const code = async () => ({ s })',
            prepare: (codePath) => symlinkSync(path.join(secretDir, 'secret.js'), path.join(codePath, 'leak.js')),
        })
        expect(result.built).toBe(false)
        expect(result.error).toContain(OUTSIDE_STEP_FOLDER_MESSAGE)
        expect(result.bundle).not.toContain(SECRET)
    })

    it('blocks a node_modules package whose entry point escapes the step folder', async () => {
        const result = await compile({
            code: 'import s from \'evil\'; export const code = async () => ({ s })',
            prepare: (codePath) => {
                const packageDir = path.join(codePath, 'node_modules', 'evil')
                mkdirSync(packageDir, { recursive: true })
                writeFileSync(
                    path.join(packageDir, 'package.json'),
                    JSON.stringify({ name: 'evil', main: path.join(secretDir, 'secret.js') }),
                )
            },
        })
        expect(result.built).toBe(false)
        expect(result.bundle).not.toContain(SECRET)
        expect(result.error).not.toContain(SECRET)
    })

    it('blocks a node_modules file that is a symlink to a file outside, as bun creates for file: deps', async () => {
        const result = await compile({
            code: 'import s from \'linked/secret.json\'; export const code = async () => ({ s })',
            prepare: (codePath) => {
                const packageDir = path.join(codePath, 'node_modules', 'linked')
                mkdirSync(packageDir, { recursive: true })
                writeFileSync(path.join(packageDir, 'package.json'), JSON.stringify({ name: 'linked' }))
                symlinkSync(path.join(secretDir, 'secret.json'), path.join(packageDir, 'secret.json'))
            },
        })
        expect(result.built).toBe(false)
        expect(result.bundle).not.toContain(SECRET)
        expect(result.error).not.toContain(SECRET)
    })
})

describe('esbuildJail allows legitimate imports', () => {
    it.each([
        ['a bare node builtin', 'import crypto from \'crypto\'; export const code = async () => crypto.randomUUID()'],
        ['a node: prefixed builtin', 'import fs from \'node:fs\'; export const code = async () => typeof fs'],
        ['a node: prefixed path builtin', 'import p from \'node:path\'; export const code = async () => p.sep'],
        ['code with no imports', 'export const code = async (inputs) => ({ ok: true })'],
    ])('allows %s', async (_label, code) => {
        const result = await compile({ code })
        expect(result.error).toBe('')
        expect(result.built).toBe(true)
    })

    it('allows a dependency installed inside the step folder', async () => {
        const result = await compile({
            code: 'import s from \'friendly\'; export const code = async () => ({ s })',
            prepare: (codePath) => addLocalPackage({ codePath, name: 'friendly', value: 'friendly-value' }),
        })
        expect(result.built).toBe(true)
        expect(result.bundle).toContain('friendly-value')
    })

    it('allows a scoped dependency installed inside the step folder', async () => {
        const result = await compile({
            code: 'import s from \'@scope/pkg\'; export const code = async () => ({ s })',
            prepare: (codePath) => addLocalPackage({ codePath, name: '@scope/pkg', value: 'scoped-value' }),
        })
        expect(result.built).toBe(true)
        expect(result.bundle).toContain('scoped-value')
    })

    it('allows a relative import that stays inside the step folder', async () => {
        const result = await compile({
            code: 'import s from \'./helper\'; export const code = async () => ({ s })',
            prepare: (codePath) => writeFileSync(path.join(codePath, 'helper.ts'), 'export default 42'),
        })
        expect(result.built).toBe(true)
        expect(result.bundle).toContain('42')
    })
})

type CompileParams = {
    code: string
    prepare?: (codePath: string) => void
}

type CompileResult = {
    built: boolean
    bundle: string
    error: string
}

type AddLocalPackageParams = {
    codePath: string
    name: string
    value: string
}
