import { FastifyBaseLogger } from 'fastify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { otelQueueMetrics } from '../../../../src/app/helper/otel-queue-metrics'

const { postMock } = vi.hoisted(() => ({ postMock: vi.fn() }))

vi.mock('@activepieces/server-utils', async (importOriginal) => {
    const original = await importOriginal<typeof import('@activepieces/server-utils')>()
    return {
        ...original,
        safeHttp: {
            axios: { post: postMock },
        },
    }
})

const log = { warn: vi.fn() } as unknown as FastifyBaseLogger

describe('otelQueueMetrics.buildGaugePayload', () => {
    it('emits one gauge data point per queue and state', () => {
        const payload = otelQueueMetrics.buildGaugePayload({
            queueCounts: {
                workerJobs: { waiting: 3, active: 1 },
                'platform-group-jobs': { failed: 2 },
            },
            timeUnixNano: '1720000000000000000',
            hostName: 'api-1',
        })

        expect(payload.resourceMetrics).toHaveLength(1)
        const { resource, scopeMetrics } = payload.resourceMetrics[0]
        expect(resource.attributes).toEqual([
            { key: 'service.name', value: { stringValue: 'activepieces-api' } },
            { key: 'host.name', value: { stringValue: 'api-1' } },
        ])

        const metric = scopeMetrics[0].metrics[0]
        expect(metric.name).toBe('bullmq.job.count')
        expect(metric.gauge.dataPoints).toEqual([
            {
                timeUnixNano: '1720000000000000000',
                asInt: '3',
                attributes: [
                    { key: 'queue', value: { stringValue: 'workerJobs' } },
                    { key: 'state', value: { stringValue: 'waiting' } },
                ],
            },
            {
                timeUnixNano: '1720000000000000000',
                asInt: '1',
                attributes: [
                    { key: 'queue', value: { stringValue: 'workerJobs' } },
                    { key: 'state', value: { stringValue: 'active' } },
                ],
            },
            {
                timeUnixNano: '1720000000000000000',
                asInt: '2',
                attributes: [
                    { key: 'queue', value: { stringValue: 'platform-group-jobs' } },
                    { key: 'state', value: { stringValue: 'failed' } },
                ],
            },
        ])
    })
})

describe('otelQueueMetrics.parseOtlpHeaders', () => {
    it('parses comma-separated key=value pairs', () => {
        expect(otelQueueMetrics.parseOtlpHeaders('Authorization=Bearer token,X-Scope-OrgID=tenant-1')).toEqual({
            Authorization: 'Bearer token',
            'X-Scope-OrgID': 'tenant-1',
        })
    })

    it('decodes url-encoded values and skips malformed pairs', () => {
        expect(otelQueueMetrics.parseOtlpHeaders('Authorization=Basic%20abc,noequalsign,=novalue')).toEqual({
            Authorization: 'Basic abc',
        })
    })

    it('keeps percent-encoded commas inside a value intact', () => {
        expect(otelQueueMetrics.parseOtlpHeaders('X-Custom-Header=val1%2Cval2,X-Other=1')).toEqual({
            'X-Custom-Header': 'val1,val2',
            'X-Other': '1',
        })
    })

    it('returns empty object when unset', () => {
        expect(otelQueueMetrics.parseOtlpHeaders(undefined)).toEqual({})
    })
})

describe('otelQueueMetrics.push', () => {
    beforeEach(() => {
        postMock.mockReset()
        postMock.mockResolvedValue({ status: 200 })
        delete process.env.AP_OTEL_ENABLED
        delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT
        delete process.env.OTEL_EXPORTER_OTLP_HEADERS
    })

    afterEach(() => {
        delete process.env.AP_OTEL_ENABLED
        delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT
        delete process.env.OTEL_EXPORTER_OTLP_HEADERS
    })

    it('does nothing when AP_OTEL_ENABLED is not true', async () => {
        process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'http://collector:4318'

        await otelQueueMetrics.push({ log, queueCounts: { workerJobs: { waiting: 1 } } })

        expect(postMock).not.toHaveBeenCalled()
    })

    it('does nothing when no endpoint is configured', async () => {
        process.env.AP_OTEL_ENABLED = 'true'

        await otelQueueMetrics.push({ log, queueCounts: { workerJobs: { waiting: 1 } } })

        expect(postMock).not.toHaveBeenCalled()
    })

    it('posts gauges to <endpoint>/v1/metrics with configured headers', async () => {
        process.env.AP_OTEL_ENABLED = 'true'
        process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'http://collector:4318/'
        process.env.OTEL_EXPORTER_OTLP_HEADERS = 'Authorization=Bearer token'

        await otelQueueMetrics.push({ log, queueCounts: { workerJobs: { waiting: 5 } } })

        expect(postMock).toHaveBeenCalledTimes(1)
        const [url, payload, config] = postMock.mock.calls[0]
        expect(url).toBe('http://collector:4318/v1/metrics')
        expect(payload.resourceMetrics[0].scopeMetrics[0].metrics[0].gauge.dataPoints[0].asInt).toBe('5')
        expect(config.headers).toEqual({ Authorization: 'Bearer token' })
    })

    it('never throws when the collector is unreachable', async () => {
        process.env.AP_OTEL_ENABLED = 'true'
        process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'http://collector:4318'
        postMock.mockRejectedValue(new Error('connect ECONNREFUSED'))

        await expect(otelQueueMetrics.push({ log, queueCounts: { workerJobs: { waiting: 1 } } })).resolves.toBeUndefined()
        expect(log.warn).toHaveBeenCalled()
    })
})
