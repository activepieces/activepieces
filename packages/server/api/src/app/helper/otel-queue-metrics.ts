import os from 'os'
import { tryCatch } from '@activepieces/core-utils'
import { safeHttp } from '@activepieces/server-utils'
import { FastifyBaseLogger } from 'fastify'
import { system } from './system/system'
import { AppSystemProp } from './system/system-props'

function parseOtlpHeaders(raw: string | undefined): Record<string, string> {
    if (!raw) {
        return {}
    }
    const headers: Record<string, string> = {}
    for (const pair of raw.split(',')) {
        const eqIndex = pair.indexOf('=')
        if (eqIndex > 0) {
            const key = decodeURIComponent(pair.slice(0, eqIndex).trim())
            const value = decodeURIComponent(pair.slice(eqIndex + 1).trim())
            if (key && value) {
                headers[key] = value
            }
        }
    }
    return headers
}

function buildGaugePayload({ queueCounts, timeUnixNano, hostName }: BuildGaugePayloadParams): OtlpGaugePayload {
    const dataPoints = Object.entries(queueCounts).flatMap(([queueName, counts]) =>
        Object.entries(counts).map(([state, count]) => ({
            timeUnixNano,
            asInt: String(count),
            attributes: [
                { key: 'queue', value: { stringValue: queueName } },
                { key: 'state', value: { stringValue: state } },
            ],
        })),
    )
    return {
        resourceMetrics: [{
            resource: {
                attributes: [
                    { key: 'service.name', value: { stringValue: 'activepieces-api' } },
                    { key: 'host.name', value: { stringValue: hostName } },
                ],
            },
            scopeMetrics: [{
                scope: { name: 'activepieces.queue-metrics' },
                metrics: [{
                    name: 'bullmq.job.count',
                    description: 'Number of jobs in the queue by state',
                    unit: '{job}',
                    gauge: { dataPoints },
                }],
            }],
        }],
    }
}

async function push({ log, queueCounts }: PushParams): Promise<void> {
    const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
    if (!system.getBoolean(AppSystemProp.OTEL_ENABLED) || !endpoint || Object.keys(queueCounts).length === 0) {
        return
    }
    const payload = buildGaugePayload({
        queueCounts,
        timeUnixNano: String(BigInt(Date.now()) * 1_000_000n),
        hostName: os.hostname(),
    })
    const url = `${endpoint.replace(/\/$/, '')}/v1/metrics`
    const { error } = await tryCatch(() => safeHttp.axios.post(url, payload, {
        headers: parseOtlpHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS),
        timeout: 5000,
    }))
    if (error) {
        log.warn({ error: error.message }, '[otelQueueMetrics#push] failed to export queue metrics')
    }
}

export const otelQueueMetrics = {
    push,
    buildGaugePayload,
    parseOtlpHeaders,
}

export type QueueCounts = Record<string, Record<string, number>>

type PushParams = {
    log: FastifyBaseLogger
    queueCounts: QueueCounts
}

type BuildGaugePayloadParams = {
    queueCounts: QueueCounts
    timeUnixNano: string
    hostName: string
}

type OtlpAttribute = {
    key: string
    value: { stringValue: string }
}

type OtlpGaugePayload = {
    resourceMetrics: Array<{
        resource: { attributes: OtlpAttribute[] }
        scopeMetrics: Array<{
            scope: { name: string }
            metrics: Array<{
                name: string
                description: string
                unit: string
                gauge: { dataPoints: Array<{ timeUnixNano: string, asInt: string, attributes: OtlpAttribute[] }> }
            }>
        }>
    }>
}
