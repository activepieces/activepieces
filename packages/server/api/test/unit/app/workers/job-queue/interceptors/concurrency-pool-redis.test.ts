import { FastifyBaseLogger } from 'fastify'
import { Redis } from 'ioredis'
import { beforeEach, describe, expect, it } from 'vitest'
import { getConcurrencyPoolSetKey, getConcurrencyPoolWaitlistKey } from '../../../../../../src/app/database/redis/keys'
import { redisConnections } from '../../../../../../src/app/database/redis-connections'
import { concurrencyPoolRedis } from '../../../../../../src/app/workers/job-queue/interceptors/concurrency-pool-redis'

const noopLog = {
    debug: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
    fatal: () => undefined,
    trace: () => undefined,
    child: () => noopLog,
    silent: () => undefined,
    level: 'silent',
} as unknown as FastifyBaseLogger

const TIMEOUT_MS = 600_000

async function deleteKeysByPattern(redis: Redis, pattern: string): Promise<void> {
    const stream = redis.scanStream({ match: pattern, count: 100 })
    for await (const keys of stream) {
        if (keys.length > 0) await redis.del(...keys)
    }
}

async function clearPoolKeys(): Promise<void> {
    const redis = await redisConnections.useExisting()
    await deleteKeysByPattern(redis, 'active_jobs_set:*')
    await deleteKeysByPattern(redis, 'waiting_jobs_zset:*')
}

function memberKey(projectId: string, jobId: string): string {
    return `${projectId}:${jobId}`
}

