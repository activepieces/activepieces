import os from 'os'
import { monitorEventLoopDelay } from 'perf_hooks'
import { createLogger } from 'evlog'
import { FastifyBaseLogger } from 'fastify'
import { jobQueue } from '../workers/job-queue/job-queue'

const SNAPSHOT_INTERVAL_MS = 60_000
const NANOS_PER_MS = 1e6

function mbRounded(bytes: number): number {
    return Math.round(bytes / (1024 * 1024))
}

async function buildQueueCounts(log: FastifyBaseLogger): Promise<Record<string, unknown>> {
    try {
        const queues = jobQueue(log).getAllQueues()
        const countEntries = await Promise.all(
            queues.map(async (queue): Promise<readonly [string, unknown]> => {
                const counts = await queue.getJobCounts()
                return [queue.name, counts] as const
            }),
        )
        return Object.fromEntries(countEntries)
    }
    catch {
        return { queueCountsError: true }
    }
}

export const systemSnapshot = {
    start({ log }: { log: FastifyBaseLogger }): void {
        const histogram = monitorEventLoopDelay({ resolution: 100 })
        histogram.enable()

        const tick = async (): Promise<void> => {
            try {
                const mem = process.memoryUsage()
                const eventLoopDelayP99Ms = Math.round(histogram.percentile(99) / NANOS_PER_MS)
                histogram.reset()

                const queueCounts = await buildQueueCounts(log)

                const logger = createLogger({
                    event: 'system.snapshot',
                    host: os.hostname(),
                    memRssMb: mbRounded(mem.rss),
                    memHeapUsedMb: mbRounded(mem.heapUsed),
                    memHeapTotalMb: mbRounded(mem.heapTotal),
                    eventLoopDelayP99Ms,
                    queueCounts,
                })
                // Emit with _forceKeep to bypass info-level sampling — snapshots are
                // operational metrics and must always reach the drain regardless of
                // the configured sample rate for the info level.
                logger.emit({ _forceKeep: true })
            }
            catch {
                // Never crash the process from a monitoring tick
            }
        }

        setInterval(() => {
            void tick() 
        }, SNAPSHOT_INTERVAL_MS).unref()
    },
}
