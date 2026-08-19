import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ApEnvironment } from '@activepieces/shared'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { engineInstaller } from '../../../src/lib/cache/engine/engine-installer'

const ENGINE_SOURCE_DIR = join('dist', 'packages', 'engine')
const originalCwd = process.cwd()
const roots: string[] = []

async function makeSandboxRoot(): Promise<Root> {
    const root = join(tmpdir(), `engine-installer-test-${randomUUID()}`)
    roots.push(root)
    await mkdir(join(root, ENGINE_SOURCE_DIR), { recursive: true })
    await writeFile(join(root, ENGINE_SOURCE_DIR, 'main.js'), 'engine-bundle', 'utf8')
    await writeFile(join(root, ENGINE_SOURCE_DIR, 'main.js.map'), '{}', 'utf8')
    await writeFile(join(root, ENGINE_SOURCE_DIR, 'piece-child.js'), 'piece-child-bundle', 'utf8')
    await writeFile(join(root, ENGINE_SOURCE_DIR, 'piece-child.js.map'), '{}', 'utf8')
    const target = join(root, 'cache', 'common')
    await mkdir(target, { recursive: true })
    process.chdir(root)
    return { root, target }
}

const settings = (): { ENVIRONMENT: ApEnvironment } => ({ ENVIRONMENT: ApEnvironment.PRODUCTION })

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const installer = () => engineInstaller(undefined as any, settings as any)

beforeEach(() => {
    process.chdir(originalCwd)
})

afterEach(async () => {
    process.chdir(originalCwd)
    for (const r of roots) {
        await rm(r, { recursive: true, force: true })
    }
    roots.length = 0
})

describe('engineInstaller', () => {
    it('copies the engine once per process, then reports a hit', async () => {
        const { target } = await makeSandboxRoot()

        const first = await installer().install({ path: target })
        const second = await installer().install({ path: target })
        const third = await installer().install({ path: target })

        expect(first.cacheHit).toBe(false)
        expect(second.cacheHit).toBe(true)
        expect(third.cacheHit).toBe(true)
        expect(await readFile(join(target, 'main.js'), 'utf8')).toBe('engine-bundle')
        expect(await readFile(join(target, 'piece-child.js'), 'utf8')).toBe('piece-child-bundle')
    })

    it('is not invalidated by another container writing the shared cache.json', async () => {
        const { target } = await makeSandboxRoot()

        await installer().install({ path: target })
        // A sibling worker container sharing this volume stamps its own identity.
        await writeFile(join(target, 'cache.json'), JSON.stringify({ ENGINE_INSTALLED: 'some-other-process' }), 'utf8')

        const afterForeignWrite = await installer().install({ path: target })

        expect(afterForeignWrite.cacheHit).toBe(true)
    })
})

type Root = {
    root: string
    target: string
}
