import { randomUUID } from 'node:crypto'
import { mkdir, readdir, readFile, rm, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import { afterEach, describe, expect, it } from 'vitest'
import { diskLock } from '../../../src/lib/utils/distributed-lock'

const folders: string[] = []

function uniqueLocksPath(): string {
    const folder = join(tmpdir(), `disk-lock-test-${randomUUID()}`)
    folders.push(folder)
    return folder
}

afterEach(async () => {
    for (const f of folders) {
        await rm(f, { recursive: true, force: true })
    }
    folders.length = 0
})

describe('diskLock', () => {
    it('runs fn, returns its value and removes the lock file', async () => {
        const locksPath = uniqueLocksPath()
        const result = await diskLock(locksPath).runExclusive({
            key: 'my-key',
            fn: async () => 'value',
        })
        expect(result).toBe('value')
        expect(await readdir(locksPath)).toEqual([])
    })

    it('never lets two holders of the same key overlap', async () => {
        const locksPath = uniqueLocksPath()
        let active = 0
        let maxActive = 0
        let runs = 0
        const contend = () => diskLock(locksPath).runExclusive({
            key: 'same-key',
            fn: async () => {
                active += 1
                maxActive = Math.max(maxActive, active)
                await sleep(150)
                active -= 1
                runs += 1
            },
        })
        await Promise.all([contend(), contend(), contend()])
        expect(runs).toBe(3)
        expect(maxActive).toBe(1)
    })

    it('does not block holders of different keys', async () => {
        const locksPath = uniqueLocksPath()
        let slowStillRunning = false
        const slow = diskLock(locksPath).runExclusive({
            key: 'key-a',
            fn: async () => {
                slowStillRunning = true
                await sleep(400)
                slowStillRunning = false
            },
        })
        await sleep(50)
        await diskLock(locksPath).runExclusive({
            key: 'key-b',
            fn: async () => {
                expect(slowStillRunning).toBe(true)
            },
        })
        await slow
    })

    it('releases the lock when fn throws', async () => {
        const locksPath = uniqueLocksPath()
        await expect(diskLock(locksPath).runExclusive({
            key: 'throwing-key',
            fn: async () => {
                throw new Error('boom')
            },
        })).rejects.toThrow('boom')
        expect(await readdir(locksPath)).toEqual([])
        const result = await diskLock(locksPath).runExclusive({
            key: 'throwing-key',
            fn: async () => 'recovered',
        })
        expect(result).toBe('recovered')
    })

    it('times out while another holder keeps the lock', async () => {
        const locksPath = uniqueLocksPath()
        const holder = diskLock(locksPath).runExclusive({
            key: 'held-key',
            fn: async () => sleep(2000),
        })
        await sleep(50)
        await expect(diskLock(locksPath).runExclusive({
            key: 'held-key',
            timeoutMs: 100,
            fn: async () => 'should not run',
        })).rejects.toThrow('Timed out acquiring disk lock')
        await holder
    })

    it('takes over a stale lock from a dead holder', async () => {
        const locksPath = uniqueLocksPath()
        await mkdir(locksPath, { recursive: true })
        const staleLockPath = join(locksPath, 'dead-key.lock')
        await writeFile(staleLockPath, 'dead-holder-token', 'utf8')
        const sixMinutesAgo = (Date.now() - 6 * 60 * 1000) / 1000
        await utimes(staleLockPath, sixMinutesAgo, sixMinutesAgo)
        const result = await diskLock(locksPath).runExclusive({
            key: 'dead-key',
            fn: async () => 'took over',
        })
        expect(result).toBe('took over')
        expect(await readdir(locksPath)).toEqual([])
    })

    it('does not delete a lock it no longer owns on release', async () => {
        const locksPath = uniqueLocksPath()
        const lock = await diskLock(locksPath).acquire('contested-key')
        const [lockFile] = await readdir(locksPath)
        await writeFile(join(locksPath, lockFile), 'successor-token', 'utf8')
        await lock.release()
        expect(await readdir(locksPath)).toEqual([lockFile])
        expect(await readFile(join(locksPath, lockFile), 'utf8')).toBe('successor-token')
    })

    it('keeps the lock file inside locksPath for hostile keys', async () => {
        const locksPath = uniqueLocksPath()
        const lock = await diskLock(locksPath).acquire('../../etc/@scope/passwd')
        const entries = await readdir(locksPath)
        expect(entries).toHaveLength(1)
        expect(entries[0]).toMatch(/^[A-Za-z0-9._-]+\.lock$/)
        await lock.release()
    })
})
