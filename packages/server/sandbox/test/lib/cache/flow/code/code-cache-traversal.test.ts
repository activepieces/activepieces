import { randomUUID } from 'node:crypto'
import { readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path, { join } from 'node:path'
import { ActivepiecesError, ErrorCode } from '@activepieces/core-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { codeCache } from '../../../../../src/lib/cache/flow/code/code-cache'

const folders: string[] = []

function uniqueBase(): string {
    const folder = join(tmpdir(), `code-cache-traversal-${randomUUID()}`)
    folders.push(folder)
    return folder
}

async function expectPathSegmentRejection(run: () => unknown, field: string): Promise<void> {
    let thrown: unknown
    try {
        await run()
    }
    catch (error) {
        thrown = error
    }
    if (!(thrown instanceof ActivepiecesError)) {
        throw new Error(`expected an ActivepiecesError, got: ${String(thrown)}`)
    }
    expect(thrown.error.code).toBe(ErrorCode.VALIDATION)
    if (thrown.error.code === ErrorCode.VALIDATION) {
        expect(thrown.error.params.message).toContain(field)
        expect(thrown.error.params.message).toContain('safe path segment')
    }
}

async function expectNamespaceRejection(run: () => unknown): Promise<void> {
    let thrown: unknown
    try {
        await run()
    }
    catch (error) {
        thrown = error
    }
    if (!(thrown instanceof ActivepiecesError)) {
        throw new Error(`expected an ActivepiecesError, got: ${String(thrown)}`)
    }
    expect(thrown.error.code).toBe(ErrorCode.VALIDATION)
    if (thrown.error.code === ErrorCode.VALIDATION) {
        expect(thrown.error.params.message).toContain('code namespace')
    }
}

afterEach(async () => {
    for (const f of folders) {
        await rm(f, { recursive: true, force: true })
    }
    folders.length = 0
})

describe('code-cache stepName path traversal', () => {
    const flowVersionId = 'fv-1234567890'
    const traversalName = '../../common/node_modules/bufferutil'

    it('rejects a traversal stepName in stepDir', async () => {
        const codesFolderPath = path.resolve(uniqueBase(), 'v12', 'codes')
        await expectPathSegmentRejection(
            () => codeCache(codesFolderPath).stepDir({ flowVersionId, stepName: traversalName }),
            'stepName',
        )
    })

    it('rejects a traversal namespace in stepDir and flowVersionDir', async () => {
        const codesFolderPath = path.resolve(uniqueBase(), 'v12', 'codes')
        for (const namespace of ['../../common', '..', 'action-runs/..', 'action-runs/plat/hash']) {
            await expectNamespaceRejection(
                () => codeCache(codesFolderPath).stepDir({ flowVersionId: namespace, stepName: 'step_1' }),
            )
            await expectNamespaceRejection(
                () => codeCache(codesFolderPath).flowVersionDir(namespace),
            )
        }
    })

    it('resolves an action-run namespace one level inside the codes folder', () => {
        const codesFolderPath = path.resolve(uniqueBase(), 'v12', 'codes')
        const resolved = path.resolve(codeCache(codesFolderPath).stepDir({
            flowVersionId: 'action-runs/plat-xyz_deadbeef',
            stepName: 'step_1',
        }))
        expect(resolved).toBe(path.resolve(codesFolderPath, 'action-runs', 'plat-xyz_deadbeef', 'step_1'))
        expect(resolved.startsWith(path.resolve(codesFolderPath) + path.sep)).toBe(true)
    })

    it('rejects a traversal stepName in writeCompiledStep and writes nothing outside codes/', async () => {
        const base = uniqueBase()
        const codesFolderPath = path.resolve(base, 'v12', 'codes')
        await expectPathSegmentRejection(
            () => codeCache(codesFolderPath).writeCompiledStep({
                flowVersionId,
                stepName: traversalName,
                compiledJs: 'exports.pwned = true',
            }),
            'stepName',
        )

        const commonDir = path.resolve(base, 'v12', 'common')
        await expect(readdir(commonDir)).rejects.toThrow()
    })

    it('resolves a legitimate step name inside the codes folder', () => {
        const codesFolderPath = path.resolve(uniqueBase(), 'v12', 'codes')
        const resolved = path.resolve(codeCache(codesFolderPath).stepDir({ flowVersionId, stepName: 'step_1' }))
        expect(resolved.startsWith(path.resolve(codesFolderPath) + path.sep)).toBe(true)
    })
})