describe('concurrencyPoolRedis Lua primitives', () => {
    describe('Suite A — single-threaded correctness', () => {
        beforeEach(async () => {
            await clearPoolKeys()
        })

        it('A1: basic acquire fills slots up to maxJobs', async () => {
            const poolId = `a1-${crypto.randomUUID()}`
            const redis = await redisConnections.useExisting()

            for (let i = 0; i < 5; i++) {
                const result = await concurrencyPoolRedis.raw.acquireSlotOrEnqueue({
                    poolId,
                    projectId: 'p',
                    jobId: `job-${i}`,
                    maxJobs: 5,
                    timeoutMs: TIMEOUT_MS,
                })
                expect(result.outcome).toBe('acquired')
            }

            expect(await redis.zcard(getConcurrencyPoolSetKey(poolId))).toBe(5)
            expect(await redis.zcard(getConcurrencyPoolWaitlistKey(poolId))).toBe(0)
        })

        it('A2: overflow pushes to waitlist and leaves set at max', async () => {
            const poolId = `a2-${crypto.randomUUID()}`
            const redis = await redisConnections.useExisting()

            for (let i = 0; i < 3; i++) {
                await concurrencyPoolRedis.raw.acquireSlotOrEnqueue({
                    poolId,
                    projectId: 'p',
                    jobId: `active-${i}`,
                    maxJobs: 3,
                    timeoutMs: TIMEOUT_MS,
                })
            }
            const queued = await concurrencyPoolRedis.raw.acquireSlotOrEnqueue({
                poolId,
                projectId: 'p',
                jobId: 'overflow',
                maxJobs: 3,
                timeoutMs: TIMEOUT_MS,
            })

            expect(queued.outcome).toBe('queued')
            expect(await redis.zcard(getConcurrencyPoolSetKey(poolId))).toBe(3)
            const waiters = await redis.zrange(getConcurrencyPoolWaitlistKey(poolId), 0, -1)
            expect(waiters).toEqual(['p:overflow'])
        })

        it('A3: FIFO order is preserved on multiple pops', async () => {
            const poolId = `a3-${crypto.randomUUID()}`

            await concurrencyPoolRedis.raw.acquireSlotOrEnqueue({ poolId, projectId: 'p', jobId: 'active', maxJobs: 1, timeoutMs: TIMEOUT_MS })
            for (const id of ['w1', 'w2', 'w3']) {
                await concurrencyPoolRedis.raw.acquireSlotOrEnqueue({ poolId, projectId: 'p', jobId: id, maxJobs: 1, timeoutMs: TIMEOUT_MS })
            }

            const first = await concurrencyPoolRedis.raw.releaseSlotAndPopWaiter({ poolId, projectId: 'p', jobId: 'active', timeoutMs: TIMEOUT_MS })
            expect(first).toEqual({ projectId: 'p', jobId: 'w1' })
            if (first === null) throw new Error('expected w1')

            const second = await concurrencyPoolRedis.raw.releaseSlotAndPopWaiter({ poolId, projectId: first.projectId, jobId: first.jobId, timeoutMs: TIMEOUT_MS })
            expect(second).toEqual({ projectId: 'p', jobId: 'w2' })
            if (second === null) throw new Error('expected w2')

            const third = await concurrencyPoolRedis.raw.releaseSlotAndPopWaiter({ poolId, projectId: second.projectId, jobId: second.jobId, timeoutMs: TIMEOUT_MS })
            expect(third).toEqual({ projectId: 'p', jobId: 'w3' })
        })

        it('A4: release returns null when waitlist empty', async () => {
            const poolId = `a4-${crypto.randomUUID()}`
            const redis = await redisConnections.useExisting()

            await concurrencyPoolRedis.raw.acquireSlotOrEnqueue({ poolId, projectId: 'p', jobId: 'solo', maxJobs: 1, timeoutMs: TIMEOUT_MS })

            const popped = await concurrencyPoolRedis.raw.releaseSlotAndPopWaiter({ poolId, projectId: 'p', jobId: 'solo', timeoutMs: TIMEOUT_MS })

            expect(popped).toBeNull()
            expect(await redis.zcard(getConcurrencyPoolSetKey(poolId))).toBe(0)
        })

        it('A5: release promotes correct member into active set', async () => {
            const poolId = `a5-${crypto.randomUUID()}`
            const redis = await redisConnections.useExisting()

            for (let i = 0; i < 5; i++) {
                await concurrencyPoolRedis.raw.acquireSlotOrEnqueue({ poolId, projectId: 'p', jobId: `a${i}`, maxJobs: 5, timeoutMs: TIMEOUT_MS })
            }
            await concurrencyPoolRedis.raw.acquireSlotOrEnqueue({ poolId, projectId: 'p', jobId: 'w1', maxJobs: 5, timeoutMs: TIMEOUT_MS })
            await concurrencyPoolRedis.raw.acquireSlotOrEnqueue({ poolId, projectId: 'p', jobId: 'w2', maxJobs: 5, timeoutMs: TIMEOUT_MS })

            const popped = await concurrencyPoolRedis.raw.releaseSlotAndPopWaiter({ poolId, projectId: 'p', jobId: 'a0', timeoutMs: TIMEOUT_MS })
            expect(popped).toEqual({ projectId: 'p', jobId: 'w1' })

            const active = new Set(await redis.zrange(getConcurrencyPoolSetKey(poolId), 0, -1))
            expect(active).toEqual(new Set(['p:a1', 'p:a2', 'p:a3', 'p:a4', 'p:w1']))

            const remaining = await redis.zrange(getConcurrencyPoolWaitlistKey(poolId), 0, -1)
            expect(remaining).toEqual(['p:w2'])
        })

        it('A6: idempotent acquire — same member twice, no duplicate', async () => {
            const poolId = `a6-${crypto.randomUUID()}`
            const redis = await redisConnections.useExisting()

            const first = await concurrencyPoolRedis.raw.acquireSlotOrEnqueue({ poolId, projectId: 'p', jobId: 'same', maxJobs: 3, timeoutMs: TIMEOUT_MS })
            const second = await concurrencyPoolRedis.raw.acquireSlotOrEnqueue({ poolId, projectId: 'p', jobId: 'same', maxJobs: 3, timeoutMs: TIMEOUT_MS })

            expect(first.outcome).toBe('acquired')
            expect(second.outcome).toBe('acquired')
            expect(await redis.zcard(getConcurrencyPoolSetKey(poolId))).toBe(1)
            expect(await redis.zcard(getConcurrencyPoolWaitlistKey(poolId))).toBe(0)
        })

        it('A7: stale entries are swept on acquire', async () => {
            const poolId = `a7-${crypto.randomUUID()}`
            const redis = await redisConnections.useExisting()
            const setKey = getConcurrencyPoolSetKey(poolId)

            const staleScore = Date.now() - TIMEOUT_MS - 10_000
            for (let i = 0; i < 5; i++) {
                await redis.zadd(setKey, staleScore, `p:stale-${i}`)
            }

            const result = await concurrencyPoolRedis.raw.acquireSlotOrEnqueue({
                poolId,
                projectId: 'p',
                jobId: 'fresh',
                maxJobs: 5,
                timeoutMs: TIMEOUT_MS,
            })

            expect(result.outcome).toBe('acquired')
            const members = await redis.zrange(setKey, 0, -1)
            expect(members).toEqual(['p:fresh'])
        })

        it('A8: partial stale cleanup keeps fresh entries', async () => {
            const poolId = `a8-${crypto.randomUUID()}`
            const redis = await redisConnections.useExisting()
            const setKey = getConcurrencyPoolSetKey(poolId)

            const now = Date.now()
            await redis.zadd(setKey, now, 'p:fresh-1')
            await redis.zadd(setKey, now, 'p:fresh-2')
            await redis.zadd(setKey, now, 'p:fresh-3')
            await redis.zadd(setKey, now - TIMEOUT_MS - 10_000, 'p:stale-1')
            await redis.zadd(setKey, now - TIMEOUT_MS - 10_000, 'p:stale-2')

            const result = await concurrencyPoolRedis.raw.acquireSlotOrEnqueue({
                poolId,
                projectId: 'p',
                jobId: 'new',
                maxJobs: 5,
                timeoutMs: TIMEOUT_MS,
            })
            expect(result.outcome).toBe('acquired')

            const members = new Set(await redis.zrange(setKey, 0, -1))
            expect(members).toEqual(new Set(['p:fresh-1', 'p:fresh-2', 'p:fresh-3', 'p:new']))
        })

        it('A9: active-set key has TTL after acquire', async () => {
            const poolId = `a9-${crypto.randomUUID()}`
            const redis = await redisConnections.useExisting()

            await concurrencyPoolRedis.raw.acquireSlotOrEnqueue({ poolId, projectId: 'p', jobId: 'x', maxJobs: 1, timeoutMs: TIMEOUT_MS })

            const ttl = await redis.ttl(getConcurrencyPoolSetKey(poolId))
            expect(ttl).toBeGreaterThan(0)
            expect(ttl).toBeLessThanOrEqual(Math.ceil(TIMEOUT_MS / 1000))
        })

        it('A10: waitlist key has TTL and is refreshed on new RPUSH', async () => {
            const poolId = `a10-${crypto.randomUUID()}`
            const redis = await redisConnections.useExisting()

            await concurrencyPoolRedis.raw.acquireSlotOrEnqueue({ poolId, projectId: 'p', jobId: 'a', maxJobs: 1, timeoutMs: TIMEOUT_MS })
            await concurrencyPoolRedis.raw.acquireSlotOrEnqueue({ poolId, projectId: 'p', jobId: 'w1', maxJobs: 1, timeoutMs: TIMEOUT_MS })

            const ttl1 = await redis.ttl(getConcurrencyPoolWaitlistKey(poolId))
            expect(ttl1).toBeGreaterThan(0)

            await concurrencyPoolRedis.raw.acquireSlotOrEnqueue({ poolId, projectId: 'p', jobId: 'w2', maxJobs: 1, timeoutMs: TIMEOUT_MS })

            const ttl2 = await redis.ttl(getConcurrencyPoolWaitlistKey(poolId))
            expect(ttl2).toBeGreaterThan(0)
        })

        it('A11: re-acquire of an already-queued member is idempotent (no duplicate waitlist entry)', async () => {
            const poolId = `a11-${crypto.randomUUID()}`
            const redis = await redisConnections.useExisting()

            await concurrencyPoolRedis.raw.acquireSlotOrEnqueue({ poolId, projectId: 'p', jobId: 'a', maxJobs: 1, timeoutMs: TIMEOUT_MS })
            const first = await concurrencyPoolRedis.raw.acquireSlotOrEnqueue({ poolId, projectId: 'p', jobId: 'w1', maxJobs: 1, timeoutMs: TIMEOUT_MS })
            const second = await concurrencyPoolRedis.raw.acquireSlotOrEnqueue({ poolId, projectId: 'p', jobId: 'w1', maxJobs: 1, timeoutMs: TIMEOUT_MS })

            expect(first.outcome).toBe('queued')
            expect(second.outcome).toBe('queued')
            const waiters = await redis.zrange(getConcurrencyPoolWaitlistKey(poolId), 0, -1)
            expect(waiters).toEqual(['p:w1'])
        })

        it('A12: dropPromotedWaiter cleans active set so the same member can be re-enqueued later', async () => {
            const poolId = `a12-${crypto.randomUUID()}`

            await concurrencyPoolRedis.raw.acquireSlotOrEnqueue({ poolId, projectId: 'p', jobId: 'a', maxJobs: 1, timeoutMs: TIMEOUT_MS })
            await concurrencyPoolRedis.raw.acquireSlotOrEnqueue({ poolId, projectId: 'p', jobId: 'w1', maxJobs: 1, timeoutMs: TIMEOUT_MS })

            const popped = await concurrencyPoolRedis.raw.releaseSlotAndPopWaiter({ poolId, projectId: 'p', jobId: 'a', timeoutMs: TIMEOUT_MS })
            expect(popped).toEqual({ projectId: 'p', jobId: 'w1' })

            await concurrencyPoolRedis.raw.dropPromotedWaiter({ poolId, waiter: { projectId: 'p', jobId: 'w1' } })

            const requeue = await concurrencyPoolRedis.raw.acquireSlotOrEnqueue({ poolId, projectId: 'p', jobId: 'w1', maxJobs: 1, timeoutMs: TIMEOUT_MS })
            expect(requeue.outcome).toBe('acquired')
        })

        it('A13: acquire promotes orphan waiters into active when capacity exists, then admits the new arrival', async () => {
            const poolId = `a13-${crypto.randomUUID()}`
            const redis = await redisConnections.useExisting()
            const waitlistKey = getConcurrencyPoolWaitlistKey(poolId)

            await redis.zadd(waitlistKey, Date.now(), 'p:orphan')

            const result = await concurrencyPoolRedis.raw.acquireSlotOrEnqueue({
                poolId,
                projectId: 'p',
                jobId: 'newcomer',
                maxJobs: 5,
                timeoutMs: TIMEOUT_MS,
            })

            expect(result.outcome).toBe('acquired')
            expect(result.promoted).toEqual([{ projectId: 'p', jobId: 'orphan' }])
            const active = new Set(await redis.zrange(getConcurrencyPoolSetKey(poolId), 0, -1))
            expect(active).toEqual(new Set(['p:orphan', 'p:newcomer']))
            expect(await redis.zcard(waitlistKey)).toBe(0)
        })

        it('A14: dropPromotedWaiter removes the waiter from the active set without re-queueing', async () => {
            const poolId = `a14-${crypto.randomUUID()}`
            const redis = await redisConnections.useExisting()
            const setKey = getConcurrencyPoolSetKey(poolId)
            const waitlistKey = getConcurrencyPoolWaitlistKey(poolId)

            await redis.zadd(setKey, Date.now(), 'p:bogus')
            await redis.zadd(waitlistKey, Date.now(), 'p:next-valid-waiter')

            await concurrencyPoolRedis.raw.dropPromotedWaiter({ poolId, waiter: { projectId: 'p', jobId: 'bogus' } })

            expect(await redis.zcard(setKey)).toBe(0)
            const waiters = await redis.zrange(waitlistKey, 0, -1)
            expect(waiters).toEqual(['p:next-valid-waiter'])
        })

        it('A15: acquire silently drops invalid promoted members from the active set', async () => {
            const poolId = `a15-${crypto.randomUUID()}`
            const redis = await redisConnections.useExisting()
            const waitlistKey = getConcurrencyPoolWaitlistKey(poolId)

            await redis.zadd(waitlistKey, Date.now(), 'invalid-no-colon')

            const result = await concurrencyPoolRedis.raw.acquireSlotOrEnqueue({
                poolId,
                projectId: 'p',
                jobId: 'newcomer',
                maxJobs: 5,
                timeoutMs: TIMEOUT_MS,
            })

            expect(result.outcome).toBe('acquired')
            expect(result.promoted).toEqual([])
            const active = new Set(await redis.zrange(getConcurrencyPoolSetKey(poolId), 0, -1))
            expect(active).toEqual(new Set(['p:newcomer']))
        })

        it('A16: release silently drops invalid popped waiter and returns null', async () => {
            const poolId = `a16-${crypto.randomUUID()}`
            const redis = await redisConnections.useExisting()
            const setKey = getConcurrencyPoolSetKey(poolId)
            const waitlistKey = getConcurrencyPoolWaitlistKey(poolId)

            await redis.zadd(setKey, Date.now(), 'p:active')
            await redis.zadd(waitlistKey, 0, 'invalid-no-colon')

            const popped = await concurrencyPoolRedis.raw.releaseSlotAndPopWaiter({
                poolId,
                projectId: 'p',
                jobId: 'active',
                timeoutMs: TIMEOUT_MS,
            })

            expect(popped).toBeNull()
            expect(await redis.zcard(setKey)).toBe(0)
        })

        it('A18: forPool cascades to next waiter when promote() returns false', async () => {
            const poolId = `a18-${crypto.randomUUID()}`
            const redis = await redisConnections.useExisting()
            const setKey = getConcurrencyPoolSetKey(poolId)
            const waitlistKey = getConcurrencyPoolWaitlistKey(poolId)

            await redis.zadd(setKey, Date.now(), 'p:active')
            await redis.zadd(waitlistKey, Date.now(), 'p:bad')
            await redis.zadd(waitlistKey, Date.now() + 1, 'p:good')

            const promoteCalls: string[] = []
            const pool = concurrencyPoolRedis.forPool({
                poolId,
                timeoutMs: TIMEOUT_MS,
                getMaxJobs: async () => 1,
                promote: async ({ jobId }) => {
                    promoteCalls.push(jobId)
                    return jobId === 'good'
                },
                log: noopLog,
            })

            await pool.release({ projectId: 'p', jobId: 'active' })

            expect(promoteCalls).toEqual(['bad', 'good'])
            expect(await redis.zrange(setKey, 0, -1)).toEqual(['p:good'])
            expect(await redis.zcard(waitlistKey)).toBe(0)
        })

        it('A17: release of a stale-swept member does not over-pop into a saturated pool', async () => {
            const poolId = `a17-${crypto.randomUUID()}`
            const redis = await redisConnections.useExisting()
            const setKey = getConcurrencyPoolSetKey(poolId)
            const waitlistKey = getConcurrencyPoolWaitlistKey(poolId)

            await redis.zadd(setKey, Date.now(), 'p:replacement')
            await redis.zadd(waitlistKey, Date.now(), 'p:waiter')

            const popped = await concurrencyPoolRedis.raw.releaseSlotAndPopWaiter({
                poolId,
                projectId: 'p',
                jobId: 'long-running',
                timeoutMs: TIMEOUT_MS,
            })

            expect(popped).toBeNull()
            expect(await redis.zrange(setKey, 0, -1)).toEqual(['p:replacement'])
            expect(await redis.zrange(waitlistKey, 0, -1)).toEqual(['p:waiter'])
        })
    })

    describe('Suite B — concurrent / race-condition correctness', () => {
        const ITERATIONS = 10

        beforeEach(async () => {
            await clearPoolKeys()
        })

        it('B1: concurrent acquire storm — exactly maxJobs acquired, rest queued', async () => {
            for (let iter = 0; iter < ITERATIONS; iter++) {
                await clearPoolKeys()
                const poolId = `b1-${iter}-${crypto.randomUUID()}`
                const redis = await redisConnections.useExisting()

                const results = await Promise.all(
                    Array.from({ length: 100 }, (_, i) =>
                        concurrencyPoolRedis.raw.acquireSlotOrEnqueue({
                            poolId,
                            projectId: 'p',
                            jobId: `job-${i}`,
                            maxJobs: 10,
                            timeoutMs: TIMEOUT_MS,
                        }),
                    ),
                )

                const acquired = results.filter(r => r.outcome === 'acquired').length
                const queued = results.filter(r => r.outcome === 'queued').length

                expect(acquired).toBe(10)
                expect(queued).toBe(90)
                expect(await redis.zcard(getConcurrencyPoolSetKey(poolId))).toBe(10)
                expect(await redis.zcard(getConcurrencyPoolWaitlistKey(poolId))).toBe(90)
            }
        })

        it('B2: concurrent release storm — pops N distinct waiters when N releases fire', async () => {
            for (let iter = 0; iter < ITERATIONS; iter++) {
                await clearPoolKeys()
                const poolId = `b2-${iter}-${crypto.randomUUID()}`

                for (let i = 0; i < 10; i++) {
                    await concurrencyPoolRedis.raw.acquireSlotOrEnqueue({ poolId, projectId: 'p', jobId: `a-${i}`, maxJobs: 10, timeoutMs: TIMEOUT_MS })
                }
                for (let i = 0; i < 90; i++) {
                    await concurrencyPoolRedis.raw.acquireSlotOrEnqueue({ poolId, projectId: 'p', jobId: `w-${i}`, maxJobs: 10, timeoutMs: TIMEOUT_MS })
                }

                const popped = await Promise.all(
                    Array.from({ length: 10 }, (_, i) =>
                        concurrencyPoolRedis.raw.releaseSlotAndPopWaiter({ poolId, projectId: 'p', jobId: `a-${i}`, timeoutMs: TIMEOUT_MS }),
                    ),
                )

                const nonNull = popped.filter((v): v is NonNullable<typeof v> => v !== null)
                expect(nonNull).toHaveLength(10)
                expect(new Set(nonNull.map(w => `${w.projectId}:${w.jobId}`)).size).toBe(10)

                const redis = await redisConnections.useExisting()
                expect(await redis.zcard(getConcurrencyPoolSetKey(poolId))).toBe(10)
                expect(await redis.zcard(getConcurrencyPoolWaitlistKey(poolId))).toBe(80)
            }
        })

        it('B3: interleaved acquires + releases never over-acquire', async () => {
            for (let iter = 0; iter < ITERATIONS; iter++) {
                await clearPoolKeys()
                const poolId = `b3-${iter}-${crypto.randomUUID()}`
                const maxJobs = 10
                const redis = await redisConnections.useExisting()

                for (let i = 0; i < maxJobs; i++) {
                    await concurrencyPoolRedis.raw.acquireSlotOrEnqueue({ poolId, projectId: 'p', jobId: `seed-${i}`, maxJobs, timeoutMs: TIMEOUT_MS })
                }

                const newAcquires = Array.from({ length: 50 }, (_, i) =>
                    concurrencyPoolRedis.raw.acquireSlotOrEnqueue({ poolId, projectId: 'p', jobId: `new-${i}`, maxJobs, timeoutMs: TIMEOUT_MS }),
                )
                const releases = Array.from({ length: 10 }, (_, i) =>
                    concurrencyPoolRedis.raw.releaseSlotAndPopWaiter({ poolId, projectId: 'p', jobId: `seed-${i}`, timeoutMs: TIMEOUT_MS }),
                )

                await Promise.all([...newAcquires, ...releases])

                const cardinality = await redis.zcard(getConcurrencyPoolSetKey(poolId))
                expect(cardinality).toBeLessThanOrEqual(maxJobs)
            }
        })

        it('B4: thundering-herd release pops exactly one waiter per release', async () => {
            const poolId = `b4-${crypto.randomUUID()}`
            const redis = await redisConnections.useExisting()

            await concurrencyPoolRedis.raw.acquireSlotOrEnqueue({ poolId, projectId: 'p', jobId: 'active', maxJobs: 1, timeoutMs: TIMEOUT_MS })
            for (let i = 0; i < 1000; i++) {
                await concurrencyPoolRedis.raw.acquireSlotOrEnqueue({ poolId, projectId: 'p', jobId: `w-${i}`, maxJobs: 1, timeoutMs: TIMEOUT_MS })
            }

            const popped = await concurrencyPoolRedis.raw.releaseSlotAndPopWaiter({ poolId, projectId: 'p', jobId: 'active', timeoutMs: TIMEOUT_MS })
            expect(popped).toEqual({ projectId: 'p', jobId: 'w-0' })

            expect(await redis.zcard(getConcurrencyPoolWaitlistKey(poolId))).toBe(999)
            expect(await redis.zcard(getConcurrencyPoolSetKey(poolId))).toBe(1)
        })

        it('B5: concurrent duplicate member — no duplicates created', async () => {
            for (let iter = 0; iter < ITERATIONS; iter++) {
                await clearPoolKeys()
                const poolId = `b5-${iter}-${crypto.randomUUID()}`
                const redis = await redisConnections.useExisting()

                const results = await Promise.all(
                    Array.from({ length: 50 }, () =>
                        concurrencyPoolRedis.raw.acquireSlotOrEnqueue({ poolId, projectId: 'p', jobId: 'duplicate', maxJobs: 3, timeoutMs: TIMEOUT_MS }),
                    ),
                )

                expect(results.every(r => r.outcome === 'acquired')).toBe(true)
                expect(await redis.zcard(getConcurrencyPoolSetKey(poolId))).toBe(1)
                expect(await redis.zcard(getConcurrencyPoolWaitlistKey(poolId))).toBe(0)
            }
        })

        it('B6: pool isolation — two pools do not bleed', async () => {
            for (let iter = 0; iter < ITERATIONS; iter++) {
                await clearPoolKeys()
                const pool1 = `b6-p1-${iter}-${crypto.randomUUID()}`
                const pool2 = `b6-p2-${iter}-${crypto.randomUUID()}`
                const redis = await redisConnections.useExisting()

                const p1Acquires = Array.from({ length: 20 }, (_, i) =>
                    concurrencyPoolRedis.raw.acquireSlotOrEnqueue({ poolId: pool1, projectId: 'p1', jobId: `job-${i}`, maxJobs: 3, timeoutMs: TIMEOUT_MS }),
                )
                const p2Acquires = Array.from({ length: 20 }, (_, i) =>
                    concurrencyPoolRedis.raw.acquireSlotOrEnqueue({ poolId: pool2, projectId: 'p2', jobId: `job-${i}`, maxJobs: 5, timeoutMs: TIMEOUT_MS }),
                )
                await Promise.all([...p1Acquires, ...p2Acquires])

                expect(await redis.zcard(getConcurrencyPoolSetKey(pool1))).toBe(3)
                expect(await redis.zcard(getConcurrencyPoolWaitlistKey(pool1))).toBe(17)
                expect(await redis.zcard(getConcurrencyPoolSetKey(pool2))).toBe(5)
                expect(await redis.zcard(getConcurrencyPoolWaitlistKey(pool2))).toBe(15)
            }
        })

        it('B7: clock-skew safety — future-scored entries are not swept', async () => {
            const poolId = `b7-${crypto.randomUUID()}`
            const redis = await redisConnections.useExisting()
            const setKey = getConcurrencyPoolSetKey(poolId)

            const futureScore = Date.now() + 10_000
            await redis.zadd(setKey, futureScore, 'p:future-1')
            await redis.zadd(setKey, futureScore, 'p:future-2')

            const result = await concurrencyPoolRedis.raw.acquireSlotOrEnqueue({
                poolId,
                projectId: 'p',
                jobId: 'new',
                maxJobs: 5,
                timeoutMs: TIMEOUT_MS,
            })
            expect(result.outcome).toBe('acquired')

            const members = new Set(await redis.zrange(setKey, 0, -1))
            expect(members).toEqual(new Set(['p:future-1', 'p:future-2', 'p:new']))
        })

        it('B8: full pipeline fuzz — acquire + release under load preserves invariants', async () => {
            const poolId = `b8-${crypto.randomUUID()}`
            const maxJobs = 5
            const redis = await redisConnections.useExisting()
            const outstanding = new Set<string>()

            let acquired = 0
            let released = 0

            const operations: Array<() => Promise<void>> = []
            for (let i = 0; i < 200; i++) {
                if (i % 3 === 0 && outstanding.size > 0) {
                    const toRelease = Array.from(outstanding)[0]
                    outstanding.delete(toRelease)
                    operations.push(async () => {
                        await concurrencyPoolRedis.raw.releaseSlotAndPopWaiter({ poolId, projectId: 'p', jobId: toRelease, timeoutMs: TIMEOUT_MS })
                        released++
                    })
                }
                else {
                    const jobId = `job-${i}`
                    outstanding.add(jobId)
                    operations.push(async () => {
                        const r = await concurrencyPoolRedis.raw.acquireSlotOrEnqueue({ poolId, projectId: 'p', jobId, maxJobs, timeoutMs: TIMEOUT_MS })
                        if (r.outcome === 'acquired') acquired++
                    })
                }
            }

            await Promise.all(operations.map(op => op()))

            const cardinality = await redis.zcard(getConcurrencyPoolSetKey(poolId))
            expect(cardinality).toBeLessThanOrEqual(maxJobs)
            expect(acquired).toBeGreaterThan(0)
            expect(released).toBeGreaterThan(0)
        })
    })

    describe('Suite D — scenario / crash-recovery', () => {
        beforeEach(async () => {
            await clearPoolKeys()
        })

        it('D4: crash-recovery — stale active entry does not block new acquires indefinitely', async () => {
            const poolId = `d4-${crypto.randomUUID()}`
            const redis = await redisConnections.useExisting()
            const setKey = getConcurrencyPoolSetKey(poolId)
            const shortTimeout = 1000

            await redis.zadd(setKey, Date.now() - 2000, 'p:crashed')

            const result = await concurrencyPoolRedis.raw.acquireSlotOrEnqueue({
                poolId,
                projectId: 'p',
                jobId: 'survivor',
                maxJobs: 1,
                timeoutMs: shortTimeout,
            })

            expect(result.outcome).toBe('acquired')
            const members = await redis.zrange(setKey, 0, -1)
            expect(members).toEqual(['p:survivor'])
        })

        it('D5: high-volume soak — 500 acquire+release operations, final state empty', async () => {
            const poolId = `d5-${crypto.randomUUID()}`
            const redis = await redisConnections.useExisting()

            for (let i = 0; i < 500; i++) {
                const jobId = `job-${i}`
                const r = await concurrencyPoolRedis.raw.acquireSlotOrEnqueue({ poolId, projectId: 'p', jobId, maxJobs: 10, timeoutMs: TIMEOUT_MS })
                if (r.outcome === 'acquired') {
                    await concurrencyPoolRedis.raw.releaseSlotAndPopWaiter({ poolId, projectId: 'p', jobId, timeoutMs: TIMEOUT_MS })
                }
            }

            expect(await redis.zcard(getConcurrencyPoolSetKey(poolId))).toBe(0)
            expect(await redis.zcard(getConcurrencyPoolWaitlistKey(poolId))).toBe(0)
        })
    })

    describe('Smoke — promote-on-release happy path', () => {
        beforeEach(async () => {
            await clearPoolKeys()
        })

        it('fills capacity, queues overflow, and promotes the queued waiter on release', async () => {
            const poolId = `smoke-${crypto.randomUUID()}`
            const redis = await redisConnections.useExisting()

            const acquire = await concurrencyPoolRedis.raw.acquireSlotOrEnqueue({ poolId, projectId: 'p', jobId: 'active', maxJobs: 1, timeoutMs: TIMEOUT_MS })
            expect(acquire.outcome).toBe('acquired')

            const queued = await concurrencyPoolRedis.raw.acquireSlotOrEnqueue({ poolId, projectId: 'p', jobId: 'waiter', maxJobs: 1, timeoutMs: TIMEOUT_MS })
            expect(queued.outcome).toBe('queued')

            const reQueued = await concurrencyPoolRedis.raw.acquireSlotOrEnqueue({ poolId, projectId: 'p', jobId: 'waiter', maxJobs: 1, timeoutMs: TIMEOUT_MS })
            expect(reQueued.outcome).toBe('queued')
            expect(await redis.zcard(getConcurrencyPoolWaitlistKey(poolId))).toBe(1)

            const popped = await concurrencyPoolRedis.raw.releaseSlotAndPopWaiter({ poolId, projectId: 'p', jobId: 'active', timeoutMs: TIMEOUT_MS })
            expect(popped).toEqual({ projectId: 'p', jobId: 'waiter' })

            expect(await redis.zrange(getConcurrencyPoolSetKey(poolId), 0, -1)).toEqual([memberKey('p', 'waiter')])
            expect(await redis.zcard(getConcurrencyPoolWaitlistKey(poolId))).toBe(0)
        })

        it('release refreshes waitlist + members TTL so a sustained-saturation pool does not lose its keys', async () => {
            const poolId = `smoke-ttl-${crypto.randomUUID()}`
            const redis = await redisConnections.useExisting()

            await concurrencyPoolRedis.raw.acquireSlotOrEnqueue({ poolId, projectId: 'p', jobId: 'active', maxJobs: 1, timeoutMs: TIMEOUT_MS })
            await concurrencyPoolRedis.raw.acquireSlotOrEnqueue({ poolId, projectId: 'p', jobId: 'waiter-1', maxJobs: 1, timeoutMs: TIMEOUT_MS })
            await concurrencyPoolRedis.raw.acquireSlotOrEnqueue({ poolId, projectId: 'p', jobId: 'waiter-2', maxJobs: 1, timeoutMs: TIMEOUT_MS })

            await redis.expire(getConcurrencyPoolWaitlistKey(poolId), 5)

            await concurrencyPoolRedis.raw.releaseSlotAndPopWaiter({ poolId, projectId: 'p', jobId: 'active', timeoutMs: TIMEOUT_MS })

            const waitlistTtl = await redis.ttl(getConcurrencyPoolWaitlistKey(poolId))
            expect(waitlistTtl).toBeGreaterThan(60)
        })
    })
})
