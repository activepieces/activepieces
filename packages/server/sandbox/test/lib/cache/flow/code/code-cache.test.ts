import { rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { describe, it, expect, afterEach } from 'vitest'
import { codeCache } from '../../../../../src/lib/cache/flow/code/code-cache'

const folders: string[] = []

function uniqueFolder(): string {
    const folder = join(tmpdir(), `code-cache-test-${randomUUID()}`)
    folders.push(folder)
    return folder
}

afterEach(async () => {
    for (const f of folders) {
        await rm(f, { recursive: true, force: true })
    }
    folders.length = 0
})

describe('codeCache', () => {
    it('stepEntryPath is <codesFolder>/<flowVersionId>/<stepName>/index.ts', () => {
        const folder = uniqueFolder()
        const ref = { flowVersionId: 'fv1', stepName: 'step_1' }
        expect(codeCache(folder).stepEntryPath(ref)).toBe(join(folder, 'fv1', 'step_1', 'index.ts'))
    })

    it('stepDir is <codesFolder>/<flowVersionId>/<stepName>', () => {
        const folder = uniqueFolder()
        const ref = { flowVersionId: 'fv1', stepName: 'step_1' }
        expect(codeCache(folder).stepDir(ref)).toBe(join(folder, 'fv1', 'step_1'))
    })
})
