import { describe, expect, it } from 'vitest'
import { ApplicationEventName, FlowRunEvent } from '../../src/lib/ee/audit-events'

const basePayload = {
    id: 'audit-event-id',
    created: '2026-01-01T00:00:00.000Z',
    updated: '2026-01-01T00:00:00.000Z',
    platformId: 'platform-id',
    action: ApplicationEventName.FLOW_RUN_FINISHED,
}

describe('FlowRunEvent', () => {
    it('parses a real production flow run where stepNameToTest is null', () => {
        const payload = {
            ...basePayload,
            data: {
                flowRun: {
                    id: 'flow-run-id',
                    environment: 'production',
                    flowId: 'flow-id',
                    flowVersionId: 'flow-version-id',
                    status: 'SUCCEEDED',
                    stepNameToTest: null,
                },
            },
        }

        expect(FlowRunEvent.safeParse(payload).success).toBe(true)
    })

    it('parses a test-destination flow run where stepNameToTest is undefined', () => {
        const payload = {
            ...basePayload,
            data: {
                flowRun: {
                    id: 'flow-run-id',
                    environment: 'production',
                    flowId: 'flow-id',
                    flowVersionId: 'flow-version-id',
                    status: 'SUCCEEDED',
                },
            },
        }

        expect(FlowRunEvent.safeParse(payload).success).toBe(true)
    })
})
