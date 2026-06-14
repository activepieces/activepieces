import os from 'os'
import { monitorEventLoopDelay } from 'perf_hooks'
import { createLogger } from 'evlog'
import { system, WorkerSystemProp } from '../config/configs'

const SNAPSHOT_INTERVAL_MS = 60_000
const NANOS_PER_MS = 1e6

function mbRounded(bytes: number): number {
    return Math.round(bytes / (1024 * 1024))
}

export const workerSystemSnapshot = {
    start(): void {
        const histogram = monitorEventLoopDelay({ resolution: 100 })
        histogram.enable()

        const concurrency = parseInt(system.get(WorkerSystemProp.WORKER_CONCURRENCY) ?? '1', 10)

        const tick = (): void => {
            try {
                const mem = process.memoryUsage()
                const eventLoopDelayP99Ms = Math.round(histogram.percentile(99) / NANOS_PER_MS)
                histogram.reset()

                const logger = createLogger({
                    event: 'system.snapshot',
                    host: os.hostname(),
                    memRssMb: mbRounded(mem.rss),
                    memHeapUsedMb: mbRounded(mem.heapUsed),
                    memHeapTotalMb: mbRounded(mem.heapTotal),
                    eventLoopDelayP99Ms,
                    workerConcurrency: concurrency,
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

        setInterval(tick, SNAPSHOT_INTERVAL_MS).unref()
    },
}
