import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const REPO_ROOT = resolve(import.meta.dirname, '../../../..')
const SERVER_ROOT = join(REPO_ROOT, 'packages/server')
const OWNER = 'utils'
const EVLOG_IMPORT = /from\s+'evlog(\/[a-z-]+)?'/

describe('evlog single owner', () => {
    it('is declared only by @activepieces/server-utils', () => {
        const declaring = serverPackageDirs()
            .filter((dir) => declaresEvlog({ dir }))
            .map((dir) => relative(SERVER_ROOT, dir))

        expect(declaring).toEqual([OWNER])
    })

    it('is imported only from @activepieces/server-utils sources', () => {
        const importing = serverPackageDirs()
            .filter((dir) => relative(SERVER_ROOT, dir) !== OWNER)
            .flatMap((dir) => tsFilesIn({ dir: join(dir, 'src') }))
            .filter((file) => EVLOG_IMPORT.test(readFileSync(file, 'utf8')))
            .map((file) => relative(REPO_ROOT, file))

        expect(importing).toEqual([])
    })
})

function serverPackageDirs(): string[] {
    return readdirSync(SERVER_ROOT)
        .map((entry) => join(SERVER_ROOT, entry))
        .filter((dir) => existsSync(join(dir, 'package.json')))
}

function declaresEvlog({ dir }: { dir: string }): boolean {
    const manifest: unknown = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
    if (typeof manifest !== 'object' || manifest === null) {
        return false
    }
    const groups = ['dependencies', 'devDependencies', 'peerDependencies']
    return groups.some((group) => {
        const deps = (manifest as Record<string, unknown>)[group]
        return typeof deps === 'object' && deps !== null && 'evlog' in deps
    })
}

function tsFilesIn({ dir }: { dir: string }): string[] {
    if (!existsSync(dir)) {
        return []
    }
    return readdirSync(dir).flatMap((entry) => {
        const full = join(dir, entry)
        if (statSync(full).isDirectory()) {
            return tsFilesIn({ dir: full })
        }
        return full.endsWith('.ts') ? [full] : []
    })
}
