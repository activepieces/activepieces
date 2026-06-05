import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
    FlowTriggerType,
    FlowVersionState,
    TriggerHookType,
} from '@activepieces/shared'
import type { ExecuteTriggerOperation, FlowVersion } from '@activepieces/shared'

const { mockGetPayloadFile } = vi.hoisted(() => ({
    mockGetPayloadFile: vi.fn(),
}))
vi.mock('../../src/lib/helper/payload-file-client', () => ({
    payloadFileClient: {
        get: mockGetPayloadFile,
    },
}))

const { mockExecuteTrigger } = vi.hoisted(() => ({
    mockExecuteTrigger: vi.fn(),
}))
vi.mock('../../src/lib/helper/trigger-helper', () => ({
    triggerHelper: {
        executeTrigger: mockExecuteTrigger,
    },
}))

import { triggerHookOperation } from '../../src/lib/operations/trigger-hook.operation'

function makeFlowVersion(): FlowVersion {
    return {
        id: 'fv-1',
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-01T00:00:00Z',
        flowId: 'flow-1',
        displayName: 'Test Flow',
        trigger: {
            name: 'trigger_1',
            valid: true,
            displayName: 'Test Trigger',
            type: FlowTriggerType.EMPTY,
            settings: {},
        },
        updatedBy: null,
        valid: true,
        state: FlowVersionState.DRAFT,
        schemaVersion: null,
        connectionIds: [],
        agentIds: [],
    } as unknown as FlowVersion
}

function makeOperation(triggerPayload: ExecuteTriggerOperation<TriggerHookType.RUN>['triggerPayload']): ExecuteTriggerOperation<TriggerHookType.RUN> {
    return {
        hookType: TriggerHookType.RUN,
        test: false,
        flowVersion: makeFlowVersion(),
        webhookUrl: 'http://localhost:4200/webhook',
        triggerPayload,
        projectId: 'project-1',
        platformId: 'platform-1',
        engineToken: 'test-token',
        internalApiUrl: 'http://localhost:3000/',
        publicApiUrl: 'http://localhost:4200/api/',
        timeoutInSeconds: 30,
    } as unknown as ExecuteTriggerOperation<TriggerHookType.RUN>
}

describe('triggerHookOperation payload resolution', () => {
    beforeEach(() => {
        mockGetPayloadFile.mockReset()
        mockExecuteTrigger.mockReset()
        mockExecuteTrigger.mockResolvedValue({ success: true, output: [] })
    })

    it('forwards an inline payload without hitting the engine file client', async () => {
        await triggerHookOperation.execute(makeOperation({ type: 'inline', value: { hello: 'world' } }))

        expect(mockGetPayloadFile).not.toHaveBeenCalled()
        expect(mockExecuteTrigger).toHaveBeenCalledTimes(1)
        expect(mockExecuteTrigger.mock.calls[0][0].params.triggerPayload).toEqual({ hello: 'world' })
    })

    it('downloads a ref payload via the engine file client and forwards the parsed value', async () => {
        mockGetPayloadFile.mockResolvedValue(Buffer.from(JSON.stringify({ hello: 'ref' })))

        await triggerHookOperation.execute(makeOperation({ type: 'ref', fileId: 'payload-file-1' }))

        expect(mockGetPayloadFile).toHaveBeenCalledWith({
            apiUrl: 'http://localhost:3000/',
            engineToken: 'test-token',
            fileId: 'payload-file-1',
        })
        expect(mockExecuteTrigger.mock.calls[0][0].params.triggerPayload).toEqual({ hello: 'ref' })
    })

    it('forwards an undefined payload without hitting the engine file client', async () => {
        await triggerHookOperation.execute(makeOperation(undefined))

        expect(mockGetPayloadFile).not.toHaveBeenCalled()
        expect(mockExecuteTrigger.mock.calls[0][0].params.triggerPayload).toBeUndefined()
    })
})
