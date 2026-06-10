import { TriggerStrategy } from '@activepieces/pieces-framework'
import {
    ActivepiecesError,
    ApEnvironment,
    EngineResponseStatus,
    ErrorCode,
} from '@activepieces/shared'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSubmitAndWaitForResponse = vi.fn()
const mockGetPlatformId = vi.fn().mockResolvedValue('platform-1')
const mockDeleteListeners = vi.fn()
const mockRemoveRepeatingJob = vi.fn()

vi.mock('../../../../../src/app/helper/system/system', () => ({
    system: {
        getOrThrow: vi.fn().mockReturnValue(ApEnvironment.PRODUCTION),
        getNumber: vi.fn().mockReturnValue(5),
    },
}))

vi.mock('../../../../../src/app/project/project-service', () => ({
    projectService: vi.fn(() => ({
        getPlatformId: mockGetPlatformId,
    })),
}))

vi.mock('../../../../../src/app/workers/user-interaction-watcher', () => ({
    userInteractionWatcher: {
        submitAndWaitForResponse: (...args: unknown[]) => mockSubmitAndWaitForResponse(...args),
    },
}))

vi.mock('../../../../../src/app/workers/job-queue/job-queue', () => ({
    jobQueue: vi.fn(() => ({
        removeRepeatingJob: mockRemoveRepeatingJob,
    })),
    JobType: { ONE_TIME: 'ONE_TIME', REPEATING: 'REPEATING' },
}))

vi.mock('../../../../../src/app/trigger/app-event-routing/app-event-routing.service', () => ({
    appEventRoutingService: {
        deleteListeners: (...args: unknown[]) => mockDeleteListeners(...args),
    },
}))

import { flowTriggerSideEffect } from '../../../../../src/app/trigger/trigger-source/flow-trigger-side-effect'

const mockLog = {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    child: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
    silent: vi.fn(),
    level: 'info',
} as any

const BASE_PARAMS = {
    flowId: 'flow-1',
    flowVersionId: 'fv-1',
    pieceName: '@activepieces/piece-test',
    projectId: 'proj-1',
    simulate: false,
}

function makePollingTrigger() {
    return {
        name: 'test_trigger',
        displayName: 'Test Trigger',
        description: 'Test',
        props: {},
        requireAuth: false,
        type: TriggerStrategy.POLLING,
        sampleData: {},
        testStrategy: 'TEST_FUNCTION',
    } as any
}

function makeManualTrigger() {
    return {
        ...makePollingTrigger(),
        type: TriggerStrategy.MANUAL,
    }
}

function okEngineResponse() {
    return {
        status: EngineResponseStatus.OK,
        response: {},
        error: undefined,
    }
}

function failedEngineResponse() {
    return {
        status: EngineResponseStatus.ERROR,
        response: undefined,
        error: 'Engine failed',
    }
}

describe('flowTriggerSideEffect', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockGetPlatformId.mockResolvedValue('platform-1')
    })

    describe('disable', () => {
        it('should complete successfully when engine responds OK', async () => {
            mockSubmitAndWaitForResponse.mockResolvedValue(okEngineResponse())

            await flowTriggerSideEffect(mockLog).disable({
                ...BASE_PARAMS,
                pieceTrigger: makeManualTrigger(),
                ignoreError: false,
            })

            expect(mockSubmitAndWaitForResponse).toHaveBeenCalledOnce()
        })

        it('should throw when engine response is bad and ignoreError is false', async () => {
            mockSubmitAndWaitForResponse.mockResolvedValue(failedEngineResponse())

            await expect(
                flowTriggerSideEffect(mockLog).disable({
                    ...BASE_PARAMS,
                    pieceTrigger: makeManualTrigger(),
                    ignoreError: false,
                }),
            ).rejects.toThrow(ActivepiecesError)
        })

        it('should not throw when engine response is bad and ignoreError is true', async () => {
            mockSubmitAndWaitForResponse.mockResolvedValue(failedEngineResponse())

            await flowTriggerSideEffect(mockLog).disable({
                ...BASE_PARAMS,
                pieceTrigger: makeManualTrigger(),
                ignoreError: true,
            })
        })

        it('should throw when submitAndWaitForResponse throws and ignoreError is false', async () => {
            mockSubmitAndWaitForResponse.mockRejectedValue(
                new ActivepiecesError({
                    code: ErrorCode.ENGINE_OPERATION_FAILURE,
                    params: { message: 'Worker did not respond within the safety timeout' },
                }),
            )

            await expect(
                flowTriggerSideEffect(mockLog).disable({
                    ...BASE_PARAMS,
                    pieceTrigger: makeManualTrigger(),
                    ignoreError: false,
                }),
            ).rejects.toThrow(ActivepiecesError)
        })

        it('should not throw when submitAndWaitForResponse throws and ignoreError is true', async () => {
            mockSubmitAndWaitForResponse.mockRejectedValue(
                new ActivepiecesError({
                    code: ErrorCode.ENGINE_OPERATION_FAILURE,
                    params: { message: 'Worker did not respond within the safety timeout' },
                }),
            )

            await flowTriggerSideEffect(mockLog).disable({
                ...BASE_PARAMS,
                pieceTrigger: makeManualTrigger(),
                ignoreError: true,
            })

            expect(mockLog.warn).toHaveBeenCalledWith(
                expect.objectContaining({ flowId: 'flow-1' }),
                expect.stringContaining('Ignored error'),
            )
        })

        it('should still remove repeating job for polling trigger when engine call fails and ignoreError is true', async () => {
            mockSubmitAndWaitForResponse.mockRejectedValue(new Error('timeout'))

            await flowTriggerSideEffect(mockLog).disable({
                ...BASE_PARAMS,
                pieceTrigger: makePollingTrigger(),
                ignoreError: true,
            })

            expect(mockRemoveRepeatingJob).toHaveBeenCalledWith({
                flowVersionId: 'fv-1',
            })
        })

        it('should still delete app event listeners when engine call fails and ignoreError is true', async () => {
            mockSubmitAndWaitForResponse.mockRejectedValue(new Error('timeout'))

            await flowTriggerSideEffect(mockLog).disable({
                ...BASE_PARAMS,
                pieceTrigger: {
                    ...makePollingTrigger(),
                    type: TriggerStrategy.APP_WEBHOOK,
                },
                ignoreError: true,
            })

            expect(mockDeleteListeners).toHaveBeenCalledWith({
                projectId: 'proj-1',
                flowId: 'flow-1',
            })
        })
    })
})
