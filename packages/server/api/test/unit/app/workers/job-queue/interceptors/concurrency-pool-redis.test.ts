import { Redis } from 'ioredis'
import { beforeEach, describe, expect, it } from 'vitest'
import { getConcurrencyPoolSetKey, getConcurrencyPoolWaitlistKey } from '../../../../../../src/app/database/redis/keys'
import { redisConnections } from '../../../../../../src/app/database/redis-connections'
import { concurrencyPoolRedis } from '../../../../../../src/app/workers/job-queue/interceptors/concurrency-pool-redis'

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
    await deleteKeysByPattern(redis, 'waiting_jobs_list:*')
}

function member(projectId: string, jobId: string): string {
    return concurrencyPoolRedis.buildMember({ projectId, jobId })
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
                const result = await concurrencyPoolRedis.acquireSlotOrEnqueue({
                    poolId,
                    member: member('p', `job-${i}`),
                    maxJobs: 5,
                    timeoutMs: TIMEOUT_MS,
                })
                expect(result).toBe('acquired')
            }

            expect(await redis.zcard(getConcurrencyPoolSetKey(poolId))).toBe(5)
            expect(await redis.llen(getConcurrencyPoolWaitlistKey(poolId))).toBe(0)
        })

        it('A2: overflow pushes to waitlist and leaves set at max', async () => {
            const poolId = `a2-${crypto.randomUUID()}`
            const redis = await redisConnections.useExisting()

            for (let i = 0; i < 3; i++) {
                await concurrencyPoolRedis.acquireSlotOrEnqueue({
                    poolId,
                    member: member('p', `active-${i}`),
                    maxJobs: 3,
                    timeoutMs: TIMEOUT_MS,
                })
            }
            const queued = await concurrencyPoolRedis.acquireSlotOrEnqueue({
                poolId,
                member: member('p', 'overflow'),
                maxJobs: 3,
                timeoutMs: TIMEOUT_MS,
            })

            expect(queued).toBe('queued')
            expect(await redis.zcard(getConcurrencyPoolSetKey(poolId))).toBe(3)
            const waiters = await redis.lrange(getConcurrencyPoolWaitlistKey(poolId), 0, -1)
            expect(waiters).toEqual(['p:overflow'])
        })

        it('A3: FIFO order is preserved on multiple pops', async () => {
            const poolId = `a3-${crypto.randomUUID()}`

            await concurrencyPoolRedis.acquireSlotOrEnqueue({ poolId, member: member('p', 'active'), maxJobs: 1, timeoutMs: TIMEOUT_MS })
            for (const id of ['w1', 'w2', 'w3']) {
                await concurrencyPoolRedis.acquireSlotOrEnqueue({ poolId, member: member('p', id), maxJobs: 1, timeoutMs: TIMEOUT_MS })
            }

            const first = await concurrencyPoolRedis.releaseSlotAndPopWaiter({ poolId, member: member('p', 'active'), timeoutMs: TIMEOUT_MS })
            expect(first).toBe(member('p', 'w1'))
            if (first === null) throw new Error('expected w1')

            const second = await concurrencyPoolRedis.releaseSlotAndPopWaiter({ poolId, member: first, timeoutMs: TIMEOUT_MS })
            expect(second).toBe(member('p', 'w2'))
            if (second === null) throw new Error('expected w2')

            const third = await concurrencyPoolRedis.releaseSlotAndPopWaiter({ poolId, member: second, timeoutMs: TIMEOUT_MS })
            expect(third).toBe(member('p', 'w3'))
        })

        it('A4: release returns null when waitlist empty', async () => {
            const poolId = `a4-${crypto.randomUUID()}`
            const redis = await redisConnections.useExisting()

            await concurrencyPoolRedis.acquireSlotOrEnqueue({ poolId, member: member('p', 'solo'), maxJobs: 1, timeoutMs: TIMEOUT_MS })

            const popped = await concurrencyPoolRedis.releaseSlotAndPopWaiter({ poolId, member: member('p', 'solo'), timeoutMs: TIMEOUT_MS })

            expect(popped).toBeNull()
            expect(await redis.zcard(getConcurrencyPoolSetKey(poolId))).toBe(0)
        })

        it('A5: release promotes correct member into active set', async () => {
            const poolId = `a5-${crypto.randomUUID()}`
            const redis = await redisConnections.useExisting()

            for (let i = 0; i < 5; i++) {
                await concurrencyPoolRedis.acquireSlotOrEnqueue({ poolId, member: member('p', `a${i}`), maxJobs: 5, timeoutMs: TIMEOUT_MS })
            }
            await concurrencyPoolRedis.acquireSlotOrEnqueue({ poolId, member: member('p', 'w1'), maxJobs: 5, timeoutMs: TIMEOUT_MS })
            await concurrencyPoolRedis.acquireSlotOrEnqueue({ poolId, member: member('p', 'w2'), maxJobs: 5, timeoutMs: TIMEOUT_MS })

            const popped = await concurrencyPoolRedis.releaseSlotAndPopWaiter({ poolId, member: member('p', 'a0'), timeoutMs: TIMEOUT_MS })
            expect(popped).toBe(member('p', 'w1'))

            const active = new Set(await redis.zrange(getConcurrencyPoolSetKey(poolId), 0, -1))
            expect(active).toEqual(new Set(['p:a1', 'p:a2', 'p:a3', 'p:a4', 'p:w1']))

            const remaining = await redis.lrange(getConcurrencyPoolWaitlistKey(poolId), 0, -1)
            expect(remaining).toEqual(['p:w2'])
        })

        it('A6: idempotent acquire — same member twice, no duplicate', async () => {
            const poolId = `a6-${crypto.randomUUID()}`
            const redis = await redisConnections.useExisting()

            const first = await concurrencyPoolRedis.acquireSlotOrEnqueue({ poolId, member: member('p', 'same'), maxJobs: 3, timeoutMs: TIMEOUT_MS })
            const second = await concurrencyPoolRedis.acquireSlotOrEnqueue({ poolId, member: member('p', 'same'), maxJobs: 3, timeoutMs: TIMEOUT_MS })

            expect(first).toBe('acquired')
            expect(second).toBe('acquired')
            expect(await redis.zcard(getConcurrencyPoolSetKey(poolId))).toBe(1)
            expect(await redis.llen(getConcurrencyPoolWaitlistKey(poolId))).toBe(0)
        })

        it('A7: stale entries are swept on acquire', async () => {
            const poolId = `a7-${crypto.randomUUID()}`
            const redis = await redisConnections.useExisting()
            const setKey = getConcurrencyPoolSetKey(poolId)

            const staleScore = Date.now() - TIMEOUT_MS - 10_000
            for (let i = 0; i < 5; i++) {
                await redis.zadd(setKey, staleScore, `p:stale-${i}`)
            }

            const result = await concurrencyPoolRedis.acquireSlotOrEnqueue({
                poolId,
                member: member('p', 'fresh'),
                maxJobs: 5,
                timeoutMs: TIMEOUT_MS,
            })

            expect(result).toBe('acquired')
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

            const result = await concurrencyPoolRedis.acquireSlotOrEnqueue({
                poolId,
                member: member('p', 'new'),
                maxJobs: 5,
                timeoutMs: TIMEOUT_MS,
            })
            expect(result).toBe('acquired')

            const members = new Set(await redis.zrange(setKey, 0, -1))
            expect(members).toEqual(new Set(['p:fresh-1', 'p:fresh-2', 'p:fresh-3', 'p:new']))
        })

        it('A9: active-set key has TTL after acquire', async () => {
            const poolId = `a9-${crypto.randomUUID()}`
            const redis = await redisConnections.useExisting()

            await concurrencyPoolRedis.acquireSlotOrEnqueue({ poolId, member: member('p', 'x'), maxJobs: 1, timeoutMs: TIMEOUT_MS })

            const ttl = await redis.ttl(getConcurrencyPoolSetKey(poolId))
            expect(ttl).toBeGreaterThan(0)
            expect(ttl).toBeLessThanOrEqual(Math.ceil(TIMEOUT_MS / 1000))
        })

        it('A10: waitlist key has TTL and is refreshed on new RPUSH', async () => {
            const poolId = `a10-${crypto.randomUUID()}`
            const redis = await redisConnections.useExisting()

            await concurrencyPoolRedis.acquireSlotOrEnqueue({ poolId, member: member('p', 'a'), maxJobs: 1, timeoutMs: TIMEOUT_MS })
            await concurrencyPoolRedis.acquireSlotOrEnqueue({ poolId, member: member('p', 'w1'), maxJobs: 1, timeoutMs: TIMEOUT_MS })

            const ttl1 = await redis.ttl(getConcurrencyPoolWaitlistKey(poolId))
            expect(ttl1).toBeGreaterThan(0)

            await concurrencyPoolRedis.acquireSlotOrEnqueue({ poolId, member: member('p', 'w2'), maxJobs: 1, timeoutMs: TIMEOUT_MS })

            const ttl2 = await redis.ttl(getConcurrencyPoolWaitlistKey(poolId))
            expect(ttl2).toBeGreaterThan(0)
        })

        it('A11: rollback returns popped member to head of waitlist and frees slot', async () => {
            const poolId = `a11-${crypto.randomUUID()}`
            const redis = await redisConnections.useExisting()

            await concurrencyPoolRedis.acquireSlotOrEnqueue({ poolId, member: member('p', 'a'), maxJobs: 1, timeoutMs: TIMEOUT_MS })
            await concurrencyPoolRedis.acquireSlotOrEnqueue({ poolId, member: member('p', 'w1'), maxJobs: 1, timeoutMs: TIMEOUT_MS })
            await concurrencyPoolRedis.acquireSlotOrEnqueue({ poolId, member: member('p', 'w2'), maxJobs: 1, timeoutMs: TIMEOUT_MS })

            const popped = await concurrencyPoolRedis.releaseSlotAndPopWaiter({ poolId, member: member('p', 'a'), timeoutMs: TIMEOUT_MS })
            expect(popped).toBe('p:w1')
            if (popped === null) throw new Error('expected popped waiter')

            await concurrencyPoolRedis.rollbackPromotion({ poolId, member: popped, timeoutMs: TIMEOUT_MS })

            expect(await redis.zcard(getConcurrencyPoolSetKey(poolId))).toBe(0)
            const waiters = await redis.lrange(getConcurrencyPoolWaitlistKey(poolId), 0, -1)
            expect(waiters).toEqual(['p:w1', 'p:w2'])
        })

        it('A12: new acquire after rollback does not skip ahead of queued waiters', async () => {
            const poolId = `a12-${crypto.randomUUID()}`
            const redis = await redisConnections.useExisting()

            await concurrencyPoolRedis.acquireSlotOrEnqueue({ poolId, member: member('p', 'a'), maxJobs: 1, timeoutMs: TIMEOUT_MS })
            await concurrencyPoolRedis.acquireSlotOrEnqueue({ poolId, member: member('p', 'w1'), maxJobs: 1, timeoutMs: TIMEOUT_MS })

            const popped = await concurrencyPoolRedis.releaseSlotAndPopWaiter({ poolId, member: member('p', 'a'), timeoutMs: TIMEOUT_MS })
            if (popped === null) throw new Error('expected popped waiter')
            await concurrencyPoolRedis.rollbackPromotion({ poolId, member: popped, timeoutMs: TIMEOUT_MS })

            const result = await concurrencyPoolRedis.acquireSlotOrEnqueue({
                poolId,
                member: member('p', 'newcomer'),
                maxJobs: 1,
                timeoutMs: TIMEOUT_MS,
            })

            expect(result).toBe('queued')
            expect(await redis.zcard(getConcurrencyPoolSetKey(poolId))).toBe(0)
            const waiters = await redis.lrange(getConcurrencyPoolWaitlistKey(poolId), 0, -1)
            expect(waiters).toEqual(['p:w1', 'p:newcomer'])
        })

        it('A13: new acquire is queued when capacity exists but waitlist is non-empty', async () => {
            const poolId = `a13-${crypto.randomUUID()}`
            const redis = await redisConnections.useExisting()
            const waitlistKey = getConcurrencyPoolWaitlistKey(poolId)

            await redis.rpush(waitlistKey, 'p:orphan')

            const result = await concurrencyPoolRedis.acquireSlotOrEnqueue({
                poolId,
                member: member('p', 'newcomer'),
                maxJobs: 5,
                timeoutMs: TIMEOUT_MS,
            })

            expect(result).toBe('queued')
            expect(await redis.zcard(getConcurrencyPoolSetKey(poolId))).toBe(0)
            const waiters = await redis.lrange(waitlistKey, 0, -1)
            expect(waiters).toEqual(['p:orphan', 'p:newcomer'])
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
                        concurrencyPoolRedis.acquireSlotOrEnqueue({
                            poolId,
                            member: member('p', `job-${i}`),
                            maxJobs: 10,
                            timeoutMs: TIMEOUT_MS,
                        }),
                    ),
                )

                const acquired = results.filter(r => r === 'acquired').length
                const queued = results.filter(r => r === 'queued').length

                expect(acquired).toBe(10)
                expect(queued).toBe(90)
                expect(await redis.zcard(getConcurrencyPoolSetKey(poolId))).toBe(10)
                expect(await redis.llen(getConcurrencyPoolWaitlistKey(poolId))).toBe(90)
            }
        })

        it('B2: concurrent release storm — pops N distinct waiters when N releases fire', async () => {
            for (let iter = 0; iter < ITERATIONS; iter++) {
                await clearPoolKeys()
                const poolId = `b2-${iter}-${crypto.randomUUID()}`

                for (let i = 0; i < 10; i++) {
                    await concurrencyPoolRedis.acquireSlotOrEnqueue({ poolId, member: member('p', `a-${i}`), maxJobs: 10, timeoutMs: TIMEOUT_MS })
                }
                for (let i = 0; i < 90; i++) {
                    await concurrencyPoolRedis.acquireSlotOrEnqueue({ poolId, member: member('p', `w-${i}`), maxJobs: 10, timeoutMs: TIMEOUT_MS })
                }

                const popped = await Promise.all(
                    Array.from({ length: 10 }, (_, i) =>
                        concurrencyPoolRedis.releaseSlotAndPopWaiter({ poolId, member: member('p', `a-${i}`), timeoutMs: TIMEOUT_MS }),
                    ),
                )

                const nonNull = popped.filter((v): v is string => v !== null)
                expect(nonNull).toHaveLength(10)
                expect(new Set(nonNull).size).toBe(10)

                const redis = await redisConnections.useExisting()
                expect(await redis.zcard(getConcurrencyPoolSetKey(poolId))).toBe(10)
                expect(await redis.llen(getConcurrencyPoolWaitlistKey(poolId))).toBe(80)
            }
        })

        it('B3: interleaved acquires + releases never over-acquire', async () => {
            for (let iter = 0; iter < ITERATIONS; iter++) {
                await clearPoolKeys()
                const poolId = `b3-${iter}-${crypto.randomUUID()}`
                const maxJobs = 10
                const redis = await redisConnections.useExisting()

                for (let i = 0; i < maxJobs; i++) {
                    await concurrencyPoolRedis.acquireSlotOrEnqueue({ poolId, member: member('p', `seed-${i}`), maxJobs, timeoutMs: TIMEOUT_MS })
                }

                const newAcquires = Array.from({ length: 50 }, (_, i) =>
                    concurrencyPoolRedis.acquireSlotOrEnqueue({ poolId, member: member('p', `new-${i}`), maxJobs, timeoutMs: TIMEOUT_MS }),
                )
                const releases = Array.from({ length: 10 }, (_, i) =>
                    concurrencyPoolRedis.releaseSlotAndPopWaiter({ poolId, member: member('p', `seed-${i}`), timeoutMs: TIMEOUT_MS }),
                )

                await Promise.all([...newAcquires, ...releases])

                const cardinality = await redis.zcard(getConcurrencyPoolSetKey(poolId))
                expect(cardinality).toBeLessThanOrEqual(maxJobs)
            }
        })

        it('B4: thundering-herd release pops exactly one waiter per release', async () => {
            const poolId = `b4-${crypto.randomUUID()}`
            const redis = await redisConnections.useExisting()

            await concurrencyPoolRedis.acquireSlotOrEnqueue({ poolId, member: member('p', 'active'), maxJobs: 1, timeoutMs: TIMEOUT_MS })
            for (let i = 0; i < 1000; i++) {
                await concurrencyPoolRedis.acquireSlotOrEnqueue({ poolId, member: member('p', `w-${i}`), maxJobs: 1, timeoutMs: TIMEOUT_MS })
            }

            const popped = await concurrencyPoolRedis.releaseSlotAndPopWaiter({ poolId, member: member('p', 'active'), timeoutMs: TIMEOUT_MS })
            expect(popped).toBe(member('p', 'w-0'))

            expect(await redis.llen(getConcurrencyPoolWaitlistKey(poolId))).toBe(999)
            expect(await redis.zcard(getConcurrencyPoolSetKey(poolId))).toBe(1)
        })

        it('B5: concurrent duplicate member — no duplicates created', async () => {
            for (let iter = 0; iter < ITERATIONS; iter++) {
                await clearPoolKeys()
                const poolId = `b5-${iter}-${crypto.randomUUID()}`
                const redis = await redisConnections.useExisting()

                const dup = member('p', 'duplicate')
                const results = await Promise.all(
                    Array.from({ length: 50 }, () =>
                        concurrencyPoolRedis.acquireSlotOrEnqueue({ poolId, member: dup, maxJobs: 3, timeoutMs: TIMEOUT_MS }),
                    ),
                )

                expect(results.every(r => r === 'acquired')).toBe(true)
                expect(await redis.zcard(getConcurrencyPoolSetKey(poolId))).toBe(1)
                expect(await redis.llen(getConcurrencyPoolWaitlistKey(poolId))).toBe(0)
            }
        })

        it('B6: pool isolation — two pools do not bleed', async () => {
            for (let iter = 0; iter < ITERATIONS; iter++) {
                await clearPoolKeys()
                const pool1 = `b6-p1-${iter}-${crypto.randomUUID()}`
                const pool2 = `b6-p2-${iter}-${crypto.randomUUID()}`
                const redis = await redisConnections.useExisting()

                const p1Acquires = Array.from({ length: 20 }, (_, i) =>
                    concurrencyPoolRedis.acquireSlotOrEnqueue({ poolId: pool1, member: member('p1', `job-${i}`), maxJobs: 3, timeoutMs: TIMEOUT_MS }),
                )
                const p2Acquires = Array.from({ length: 20 }, (_, i) =>
                    concurrencyPoolRedis.acquireSlotOrEnqueue({ poolId: pool2, member: member('p2', `job-${i}`), maxJobs: 5, timeoutMs: TIMEOUT_MS }),
                )
                await Promise.all([...p1Acquires, ...p2Acquires])

                expect(await redis.zcard(getConcurrencyPoolSetKey(pool1))).toBe(3)
                expect(await redis.llen(getConcurrencyPoolWaitlistKey(pool1))).toBe(17)
                expect(await redis.zcard(getConcurrencyPoolSetKey(pool2))).toBe(5)
                expect(await redis.llen(getConcurrencyPoolWaitlistKey(pool2))).toBe(15)
            }
        })

        it('B7: clock-skew safety — future-scored entries are not swept', async () => {
            const poolId = `b7-${crypto.randomUUID()}`
            const redis = await redisConnections.useExisting()
            const setKey = getConcurrencyPoolSetKey(poolId)

            const futureScore = Date.now() + 10_000
            await redis.zadd(setKey, futureScore, 'p:future-1')
            await redis.zadd(setKey, futureScore, 'p:future-2')

            const result = await concurrencyPoolRedis.acquireSlotOrEnqueue({
                poolId,
                member: member('p', 'new'),
                maxJobs: 5,
                timeoutMs: TIMEOUT_MS,
            })
            expect(result).toBe('acquired')

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
                        await concurrencyPoolRedis.releaseSlotAndPopWaiter({ poolId, member: toRelease, timeoutMs: TIMEOUT_MS })
                        released++
                    })
                }
                else {
                    const m = member('p', `job-${i}`)
                    outstanding.add(m)
                    operations.push(async () => {
                        const r = await concurrencyPoolRedis.acquireSlotOrEnqueue({ poolId, member: m, maxJobs, timeoutMs: TIMEOUT_MS })
                        if (r === 'acquired') acquired++
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

            const result = await concurrencyPoolRedis.acquireSlotOrEnqueue({
                poolId,
                member: member('p', 'survivor'),
                maxJobs: 1,
                timeoutMs: shortTimeout,
            })

            expect(result).toBe('acquired')
            const members = await redis.zrange(setKey, 0, -1)
            expect(members).toEqual(['p:survivor'])
        })

        it('D5: high-volume soak — 500 acquire+release operations, final state empty', async () => {
            const poolId = `d5-${crypto.randomUUID()}`
            const redis = await redisConnections.useExisting()

            for (let i = 0; i < 500; i++) {
                const m = member('p', `job-${i}`)
                const r = await concurrencyPoolRedis.acquireSlotOrEnqueue({ poolId, member: m, maxJobs: 10, timeoutMs: TIMEOUT_MS })
                if (r === 'acquired') {
                    await concurrencyPoolRedis.releaseSlotAndPopWaiter({ poolId, member: m, timeoutMs: TIMEOUT_MS })
                }
            }

            expect(await redis.zcard(getConcurrencyPoolSetKey(poolId))).toBe(0)
            expect(await redis.llen(getConcurrencyPoolWaitlistKey(poolId))).toBe(0)
        })
    })
})
