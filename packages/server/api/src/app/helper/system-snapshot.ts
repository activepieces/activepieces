import os from 'os'
import { monitorEventLoopDelay } from 'perf_hooks'
import { ApEdition } from '@activepieces/shared'
import { createLogger } from 'evlog'
import { FastifyBaseLogger } from 'fastify'
import { jobQueue } from '../workers/job-queue/job-queue'
import { appMachineCache } from './app-machine-cache'
import { otelQueueMetrics, QueueCounts } from './otel-queue-metrics'
import { system } from './system/system'

const SNAPSHOT_INTERVAL_MS = 60_000
const NANOS_PER_MS = 1e6

function mbRounded(bytes: number): number {
    return Math.round(bytes / (1024 * 1024))
}

async function buildQueueCounts(log: FastifyBaseLogger): Promise<QueueCounts | null> {
    try {
        const queues = jobQueue(log).getAllQueues()
        const countEntries = await Promise.all(
            queues.map(async (queue) => [queue.name, await queue.getJobCounts()] as const),
        )
        return Object.fromEntries(countEntries)
    }
    catch {
        return null
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
                    queueCounts: queueCounts ?? { queueCountsError: true },
                })
                // Emit with _forceKeep to bypass info-level sampling — snapshots are
                // operational metrics and must always reach the drain regardless of
                // the configured sample rate for the info level.
                logger.emit({ _forceKeep: true })

                // Self-register this app replica so the diagnostics endpoint can list the app tier
                // (apps have no inbound healthcheck to register over). Self-hosted only — on Cloud
                // the diagnostics read is disabled, so the write would have no consumer.
                if (system.getEdition() !== ApEdition.CLOUD) {
                    await appMachineCache.register(eventLoopDelayP99Ms)
                }

                await otelQueueMetrics.push({ log, queueCounts: queueCounts ?? {} })
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
