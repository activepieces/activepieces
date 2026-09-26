import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { FastifyBaseLogger } from 'fastify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { filePiecesUtils } from '../../../../src/app/pieces/metadata/utils/file-pieces-utils'

const log = { warn: vi.fn(), error: vi.fn(), info: vi.fn() } as unknown as FastifyBaseLogger
const loadModule = createRequire(__filename)

describe('filePiecesUtils dev piece reload', () => {
    let pieceDirectory: string

    beforeEach(() => {
        pieceDirectory = mkdtempSync(join(tmpdir(), 'file-pieces-utils-'))
    })

    afterEach(() => {
        rmSync(pieceDirectory, { recursive: true, force: true })
    })

    function writeFiles(files: Record<string, string>): void {
        for (const [relativePath, content] of Object.entries(files)) {
            const filePath = join(pieceDirectory, relativePath)
            mkdirSync(dirname(filePath), { recursive: true })
            writeFileSync(filePath, content)
        }
    }

    function loadTag(): string {
        return loadModule(join(pieceDirectory, 'dist', 'src', 'index.js')).tag
    }

    describe('clearPieceModuleCache', () => {
        it('reloads edited code', () => {
            writeFiles({
                'dist/src/index.js': 'module.exports = require(\'./lib/common\')',
                'dist/src/lib/common.js': 'module.exports = { tag: \'v1\' }',
            })
            expect(loadTag()).toBe('v1')

            writeFiles({ 'dist/src/lib/common.js': 'module.exports = { tag: \'v2\' }' })
            filePiecesUtils(log).clearPieceModuleCache(join(pieceDirectory, 'dist'))

            expect(loadTag()).toBe('v2')
        })

        it('reloads when a loaded file is replaced by a folder of the same name', () => {
            writeFiles({
                'dist/src/index.js': 'module.exports = require(\'./lib/common\')',
                'dist/src/lib/common.js': 'module.exports = { tag: \'file\' }',
            })
            expect(loadTag()).toBe('file')

            rmSync(join(pieceDirectory, 'dist', 'src', 'lib', 'common.js'))
            writeFiles({ 'dist/src/lib/common/index.js': 'module.exports = { tag: \'folder\' }' })
            filePiecesUtils(log).clearPieceModuleCache(join(pieceDirectory, 'dist'))

            expect(loadTag()).toBe('folder')
        })

        it('reloads when a loaded folder is replaced by a file of the same name', () => {
            writeFiles({
                'dist/src/index.js': 'module.exports = require(\'./lib/common\')',
                'dist/src/lib/common/index.js': 'module.exports = { tag: \'folder\' }',
            })
            expect(loadTag()).toBe('folder')

            rmSync(join(pieceDirectory, 'dist', 'src', 'lib', 'common'), { recursive: true })
            writeFiles({ 'dist/src/lib/common.js': 'module.exports = { tag: \'file\' }' })
            filePiecesUtils(log).clearPieceModuleCache(join(pieceDirectory, 'dist'))

            expect(loadTag()).toBe('file')
        })

        it('reloads a renamed file when the dist folder is reached through a symlink', () => {
            writeFiles({
                'dist/src/index.js': 'module.exports = require(\'./lib/common\')',
                'dist/src/lib/common.js': 'module.exports = { tag: \'v1\' }',
            })
            expect(loadTag()).toBe('v1')

            const linkedPieceDirectory = `${pieceDirectory}-link`
            symlinkSync(pieceDirectory, linkedPieceDirectory)
            rmSync(join(pieceDirectory, 'dist', 'src', 'lib', 'common.js'))
            writeFiles({ 'dist/src/lib/common/index.js': 'module.exports = { tag: \'v2\' }' })
            filePiecesUtils(log).clearPieceModuleCache(join(linkedPieceDirectory, 'dist'))
            rmSync(linkedPieceDirectory)

            expect(loadTag()).toBe('v2')
        })
    })

    describe('removeOrphanedBuildOutputs', () => {
        it('removes compiled outputs whose source no longer exists and keeps everything else', async () => {
            writeFiles({
                'src/index.ts': '',
                'src/lib/kept.ts': '',
                'src/lib/common/index.ts': '',
                'dist/package.json': '{}',
                'dist/src/index.js': '',
                'dist/src/index.js.map': '',
                'dist/src/index.d.ts': '',
                'dist/src/index.d.ts.map': '',
                'dist/src/lib/kept.js': '',
                'dist/src/lib/common/index.js': '',
                'dist/src/lib/common.js': '',
                'dist/src/lib/common.js.map': '',
                'dist/src/lib/common.d.ts': '',
                'dist/src/lib/common.d.ts.map': '',
                'dist/src/lib/actions/deleted-action.js': '',
                'dist/src/i18n/de.json': '{}',
            })

            await filePiecesUtils(log).removeOrphanedBuildOutputs(pieceDirectory)

            const remaining = [
                'dist/package.json',
                'dist/src/index.js',
                'dist/src/index.js.map',
                'dist/src/index.d.ts',
                'dist/src/index.d.ts.map',
                'dist/src/lib/kept.js',
                'dist/src/lib/common/index.js',
                'dist/src/i18n/de.json',
            ]
            const removed = [
                'dist/src/lib/common.js',
                'dist/src/lib/common.js.map',
                'dist/src/lib/common.d.ts',
                'dist/src/lib/common.d.ts.map',
                'dist/src/lib/actions/deleted-action.js',
            ]
            expect(remaining.filter((file) => !existsSync(join(pieceDirectory, file)))).toEqual([])
            expect(removed.filter((file) => existsSync(join(pieceDirectory, file)))).toEqual([])
        })
    })
})
