import { readFile, rm } from 'node:fs/promises'
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
    it('compiledStepPath is <codesFolder>/<flowVersionId>/<stepName>/index.js', () => {
        const folder = uniqueFolder()
        const ref = { flowVersionId: 'fv1', stepName: 'step_1' }
        expect(codeCache(folder).compiledStepPath(ref)).toBe(join(folder, 'fv1', 'step_1', 'index.js'))
    })

    it('writeCompiledStep then readCompiledStep round-trips the compiled JS', async () => {
        const folder = uniqueFolder()
        const cache = codeCache(folder)
        const ref = { flowVersionId: 'fv1', stepName: 'step_1' }

        await cache.writeCompiledStep({ ...ref, compiledJs: 'exports.code = () => 42' })

        expect(await cache.readCompiledStep(ref)).toBe('exports.code = () => 42')
        expect(await readFile(cache.compiledStepPath(ref), 'utf8')).toBe('exports.code = () => 42')
    })

    it('writeCompiledStep creates missing parent directories', async () => {
        const folder = uniqueFolder()
        const cache = codeCache(folder)
        const ref = { flowVersionId: 'never-created', stepName: 'deep_step' }

        await expect(cache.writeCompiledStep({ ...ref, compiledJs: 'x' })).resolves.toBeUndefined()
        expect(await cache.readCompiledStep(ref)).toBe('x')
    })
})
