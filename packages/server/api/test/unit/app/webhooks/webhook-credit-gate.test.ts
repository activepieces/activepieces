import { FlowStatus, RunEnvironment } from '@activepieces/shared'
import { StatusCodes } from 'http-status-codes'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { WebhookFlowVersionToRun } from '../../../../src/app/webhooks/webhook.service'

const { mockShouldBlockRunOnCredits, mockStart, mockCreateQuotaExceededRun, mockFindOneBy, mockOneTimeListener } = vi.hoisted(() => ({
    mockShouldBlockRunOnCredits: vi.fn(),
    mockStart: vi.fn(),
    mockCreateQuotaExceededRun: vi.fn(),
    mockFindOneBy: vi.fn(),
    mockOneTimeListener: vi.fn(),
}))

vi.mock('@activepieces/server-utils', () => ({
    wideEvent: { set: vi.fn(), error: vi.fn() },
}))

vi.mock('../../../../src/app/helper/system/system', () => ({
    system: {
        getNumberOrThrow: vi.fn().mockReturnValue(30),
        get: vi.fn(),
        getBoolean: vi.fn().mockReturnValue(false),
        getEdition: vi.fn().mockReturnValue('cloud'),
    },
}))

vi.mock('../../../../src/app/platform/billing-provider', () => ({
    shouldBlockRunOnCredits: mockShouldBlockRunOnCredits,
}))

vi.mock('../../../../src/app/flows/flow-run/flow-run-service', () => ({
    flowRunService: () => ({
        start: mockStart,
        createQuotaExceededRun: mockCreateQuotaExceededRun,
    }),
}))

vi.mock('../../../../src/app/flows/flow-version/flow-version.service', () => ({
    flowVersionRepo: () => ({ findOneBy: mockFindOneBy }),
}))

vi.mock('../../../../src/app/flows/flow/flow-execution-cache', () => ({
    flowExecutionCache: () => ({
        get: vi.fn().mockResolvedValue({
            exists: true,
            platformId: 'plat-1',
            handshakeConfiguration: undefined,
            flow: {
                id: 'flow-1',
                projectId: 'proj-1',
                status: FlowStatus.ENABLED,
                publishedVersionId: 'ver-1',
            },
        }),
    }),
}))

vi.mock('../../../../src/app/workers/engine-response-watcher', () => ({
    engineResponseWatcher: () => ({
        getServerId: vi.fn().mockReturnValue('worker-1'),
        oneTimeListener: mockOneTimeListener,
    }),
}))

vi.mock('../../../../src/app/workers/payload-offloader', () => ({
    payloadOffloader: { getPayloadSizeInBytes: vi.fn().mockReturnValue(128) },
}))

vi.mock('../../../../src/app/helper/logger', () => ({
    pinoLogging: {
        createWebhookContextLog: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
    },
}))

vi.mock('../../../../src/app/helper/promise-handler', () => ({
    rejectedPromiseHandler: vi.fn(),
}))

vi.mock('../../../../src/app/trigger/trigger-source/trigger-source-service', () => ({
    triggerSourceService: () => ({}),
}))

vi.mock('../../../../src/app/workers/job-queue/job-queue', () => ({
    jobQueue: () => ({ add: vi.fn() }),
    JobType: { ONE_TIME: 'ONE_TIME' },
}))

vi.mock('../../../../src/app/webhooks/webhook-handshake', () => ({
    webhookHandshake: { handleHandshakeRequest: vi.fn().mockResolvedValue(null) },
}))

const noopLogger = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }

async function callSyncWebhook() {
    const { webhookService } = await import('../../../../src/app/webhooks/webhook.service')
    return webhookService.handleWebhook({
        logger: noopLogger as never,
        data: vi.fn(),
        flowId: 'flow-1',
        async: false,
        saveSampleData: false,
        flowVersionToRun: WebhookFlowVersionToRun.LOCKED_FALL_BACK_TO_LATEST,
        payload: { body: {}, headers: {}, queryParams: {}, method: 'POST' },
        execute: true,
        onRunCreated: undefined,
        parentRunId: undefined,
        failParentOnFailure: false,
        timeoutMs: undefined,
    } as never)
}

describe('sync webhook credit gate', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockFindOneBy.mockResolvedValue({ id: 'ver-1', flowId: 'flow-1' })
        mockCreateQuotaExceededRun.mockResolvedValue({ id: 'run-quota' })
        mockStart.mockResolvedValue({ id: 'run-1' })
        mockOneTimeListener.mockResolvedValue({ status: StatusCodes.OK, body: { ok: true }, headers: {} })
    })

    it('answers 402 instead of running the flow when the platform is out of credits', async () => {
        mockShouldBlockRunOnCredits.mockResolvedValue(true)

        const response = await callSyncWebhook()

        expect(response.status).toBe(StatusCodes.PAYMENT_REQUIRED)
        expect(mockStart).not.toHaveBeenCalled()
    })

    it('still persists the trigger payload as a retryable run when out of credits', async () => {
        mockShouldBlockRunOnCredits.mockResolvedValue(true)

        await callSyncWebhook()

        expect(mockCreateQuotaExceededRun).toHaveBeenCalledTimes(1)
        expect(mockCreateQuotaExceededRun.mock.calls[0][0]).toMatchObject({
            projectId: 'proj-1',
            environment: RunEnvironment.PRODUCTION,
            shouldExecuteTriggerOnRetry: true,
        })
        expect(mockCreateQuotaExceededRun.mock.calls[0][0].payload).toBeDefined()
    })

    it('runs the flow and returns the engine response when the gate lets it through', async () => {
        mockShouldBlockRunOnCredits.mockResolvedValue(false)

        const response = await callSyncWebhook()

        expect(mockStart).toHaveBeenCalledTimes(1)
        expect(mockCreateQuotaExceededRun).not.toHaveBeenCalled()
        expect(response.status).toBe(StatusCodes.OK)
        expect(response.body).toEqual({ ok: true })
    })

    it('checks the gate against the platform and the production environment', async () => {
        mockShouldBlockRunOnCredits.mockResolvedValue(false)

        await callSyncWebhook()

        expect(mockShouldBlockRunOnCredits.mock.calls[0][0]).toMatchObject({
            platformId: 'plat-1',
            environment: RunEnvironment.PRODUCTION,
        })
    })
})
