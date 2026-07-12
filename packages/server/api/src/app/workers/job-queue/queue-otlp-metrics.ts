import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto'
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { FastifyBaseLogger } from 'fastify'
import { jobQueue } from './job-queue'

const COLLECTION_INTERVAL_MS = 30_000

let meterProvider: MeterProvider | undefined

export async function initQueueOtlpMetrics({ log }: { log: FastifyBaseLogger }): Promise<void> {
    const metricExporter = new OTLPMetricExporter()

    meterProvider = new MeterProvider({
        readers: [
            new PeriodicExportingMetricReader({
                exporter: metricExporter,
                exportIntervalMillis: COLLECTION_INTERVAL_MS,
            }),
        ],
    })

    const meter = meterProvider.getMeter('activepieces-queue-metrics', '1.0.0')

    const queueJobsGauge = meter.createObservableGauge('bullmq.queue.jobs', {
        description: 'Number of jobs per state per queue',
    })

    queueJobsGauge.addCallback(async (observableResult) => {
        try {
            const queues = jobQueue(log).getAllQueues()

            for (const queue of queues) {
                try {
                    const counts = await queue.getJobCounts()
                    const baseAttributes = { queue_name: queue.name }

                    for (const [state, value] of Object.entries(counts)) {
                        observableResult.observe(value, { ...baseAttributes, state })
                    }
                }
                catch (err) {
                    log.error({
                        queue: { name: queue.name },
                        err,
                    }, '[queueOtlpMetrics] Failed to collect metrics for queue')
                }
            }
        }
        catch (err) {
            log.error({ err }, '[queueOtlpMetrics] Failed to collect queue metrics')
        }
    })

    log.info('[queueOtlpMetrics] BullMQ queue OTEL metrics exporter initialized')
}

export async function closeQueueOtlpMetrics(): Promise<void> {
    if (meterProvider) {
        await meterProvider.shutdown()
        meterProvider = undefined
    }
}
