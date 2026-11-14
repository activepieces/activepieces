import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { translationPathsUtils } from './translation-paths-utils'

describe('translationPathsUtils', () => {
    let root: string | undefined

    afterEach(() => {
        if (root) {
            rmSync(root, { recursive: true, force: true })
            root = undefined
        }
    })

    const piece = {
        description: 'Cloud storage',
        actions: {
            upload_file: { displayName: 'Upload File', description: 'Upload a file', props: {} },
        },
        triggers: {},
    }

    it('keeps the file outside the piece folder, mirroring the piece group', () => {
        const file = translationPathsUtils.filePath({ repoRoot: '/repo', pieceRoot: '/repo/packages/pieces/community/dropbox' })

        expect(file).toBe(join('/repo', 'tools', 'i18n-paths', 'community', 'dropbox.json'))
    })

    it('writes every translatable path with its English, sorted by path', async () => {
        root = mkdtempSync(join(tmpdir(), 'ap-i18n-paths-'))

        const file = await translationPathsUtils.write({ repoRoot: root, pieceRoot: join(root, 'packages', 'pieces', 'core', 'dropbox'), piece })

        expect(file).toBe(join(root, 'tools', 'i18n-paths', 'core', 'dropbox.json'))
        const content = readFileSync(file, 'utf8')
        expect(content.endsWith('\n')).toBe(true)
        expect(Object.entries(JSON.parse(content))).toEqual([
            ['actions.upload_file.description', 'Upload a file'],
            ['actions.upload_file.displayName', 'Upload File'],
            ['description', 'Cloud storage'],
        ])
    })
})
