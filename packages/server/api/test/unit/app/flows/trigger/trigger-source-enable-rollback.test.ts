import { TriggerStrategy } from '@activepieces/pieces-framework'
import { TriggerSourceScheduleType } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockFindOne = vi.fn()
const mockSoftDelete = vi.fn()
const mockSave = vi.fn()
const mockRemoveRepeatingJob = vi.fn()
const mockSideEffectEnable = vi.fn()
const mockGetPieceTriggerOrThrow = vi.fn()

vi.mock('../../../../../src/app/core/db/repo-factory', () => ({
    repoFactory: vi.fn(() => () => ({
        findOne: mockFindOne,
        softDelete: mockSoftDelete,
        save: mockSave,
    })),
}))

vi.mock('../../../../../src/app/flows/flow-version/flow-version.service', () => ({
    flowVersionService: vi.fn(() => ({})),
}))

vi.mock('../../../../../src/app/template/template-telemetry/template-telemetry.service', () => ({
    templateTelemetryService: vi.fn(() => ({ sendEvent: vi.fn() })),
}))

vi.mock('../../../../../src/app/workers/job-queue/job-queue', () => ({
    jobQueue: vi.fn(() => ({
        removeRepeatingJob: mockRemoveRepeatingJob,
    })),
}))

vi.mock('../../../../../src/app/trigger/trigger-source/flow-trigger-side-effect', () => ({
    flowTriggerSideEffect: vi.fn(() => ({
        enable: mockSideEffectEnable,
    })),
}))

vi.mock('../../../../../src/app/trigger/trigger-source/trigger-utils', () => ({
    triggerUtils: vi.fn(() => ({
        getPieceTriggerOrThrow: mockGetPieceTriggerOrThrow,
    })),
}))

import { triggerSourceService } from '../../../../../src/app/trigger/trigger-source/trigger-source-service'

const mockLog = { info: vi.fn(), warn: vi.fn() } as never

const FLOW_VERSION = {
    id: 'fv-1',
    flowId: 'flow-1',
    trigger: {
        settings: {
            pieceName: '@activepieces/piece-schedule',
            pieceVersion: '0.1.22',
        },
    },
} as never

describe('triggerSourceService.enable rollback', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockGetPieceTriggerOrThrow.mockResolvedValue({
            name: 'every_x_minutes',
            type: TriggerStrategy.POLLING,
        })
        mockFindOne.mockResolvedValue(null)
        mockSave.mockImplementation(async (row: Record<string, unknown>) => row)
    })

    it('soft-deletes the saved trigger source when the side effect fails, so no live row without a schedule survives', async () => {
        mockSideEffectEnable.mockRejectedValue(new Error('Worker did not respond within the safety timeout'))

        await expect(triggerSourceService(mockLog).enable({
            flowVersion: FLOW_VERSION,
            projectId: 'proj-1',
            simulate: false,
        })).rejects.toThrow('Worker did not respond within the safety timeout')

        const savedRow = mockSave.mock.calls[0][0]
        expect(mockSoftDelete).toHaveBeenLastCalledWith({
            id: savedRow.id,
            projectId: 'proj-1',
        })
        expect(mockRemoveRepeatingJob).not.toHaveBeenCalled()
        expect(mockSave).toHaveBeenCalledTimes(1)
    })

    it('rolls back when persisting the schedule fails after the side effect succeeded', async () => {
        mockSideEffectEnable.mockResolvedValue({ scheduleOptions: { type: TriggerSourceScheduleType.INTERVAL, intervalMs: 60_000 } })
        mockSave.mockImplementationOnce(async (row: Record<string, unknown>) => row)
        mockSave.mockRejectedValueOnce(new Error('connection reset'))

        await expect(triggerSourceService(mockLog).enable({
            flowVersion: FLOW_VERSION,
            projectId: 'proj-1',
            simulate: false,
        })).rejects.toThrow('connection reset')

        const savedRow = mockSave.mock.calls[0][0]
        expect(mockSoftDelete).toHaveBeenLastCalledWith({
            id: savedRow.id,
            projectId: 'proj-1',
        })
    })

    it('keeps the trigger source and persists the schedule when the side effect succeeds', async () => {
        const scheduleOptions = { type: TriggerSourceScheduleType.INTERVAL, intervalMs: 60_000 }
        mockSideEffectEnable.mockResolvedValue({ scheduleOptions })

        const result = await triggerSourceService(mockLog).enable({
            flowVersion: FLOW_VERSION,
            projectId: 'proj-1',
            simulate: false,
        })

        expect(result.schedule).toEqual(scheduleOptions)
        expect(mockRemoveRepeatingJob).not.toHaveBeenCalled()
        expect(mockSoftDelete).toHaveBeenCalledTimes(1)
        expect(mockSoftDelete).toHaveBeenCalledWith({
            flowId: 'flow-1',
            projectId: 'proj-1',
            simulate: false,
        })
    })
})
