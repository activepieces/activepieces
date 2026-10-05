import { otlpLogs, PostForStatusFailure, safeHttp } from '@activepieces/server-utils'
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
    let postSpy: ReturnType<typeof vi.spyOn<typeof safeHttp, 'postForStatus'>>

    beforeEach(() => {
        postSpy = vi.spyOn(safeHttp, 'postForStatus').mockResolvedValue({ responded: true, status: 200 })
    })

    afterEach(() => {
        postSpy.mockRestore()
    })

    it('posts a job without a content type as JSON', async () => {
        const payload = { action: 'flow.created', platformId: 'platform-1' }

        await eventDestinationJob.execute(makeContext(), makeJobData({ payload }))

        expect(postSpy).toHaveBeenCalledWith({
            url: 'https://example.com/webhook',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            timeoutMs: 10000,
        })
    })

    it('encodes the queued OTLP/JSON request to protobuf bytes for a protobuf job', async () => {
        const payload = {
            resourceLogs: [{
                scopeLogs: [{
                    logRecords: [{ timeUnixNano: '1790158542318000000', eventName: 'flow.created' }],
                }],
            }],
        }

        await eventDestinationJob.execute(makeContext(), makeJobData({ payload, contentType: 'application/x-protobuf' }))

        const sent = postSpy.mock.calls[0][0]
        expect(sent.headers).toEqual({ 'Content-Type': 'application/x-protobuf' })
        expect(Buffer.isBuffer(sent.body)).toBe(true)
        expect(sent.body).toEqual(Buffer.from(otlpLogs.encodeExportRequest(payload)))
    })

    it('logs why a delivery did not reach the destination', async () => {
        postSpy.mockResolvedValue({ responded: false, failure: PostForStatusFailure.TIMEOUT, error: new Error('the destination did not answer') })
        const ctx = makeContext()

        await eventDestinationJob.execute(ctx, makeJobData({}))

        expect(ctx.log.error).toHaveBeenCalledWith(expect.objectContaining({
            webhook: { id: 'destination-1', deliveryFailure: PostForStatusFailure.TIMEOUT },
            error: 'the destination did not answer',
        }), 'Event destination delivery failed before reaching the destination')
    })
})

function makeContext(): JobContext {
    return {
        log: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
    } as unknown as JobContext
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

