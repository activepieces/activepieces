import { otlpLogs, safeHttp } from '@activepieces/server-utils'
import { EventDestinationJobData, WorkerJobType } from '@activepieces/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../../src/lib/config/worker-settings', () => ({
    workerSettings: {
        getSettings: vi.fn().mockReturnValue({ EVENT_DESTINATION_TIMEOUT_SECONDS: 10 }),
    },
}))

import { eventDestinationJob } from '../../../../src/lib/execute/jobs/event-destination'
import { JobContext } from '../../../../src/lib/execute/types'

describe('eventDestinationJob', () => {
    let requestSpy: ReturnType<typeof vi.spyOn<typeof safeHttp.axios, 'request'>>

    beforeEach(() => {
        requestSpy = vi.spyOn(safeHttp.axios, 'request').mockResolvedValue({ status: 200 })
    })

    afterEach(() => {
        requestSpy.mockRestore()
    })

    it('posts a job without hasHeaders as JSON and never calls the API for headers', async () => {
        const { ctx, resolveHeaders } = makeContext({ headers: { Authorization: 'Bearer unused' } })
        const payload = { action: 'flow.created', platformId: 'platform-1' }

        await eventDestinationJob.execute(ctx, makeJobData({ payload }))

        expect(resolveHeaders).not.toHaveBeenCalled()
        expect(requestSpy).toHaveBeenCalledWith(expect.objectContaining({
            url: 'https://example.com/webhook',
            headers: { 'Content-Type': 'application/json' },
            data: payload,
        }))
    })

    it('resolves and sends the stored headers when the job says the destination has them', async () => {
        const { ctx, resolveHeaders } = makeContext({ headers: { Authorization: 'Bearer secret' } })

        await eventDestinationJob.execute(ctx, makeJobData({ hasHeaders: true }))

        expect(resolveHeaders).toHaveBeenCalledWith({ platformId: 'platform-1', destinationId: 'destination-1' })
        expect(requestSpy.mock.calls[0][0].headers).toEqual({ 'Content-Type': 'application/json', Authorization: 'Bearer secret' })
    })

    it('drops the event when the destination was deleted before delivery', async () => {
        const { ctx } = makeContext({ headers: null })

        await eventDestinationJob.execute(ctx, makeJobData({ hasHeaders: true }))

        expect(requestSpy).not.toHaveBeenCalled()
    })

    it('encodes the queued OTLP/JSON request to protobuf bytes for a protobuf job', async () => {
        const { ctx } = makeContext({ headers: null })
        const payload = {
            resourceLogs: [{
                scopeLogs: [{
                    logRecords: [{ timeUnixNano: '1790158542318000000', eventName: 'flow.created' }],
                }],
            }],
        }

        await eventDestinationJob.execute(ctx, makeJobData({ payload, contentType: 'application/x-protobuf' }))

        const sent = requestSpy.mock.calls[0][0]
        expect(sent.headers).toEqual({ 'Content-Type': 'application/x-protobuf' })
        expect(Buffer.isBuffer(sent.data)).toBe(true)
        expect(sent.data).toEqual(Buffer.from(otlpLogs.encodeExportRequest(payload)))
    })
})

function makeContext({ headers }: { headers: Record<string, string> | null }) {
    const resolveHeaders = vi.fn().mockResolvedValue(headers === null ? null : { headers })
    const ctx = {
        apiClient: { resolveEventDestinationHeaders: resolveHeaders },
        log: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
    } as unknown as JobContext
    return { ctx, resolveHeaders }
}

function makeJobData(overrides: Partial<EventDestinationJobData>): EventDestinationJobData {
    return {
        schemaVersion: 1,
        platformId: 'platform-1',
        webhookId: 'destination-1',
        webhookUrl: 'https://example.com/webhook',
        payload: {},
        jobType: WorkerJobType.EVENT_DESTINATION,
        ...overrides,
    }
}

