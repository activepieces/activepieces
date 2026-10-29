import { ErrorCode } from '@activepieces/core-utils'
import { EngineResponseStatus, FlowTriggerType } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockSubmitAndWaitForResponse = vi.fn()

vi.mock('../../../../../src/app/helper/system/system', () => ({
    system: {
        get: vi.fn(),
        getNumberOrThrow: vi.fn().mockReturnValue(5),
    },
}))

vi.mock('../../../../../src/app/core/db/repo-factory', () => ({
    repoFactory: vi.fn(() => vi.fn()),
}))

vi.mock('../../../../../src/app/file/file.service', () => ({
    fileService: vi.fn(),
}))

vi.mock('../../../../../src/app/flows/flow/flow.service', () => ({
    flowService: vi.fn(),
}))

vi.mock('../../../../../src/app/project/project-service', () => ({
    projectService: vi.fn(() => ({
        getPlatformId: vi.fn().mockResolvedValue('platform-1'),
    })),
}))

vi.mock('../../../../../src/app/workers/user-interaction-watcher', () => ({
    userInteractionWatcher: {
        submitAndWaitForResponse: (...args: unknown[]) => mockSubmitAndWaitForResponse(...args),
    },
}))

import { system } from '../../../../../src/app/helper/system/system'
import { AppSystemProp } from '../../../../../src/app/helper/system/system-props'
import { triggerEventService } from '../../../../../src/app/trigger/trigger-events/trigger-event.service'

const mockLog = { info: vi.fn(), debug: vi.fn(), error: vi.fn(), warn: vi.fn(), child: vi.fn(), fatal: vi.fn(), trace: vi.fn(), silent: vi.fn(), level: 'info' } as never

const PIECE_FLOW = {
    id: 'flow-1',
    version: { id: 'fv-1', trigger: { type: FlowTriggerType.PIECE } },
} as never

describe('triggerEventService.test', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should report a timeout when the test hook times out without an engine error', async () => {
        mockSubmitAndWaitForResponse.mockResolvedValue({ status: EngineResponseStatus.TIMEOUT, response: undefined })

        await expect(
            triggerEventService(mockLog).test({ projectId: 'proj-1', flow: PIECE_FLOW }),
        ).rejects.toMatchObject({
            error: {
                code: ErrorCode.TEST_TRIGGER_FAILED,
                params: { message: 'The trigger timed out after 5 seconds without responding' },
            },
        })
        expect(system.getNumberOrThrow).toHaveBeenCalledWith(AppSystemProp.TRIGGER_HOOKS_TIMEOUT_SECONDS)
    })

    it('should keep the engine error when the test hook fails with one', async () => {
        mockSubmitAndWaitForResponse.mockResolvedValue({ status: EngineResponseStatus.USER_FAILURE, response: undefined, error: 'Engine failed' })

        await expect(
            triggerEventService(mockLog).test({ projectId: 'proj-1', flow: PIECE_FLOW }),
        ).rejects.toMatchObject({
            error: { params: { message: 'Engine failed' } },
        })
    })

    it('should keep the skipped message when the worker skipped the test hook', async () => {
        mockSubmitAndWaitForResponse.mockResolvedValue({ status: EngineResponseStatus.OK, response: undefined })

        await expect(
            triggerEventService(mockLog).test({ projectId: 'proj-1', flow: PIECE_FLOW }),
        ).rejects.toMatchObject({
            error: { params: { message: 'The worker skipped the trigger test hook' } },
        })
    })
})
