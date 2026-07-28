import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { bundlePieceUtils } from './bundle-piece-utils'

describe('bundlePiece — external dependency capture', () => {
    let root: string | undefined

    afterEach(() => {
        if (root) {
            rmSync(root, { recursive: true, force: true })
            root = undefined
        }
    })

    it('captures a native dep reached transitively through an inlined package', async () => {
        root = mkdtempSync(join(tmpdir(), 'ap-bundle-'))

        const sdkDir = join(root, 'node_modules', 'fake-sdk')
        mkdirSync(sdkDir, { recursive: true })
        writeFileSync(join(sdkDir, 'package.json'), JSON.stringify({ name: 'fake-sdk', version: '1.0.0', main: 'index.js' }))
        writeFileSync(join(sdkDir, 'index.js'), 'const db = require(\'better-sqlite3\');\nmodule.exports = { db };\n')

        const piecePath = join(root, 'piece')
        mkdirSync(join(piecePath, 'src'), { recursive: true })
        writeFileSync(join(piecePath, 'package.json'), JSON.stringify({ name: 'piece-x', version: '0.0.1', dependencies: { 'fake-sdk': '1.0.0' } }))
        writeFileSync(join(piecePath, 'src', 'index.ts'), 'import { db } from \'fake-sdk\'\nexport const piece = { db }\n')
        const distPath = join(piecePath, 'dist')
        mkdirSync(distPath, { recursive: true })

        const result = await bundlePieceUtils.bundlePiece({ piecePath, distPath, repoRoot: root })

        expect(result.external).toContain('better-sqlite3')
        expect(result.inlined).toContain('fake-sdk')
        expect(result.external).not.toContain('fake-sdk')
    })

    it('keeps wasm/native asset packages (tiktoken, sharp) external so their runtime-loaded assets resolve', async () => {
        root = mkdtempSync(join(tmpdir(), 'ap-bundle-'))

        for (const [name, version] of [['tiktoken', '1.0.11'], ['sharp', '0.35.2']]) {
            const depDir = join(root, 'node_modules', name)
            mkdirSync(depDir, { recursive: true })
            writeFileSync(join(depDir, 'package.json'), JSON.stringify({ name, version, main: 'index.js' }))
            writeFileSync(join(depDir, 'index.js'), 'module.exports = {};\n')
        }

        const piecePath = join(root, 'piece')
        mkdirSync(join(piecePath, 'src'), { recursive: true })
        writeFileSync(join(piecePath, 'package.json'), JSON.stringify({ name: 'piece-z', version: '0.0.1', dependencies: { tiktoken: '1.0.11', sharp: '0.35.2' } }))
        writeFileSync(join(piecePath, 'src', 'index.ts'), 'import * as tiktoken from \'tiktoken\'\nimport * as sharp from \'sharp\'\nexport const piece = { tiktoken, sharp }\n')
        const distPath = join(piecePath, 'dist')
        mkdirSync(distPath, { recursive: true })

        const result = await bundlePieceUtils.bundlePiece({ piecePath, distPath, repoRoot: root })

        expect(result.external).toContain('tiktoken')
        expect(result.external).toContain('sharp')
        expect(result.inlined).not.toContain('tiktoken')
        expect(result.inlined).not.toContain('sharp')
    })

    it('externalizes an inlined package that relies on import.meta', async () => {
        root = mkdtempSync(join(tmpdir(), 'ap-bundle-'))

        const esmDir = join(root, 'node_modules', 'esm-dep')
        mkdirSync(esmDir, { recursive: true })
        writeFileSync(join(esmDir, 'package.json'), JSON.stringify({ name: 'esm-dep', version: '1.0.0', main: 'index.js' }))
        writeFileSync(join(esmDir, 'index.js'), 'const { createRequire } = require(\'module\');\nconst req = createRequire(import.meta.url);\nmodule.exports = { req };\n')

        const piecePath = join(root, 'piece')
        mkdirSync(join(piecePath, 'src'), { recursive: true })
        writeFileSync(join(piecePath, 'package.json'), JSON.stringify({ name: 'piece-y', version: '0.0.1', dependencies: { 'esm-dep': '1.0.0' } }))
        writeFileSync(join(piecePath, 'src', 'index.ts'), 'import { req } from \'esm-dep\'\nexport const piece = { req }\n')
        const distPath = join(piecePath, 'dist')
        mkdirSync(distPath, { recursive: true })

        const result = await bundlePieceUtils.bundlePiece({ piecePath, distPath, repoRoot: root })

        expect(result.external).toContain('esm-dep')
        expect(result.inlined).not.toContain('esm-dep')
    })
})
