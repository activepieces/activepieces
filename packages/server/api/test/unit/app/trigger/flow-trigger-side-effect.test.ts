import { TriggerBase, TriggerStrategy, WebhookHandshakeStrategy, WebhookRenewStrategy } from '@activepieces/pieces-framework'
import { ApEnvironment, EngineResponseStatus, TriggerTestStrategy } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flowTriggerSideEffect } from '../../../../src/app/trigger/trigger-source/flow-trigger-side-effect'

const { mockDeleteListeners } = vi.hoisted(() => ({
    mockDeleteListeners: vi.fn(),
}))

vi.mock('../../../../src/app/helper/system/system', () => ({
    system: {
        getOrThrow: vi.fn().mockReturnValue(ApEnvironment.PRODUCTION),
    },
}))

vi.mock('../../../../src/app/project/project-service', () => ({
    projectService: () => ({
        getPlatformId: vi.fn().mockResolvedValue('platform-id'),
    }),
}))

vi.mock('../../../../src/app/workers/user-interaction-watcher', () => ({
    userInteractionWatcher: {
        submitAndWaitForResponse: vi.fn().mockResolvedValue({ status: EngineResponseStatus.OK }),
    },
}))

vi.mock('../../../../src/app/workers/job-queue/job-queue', () => ({
    jobQueue: () => ({ removeRepeatingJob: vi.fn() }),
    JobType: {},
}))

vi.mock('../../../../src/app/trigger/app-event-routing/app-event-routing.service', () => ({
    appEventRoutingService: {
        deleteListeners: mockDeleteListeners,
        createListeners: vi.fn(),
    },
}))

describe('flowTriggerSideEffect.disable for an app webhook trigger', () => {
    beforeEach(() => {
        mockDeleteListeners.mockReset()
    })

    it('keeps the app event listeners when the other source of the flow still uses them', async () => {
        await disableAppWebhookTrigger({ keepAppEventListeners: true })

        expect(mockDeleteListeners).not.toHaveBeenCalled()
    })

    it('deletes the app event listeners when no other source of the flow uses them', async () => {
        await disableAppWebhookTrigger({ keepAppEventListeners: false })

        expect(mockDeleteListeners).toHaveBeenCalledWith({ projectId: 'project-id', flowId: 'flow-id' })
    })
})

function disableAppWebhookTrigger({ keepAppEventListeners }: { keepAppEventListeners: boolean }): Promise<void> {
    return flowTriggerSideEffect(silentLog).disable({
        flowId: 'flow-id',
        flowVersionId: 'flow-version-id',
        projectId: 'project-id',
        pieceName: '@activepieces/piece-slack',
        pieceTrigger: APP_WEBHOOK_TRIGGER,
        simulate: true,
        ignoreError: true,
        keepAppEventListeners,
    })
}

const silentLog: FastifyBaseLogger = {
    level: 'silent',
    fatal: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    silent: vi.fn(),
    child: () => silentLog,
}

const APP_WEBHOOK_TRIGGER: TriggerBase = {
    name: 'new_message',
    displayName: 'New Message',
    description: 'App webhook trigger',
    requireAuth: false,
    props: {},
    type: TriggerStrategy.APP_WEBHOOK,
    handshakeConfiguration: { strategy: WebhookHandshakeStrategy.NONE },
    renewConfiguration: { strategy: WebhookRenewStrategy.NONE },
    sampleData: {},
    testStrategy: TriggerTestStrategy.SIMULATION,
}
