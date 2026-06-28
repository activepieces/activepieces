import { ConsumeJobRequest } from '@activepieces/shared'
import { Worker as BullMQWorker, Job, Queue } from 'bullmq'
import { FastifyBaseLogger } from 'fastify'
import IORedis from 'ioredis'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { jobAssignmentTracker } from '../../../../../src/app/workers/job-queue/job-assignment-tracker'
import { createQueueDispatcher } from '../../../../../src/app/workers/job-queue/queue-dispatcher'

/**
 * Pins the production invariant: the BullMQ `active` list must never exceed the total number of
 * live worker slots (Σ worker concurrency).
 *
 * The app moves a job wait -> active when a worker polls (getNextJob) — i.e. it owns the job the
 * moment it's dispatched, before the worker has even started it. The job leaves active only when
 * the worker reports completion or the slow stalled-scan reaps it (~minutes). If a worker goes
 * away mid-flight (a deploy stops every worker at once), its dispatched jobs are orphaned in
 * active while the worker reconnects and is handed fresh ones — active accumulates far past
 * concurrency (the prod incident).
 *
 * The fix: the app tracks which jobs each worker holds and, on disconnect, returns them to the
 * queue (jobAssignmentTracker + releaseConnectionJobs). These tests drive the REAL tracker + REAL
 * dispatcher + REAL BullMQ against the local test redis, contrasting abandon-on-stop vs reclaim.
 */

const REDIS_HOST = process.env.AP_REDIS_HOST ?? 'localhost'
const REDIS_PORT = Number(process.env.AP_REDIS_PORT ?? '6379')
const PREFIX = 'ap-active-invariant-test'

const log: FastifyBaseLogger = {
    debug: () => {}, info: () => {}, warn: () => {}, error: () => {},
    fatal: () => {}, trace: () => {}, child: () => log, silent: () => {}, level: 'info',
} as unknown as FastifyBaseLogger

const mkConn = (): IORedis => new IORedis({ host: REDIS_HOST, port: REDIS_PORT, maxRetriesPerRequest: null })

// Keep the stalled-checker effectively disabled for the short test window so the only thing that
// can move a job out of active is an explicit complete/return — isolating the invariant to the
// abandon-vs-reclaim behavior rather than stalled-checker timing.
const WORKER_OPTS = {
    concurrency: 500,
    autorun: false as const,
    lockDuration: 120_000,
    stalledInterval: 120_000,
    maxStalledCount: 3,
    prefix: PREFIX,
}

type SimResult = { maxActive: number, totalConcurrency: number, completed: number, stops: number }

