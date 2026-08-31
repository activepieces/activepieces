import { randomUUID } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { build } from 'esbuild'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { stepFolderResolvePlugin, IMPORT_OUT_OF_SCOPE_MESSAGE } from '../../../src/lib/utils/esbuild-build-options'

const SECRET = `SECRET_${randomUUID()}`
let secretDir: string
const codePaths: string[] = []

beforeAll(() => {
    secretDir = mkdtempSync(path.join(tmpdir(), 'jail-secret-'))
    writeFileSync(path.join(secretDir, 'secret.txt'), SECRET)
    writeFileSync(path.join(secretDir, 'secret.json'), JSON.stringify({ token: SECRET }))
    writeFileSync(path.join(secretDir, 'secret.js'), `module.exports = ${JSON.stringify(SECRET)}`)
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
    const outFile = path.join(codePath, 'index.js')
    try {
        await build({
            entryPoints: [path.join(codePath, 'index.ts')],
            bundle: true,
            platform: 'node',
            format: 'cjs',
            outfile: outFile,
            absWorkingDir: codePath,
            logLevel: 'silent',
            plugins: [stepFolderResolvePlugin(codePath)],
        })
        return { built: true, bundle: readFileSync(outFile, 'utf8'), error: '' }
    }
    catch (error) {
        const errors = (error as { errors?: { text: string, location?: { lineText?: string } }[] }).errors ?? []
        const message = errors.map((e) => `${e.text} ${e.location?.lineText ?? ''}`).join(' | ')
        return { built: false, bundle: '', error: message }
    }
}

describe('stepFolderResolvePlugin', () => {
    it('blocks an absolute import of a file outside the step folder', async () => {
        const result = await compile({ code: `export const code = async () => await import('${secretDir}/secret.txt')` })
        expect(result.built).toBe(false)
        expect(result.error).toContain(IMPORT_OUT_OF_SCOPE_MESSAGE)
        expect(result.error).not.toContain(SECRET)
    })

    it('blocks a relative-traversal import that escapes the step folder', async () => {
        const escape = '../'.repeat(24) + secretDir.replace(/^\//, '') + '/secret.json'
        const result = await compile({ code: `export const code = async () => await import('${escape}')` })
        expect(result.built).toBe(false)
        expect(result.error).toContain(IMPORT_OUT_OF_SCOPE_MESSAGE)
        expect(result.error).not.toContain(SECRET)
    })

    it('blocks a symlink inside the step folder that points outside', async () => {
        const result = await compile({
            code: `import s from './leak.js'; export const code = async () => ({ s })`,
            prepare: (codePath) => symlinkSync(path.join(secretDir, 'secret.js'), path.join(codePath, 'leak.js')),
        })
        expect(result.built).toBe(false)
        expect(result.error).toContain(IMPORT_OUT_OF_SCOPE_MESSAGE)
        expect(result.bundle).not.toContain(SECRET)
    })

    it('blocks a node_modules package whose entry escapes the step folder', async () => {
        const result = await compile({
            code: `import s from 'evil'; export const code = async () => ({ s })`,
            prepare: (codePath) => {
                const dir = path.join(codePath, 'node_modules', 'evil')
                mkdirSync(dir, { recursive: true })
                writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'evil', main: path.join(secretDir, 'secret.js') }))
            },
        })
        expect(result.built).toBe(false)
        expect(result.bundle).not.toContain(SECRET)
    })

    it('allows a legitimate relative import inside the step folder', async () => {
        const result = await compile({
            code: `import s from './helper'; export const code = async () => ({ s })`,
            prepare: (codePath) => writeFileSync(path.join(codePath, 'helper.ts'), 'export default 42'),
        })
        expect(result.built).toBe(true)
        expect(result.bundle).toContain('42')
    })

    it('allows a bundled node_modules dependency', async () => {
        const result = await compile({
            code: `import s from 'friendly'; export const code = async () => ({ s })`,
            prepare: (codePath) => {
                const dir = path.join(codePath, 'node_modules', 'friendly')
                mkdirSync(dir, { recursive: true })
                writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'friendly', main: 'index.js' }))
                writeFileSync(path.join(dir, 'index.js'), 'module.exports = "friendly-value"')
            },
        })
        expect(result.built).toBe(true)
        expect(result.bundle).toContain('friendly-value')
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
