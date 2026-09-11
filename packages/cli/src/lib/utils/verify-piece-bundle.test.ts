import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { verifyPieceBundleUtils } from './verify-piece-bundle'

describe('verifyPieceBundleLoads', () => {
    let root: string | undefined

    afterEach(() => {
        if (root) {
            rmSync(root, { recursive: true, force: true })
            root = undefined
        }
    })

    it('passes for a bundle that installs and requires cleanly', async () => {
        root = mkdtempSync(join(tmpdir(), 'ap-verify-piece-'))
        writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'piece-ok', version: '0.0.1', main: 'index.js', files: ['index.js', 'package.json'] }))
        writeFileSync(join(root, 'index.js'), 'module.exports = { ok: true }\n')

        await expect(verifyPieceBundleUtils.verifyPieceBundleLoads({ distPath: root })).resolves.toBeUndefined()
    })

    it('fails for a bundle whose code references an asset that was never packed — the tiktoken-wasm class of bug', async () => {
        root = mkdtempSync(join(tmpdir(), 'ap-verify-piece-'))
        writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'piece-missing-asset', version: '0.0.1', main: 'index.js', files: ['index.js', 'package.json'] }))
        mkdirSync(join(root, 'assets'), { recursive: true })
        writeFileSync(join(root, 'assets', 'native.bin'), 'not-actually-packed')
        writeFileSync(
            join(root, 'index.js'),
            'require(\'fs\').readFileSync(require(\'path\').join(__dirname, \'assets\', \'native.bin\'))\nmodule.exports = {}\n',
        )

        await expect(verifyPieceBundleUtils.verifyPieceBundleLoads({ distPath: root })).rejects.toThrow('failed to install and load')
    })
})