async function runSimulation(params: { queueName: string, workers: number, jobs: number, reclaimOnStop: boolean, durationMs: number }): Promise<SimResult> {
    const { queueName, workers, jobs, reclaimOnStop, durationMs } = params
    jobAssignmentTracker.reset()
    const conn = mkConn()
    const redis = mkConn()
    const queue = new Queue(queueName, { connection: conn, prefix: PREFIX })

    const bullWorker = new BullMQWorker(queueName, undefined, { ...WORKER_OPTS, connection: mkConn() })
    await bullWorker.waitUntilReady()

    // Faithful mini-tryDequeue: getNextJob (wait -> active) and hand back the token.
    const dequeue = async (worker: BullMQWorker): Promise<ConsumeJobRequest | null> => {
        const token = `token-${Date.now()}-${Math.random().toString(36).slice(2)}`
        const job = await worker.getNextJob(token)
        if (!job) return null
        return { jobId: job.id!, jobData: {} as ConsumeJobRequest['jobData'], timeoutInSeconds: 600, attempsStarted: 0, engineToken: 'x', token, queueName }
    }
    const returnJobToQueue = async (jobId: string, token: string): Promise<void> => {
        const job = await Job.fromId(bullWorker, jobId)
        if (job) await job.moveToDelayed(Date.now() + 1, token)
    }
    const completeJob = async (jobId: string, token: string): Promise<void> => {
        const job = await Job.fromId(bullWorker, jobId)
        if (job) await job.moveToCompleted({ ok: true }, token, false)
    }

    const dispatcher = createQueueDispatcher({
        queueName,
        worker: bullWorker,
        dequeue,
        onOrphanedJob: (jobId, token) => returnJobToQueue(jobId, token),
        log,
    })

    await queue.addBulk(Array.from({ length: jobs }, (_, i) => ({ name: `j${i}`, data: { i }, opts: { attempts: 5 } })))

    let maxActive = 0
    let stop = false
    const activeKey = `${PREFIX}:${queueName}:active`
    const sampler = (async () => {
        while (!stop) {
            const n = await redis.llen(activeKey)
            if (n > maxActive) maxActive = n
            await sleep(10)
        }
    })()

    let completed = 0
    let stops = 0
    const deadline = Date.now() + durationMs

    // Each simulated worker = one box, concurrency 1: it holds at most one job at a time. With
    // prob 0.5 it "stops" mid-job (a deploy/restart) instead of looping to the next.
    const workerLoop = async (workerId: string, seed: number): Promise<void> => {
        let rng = seed
        const rand = (): number => {
            rng = (rng * 1103515245 + 12345) & 0x7fffffff
            return rng / 0x7fffffff
        }
        while (Date.now() < deadline) {
            const job = await dispatcher.poll()
            if (!job) {
                await sleep(2)
                continue
            }
            // Mirrors the server: jobBroker.poll records the assignment for this worker.
            jobAssignmentTracker.record({ connectionId: workerId, jobId: job.jobId, token: job.token, queueName: job.queueName })
            const stopMidJob = rand() < 0.5
            if (stopMidJob) {
                stops++
                if (reclaimOnStop) {
                    // The fix: the disconnect handler calls releaseWorkerJobs, which reads this
                    // worker's jobs from the real tracker and returns each to the queue.
                    for (const held of jobAssignmentTracker.takeByConnection(workerId)) {
                        await returnJobToQueue(held.jobId, held.token)
                    }
                }
                // else: stop without reclaiming — job orphaned in `active` (the prod incident).
            }
            else {
                await completeJob(job.jobId, job.token)
                jobAssignmentTracker.clear({ jobId: job.jobId, queueName: job.queueName })
                completed++
            }
        }
    }

    await Promise.all(Array.from({ length: workers }, (_, i) => workerLoop(`w${i + 1}`, i + 1)))
    stop = true
    await sampler

    dispatcher.close()
    await bullWorker.close()
    await queue.close()
    conn.disconnect()
    redis.disconnect()
    return { maxActive, totalConcurrency: workers, completed, stops }
}

function sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms))
}

describe('BullMQ active-list invariant: active <= total worker concurrency', () => {
    beforeAll(async () => {
        const r = mkConn()
        const keys = await r.keys(`${PREFIX}:*`)
        if (keys.length) await r.del(...keys)
        r.disconnect()
    })
    afterAll(async () => {
        const r = mkConn()
        const keys = await r.keys(`${PREFIX}:*`)
        if (keys.length) await r.del(...keys)
        r.disconnect()
    })

    it('REPRODUCES the bug: abandoning the worker\'s jobs on stop makes active far exceed concurrency', async () => {
        const res = await runSimulation({ queueName: 'repro-bug', workers: 4, jobs: 5000, reclaimOnStop: false, durationMs: 5000 })
        // eslint-disable-next-line no-console
        console.log('[abandon-on-stop] maxActive=%d totalConcurrency=%d completed=%d stops=%d', res.maxActive, res.totalConcurrency, res.completed, res.stops)
        expect(res.maxActive).toBeGreaterThan(res.totalConcurrency)
    }, 60_000)

    it('FIX: returning the worker\'s jobs on disconnect keeps active <= concurrency', async () => {
        const res = await runSimulation({ queueName: 'repro-fix', workers: 4, jobs: 5000, reclaimOnStop: true, durationMs: 5000 })
        // eslint-disable-next-line no-console
        console.log('[reclaim-on-stop] maxActive=%d totalConcurrency=%d completed=%d stops=%d', res.maxActive, res.totalConcurrency, res.completed, res.stops)
        expect(res.maxActive).toBeLessThanOrEqual(res.totalConcurrency)
    }, 60_000)
})
