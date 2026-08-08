import { randomUUID } from 'node:crypto'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { type ApLogger } from '@activepieces/server-utils'
import { RUN_STATE_STORE_DIR_PREFIX } from '@activepieces/shared'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cacheUtils, LATEST_CACHE_VERSION } from '../../../src/lib/cache/cache-paths'

const folders: string[] = []

const errorSpy = vi.fn()
const log = { info: vi.fn(), warn: vi.fn(), error: errorSpy, debug: vi.fn(), child: vi.fn().mockReturnThis() } as unknown as ApLogger

function uniqueBasePath(): string {
    const folder = join(tmpdir(), `cache-paths-test-${randomUUID()}`)
    folders.push(folder)
    return folder
}

function dateStringDaysAgo(days: number): string {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

async function createRunStateDir(basePath: string, daysAgo: number): Promise<string> {
    const dir = join(basePath, LATEST_CACHE_VERSION, 'flows', `${RUN_STATE_STORE_DIR_PREFIX}${dateStringDaysAgo(daysAgo)}`)
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, 'some-run.sqlite'), 'data')
    return dir
}

afterEach(async () => {
    for (const f of folders) {
        await rm(f, { recursive: true, force: true })
    }
    folders.length = 0
})

describe('deleteStaleRunStateDirs', () => {
    it('deletes dated store dirs older than the retention window and keeps recent ones', async () => {
        const basePath = uniqueBasePath()
        const staleDir = await createRunStateDir(basePath, 2)
        const olderDir = await createRunStateDir(basePath, 10)
        const todayDir = await createRunStateDir(basePath, 0)
        const yesterdayDir = await createRunStateDir(basePath, 1)

        await cacheUtils(basePath).deleteStaleRunStateDirs(log)

        expect(existsSync(staleDir)).toBe(false)
        expect(existsSync(olderDir)).toBe(false)
        expect(existsSync(todayDir)).toBe(true)
        expect(existsSync(yesterdayDir)).toBe(true)
    })

    it('leaves flow version cache dirs untouched', async () => {
        const basePath = uniqueBasePath()
        const flowVersionDir = join(basePath, LATEST_CACHE_VERSION, 'flows', 'someFlowVersionId123')
        await mkdir(flowVersionDir, { recursive: true })

        await cacheUtils(basePath).deleteStaleRunStateDirs(log)

        expect(existsSync(flowVersionDir)).toBe(true)
    })

    it('does not log an error when the flows dir does not exist yet', async () => {
        const basePath = uniqueBasePath()

        await cacheUtils(basePath).deleteStaleRunStateDirs(log)

        expect(errorSpy).not.toHaveBeenCalled()
    })
})
