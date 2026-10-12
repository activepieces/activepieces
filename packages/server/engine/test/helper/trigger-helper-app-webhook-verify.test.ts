import { TriggerStrategy } from '@activepieces/pieces-framework'
import { ExecuteTriggerResponse, FlowVersionState, TriggerHookType } from '@activepieces/shared'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'

const { mockGetPieceAndTriggerOrThrow } = vi.hoisted(() => ({
    mockGetPieceAndTriggerOrThrow: vi.fn(),
}))
vi.mock('../../src/lib/helper/piece-loader', () => ({
    pieceLoader: {
        getPieceAndTriggerOrThrow: mockGetPieceAndTriggerOrThrow,
    },
}))

import { EngineConstants, ResolvedExecuteTriggerOperation } from '../../src/lib/handler/context/engine-constants'
import { triggerHelper } from '../../src/lib/helper/trigger-helper'

function makeRunOperation(): ResolvedExecuteTriggerOperation<TriggerHookType.RUN> {
    return {
        hookType: TriggerHookType.RUN,
        test: false,
        webhookUrl: 'http://127.0.0.1:3000/api/v1/webhooks/flow-1',
        appWebhookUrl: 'http://127.0.0.1:3000/api/v1/app-events/piece-under-test',
        webhookSecret: 'app-webhook-secret',
        triggerPayload: {
            body: { event: 'forged' },
            rawBody: '{"event":"forged"}',
            headers: { 'x-signature': 'not-a-valid-signature' },
            queryParams: {},
        },
        flowVersion: {
            id: 'flow-version-1',
            flowId: 'flow-1',
            state: FlowVersionState.LOCKED,
            trigger: {
                name: 'trigger',
                type: 'PIECE_TRIGGER',
                valid: true,
                displayName: 'App event',
                settings: {
                    pieceName: '@activepieces/piece-under-test',
                    pieceVersion: '1.0.0',
                    triggerName: 'new_event',
                    input: {},
                    propertySettings: {},
                },
            },
        },
        projectId: 'project-1',
        platformId: 'platform-1',
        engineToken: 'engine-token',
        internalApiUrl: 'http://127.0.0.1:3000/api/',
        publicApiUrl: 'http://127.0.0.1:4200/api/',
        timeoutInSeconds: 30,
    } as unknown as ResolvedExecuteTriggerOperation<TriggerHookType.RUN>
}

function mockAppWebhookPiece({ verify }: { verify: (() => unknown) | undefined }): { run: Mock } {
    const run = vi.fn().mockResolvedValue([{ event: 'forged' }])
    mockGetPieceAndTriggerOrThrow.mockResolvedValue({
        piece: {
            auth: undefined,
            events: verify === undefined ? undefined : { verify, parseAndReply: vi.fn() },
        },
        pieceTrigger: {
            type: TriggerStrategy.APP_WEBHOOK,
            props: {},
            requireAuth: false,
            run,
        },
    })
    return { run }
}

async function executeRun(): Promise<ExecuteTriggerResponse<TriggerHookType>> {
    const params = makeRunOperation()
    return triggerHelper.executeTrigger({ params, constants: EngineConstants.fromExecuteTriggerInput(params) })
}

describe('APP_WEBHOOK signature verification gate', () => {
    beforeEach(() => {
        mockGetPieceAndTriggerOrThrow.mockReset()
    })

    it('rejects the event when verify returns false', async () => {
        const { run } = mockAppWebhookPiece({ verify: () => false })
        await expect(executeRun()).rejects.toThrow('Webhook is not verified')
        expect(run).not.toHaveBeenCalled()
    })

    it('rejects the event when verify returns undefined', async () => {
        const { run } = mockAppWebhookPiece({ verify: () => undefined })
        await expect(executeRun()).rejects.toThrow('Webhook is not verified')
        expect(run).not.toHaveBeenCalled()
    })

    it('rejects the event when verify returns a truthy value that is not true', async () => {
        const { run } = mockAppWebhookPiece({ verify: () => 'true' })
        await expect(executeRun()).rejects.toThrow('Webhook is not verified')
        expect(run).not.toHaveBeenCalled()
    })

    it('rejects the event when the piece has no verify handler', async () => {
        const { run } = mockAppWebhookPiece({ verify: undefined })
        await expect(executeRun()).rejects.toThrow('Webhook is not verified')
        expect(run).not.toHaveBeenCalled()
    })

    it('runs the trigger when verify returns true', async () => {
        const { run } = mockAppWebhookPiece({ verify: () => true })
        const response = await executeRun()
        expect(run).toHaveBeenCalledTimes(1)
        expect(response).toEqual({ output: [{ event: 'forged' }] })
    })
})
