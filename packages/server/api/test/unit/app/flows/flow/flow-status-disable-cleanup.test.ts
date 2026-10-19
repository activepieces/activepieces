import { TriggerStrategy } from '@activepieces/pieces-framework'
import { ApEnvironment, EngineResponseStatus, FlowStatus } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockSubmitAndWaitForResponse = vi.fn()
const mockFindOneBy = vi.fn()
const mockSoftDelete = vi.fn()
const mockSave = vi.fn()
const mockGetFlowVersionOrThrow = vi.fn()
const mockGetPieceTrigger = vi.fn()
const mockGetPieceTriggerOrThrow = vi.fn()
const mockRemoveRepeatingJob = vi.fn()
const mockAddJob = vi.fn()

vi.mock('../../../../../src/app/helper/system/system', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../../../../src/app/helper/system/system')>()
    const { AppSystemProp } = await import('../../../../../src/app/helper/system/system-props')
    return {
        ...actual,
        system: {
            ...actual.system,
            getOrThrow: (key: string) => key === AppSystemProp.ENVIRONMENT
                ? ApEnvironment.PRODUCTION
                : actual.system.getOrThrow(key),
        },
    }
})

vi.mock('../../../../../src/app/core/db/repo-factory', () => ({
    repoFactory: vi.fn(() => () => ({
        findOneBy: mockFindOneBy,
        softDelete: mockSoftDelete,
        save: mockSave,
    })),
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

vi.mock('../../../../../src/app/flows/flow-version/flow-version.service', () => ({
    flowVersionService: vi.fn(() => ({
        getOneOrThrow: mockGetFlowVersionOrThrow,
        getFlowVersionOrThrow: mockGetFlowVersionOrThrow,
    })),
}))

vi.mock('../../../../../src/app/trigger/trigger-source/trigger-utils', () => ({
    triggerUtils: vi.fn(() => ({
        getPieceTrigger: mockGetPieceTrigger,
        getPieceTriggerOrThrow: mockGetPieceTriggerOrThrow,
    })),
}))

vi.mock('../../../../../src/app/template/template-telemetry/template-telemetry.service', () => ({
    templateTelemetryService: vi.fn(() => ({ sendEvent: vi.fn() })),
}))

vi.mock('../../../../../src/app/workers/job-queue/job-queue', () => ({
    jobQueue: vi.fn(() => ({
        removeRepeatingJob: mockRemoveRepeatingJob,
        add: mockAddJob,
    })),
    JobType: { ONE_TIME: 'ONE_TIME', REPEATING: 'REPEATING' },
}))

vi.mock('../../../../../src/app/trigger/app-event-routing/app-event-routing.service', () => ({
    appEventRoutingService: {
        deleteListeners: vi.fn(),
        createListeners: vi.fn(),
    },
}))

vi.mock('../../../../../src/app/helper/application-events', () => ({
    applicationEvents: vi.fn(() => ({ sendUserEvent: vi.fn() })),
    ApplicationEventName: {},
}))

vi.mock('../../../../../src/app/flows/step-run/sample-data.service', () => ({
    sampleDataService: vi.fn(() => ({ deleteForFlow: vi.fn() })),
}))

import { flowSideEffects } from '../../../../../src/app/flows/flow/flow-service-side-effects'

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
} as never

const TRIGGER_SOURCE_ID = 'ts-1'

const FLOW_TO_UPDATE = {
    id: 'flow-1',
    projectId: 'proj-1',
    publishedVersionId: 'fv-1',
    status: FlowStatus.ENABLED,
} as never

const PUBLISHED_FLOW_VERSION = {
    id: 'fv-1',
    flowId: 'flow-1',
    trigger: {
        settings: {
            pieceName: '@activepieces/piece-linear',
            pieceVersion: '0.5.1',
        },
    },
} as never

function webhookTrigger() {
    return {
        name: 'new_issue',
        displayName: 'New Issue',
        description: 'Test',
        props: {},
        requireAuth: true,
        type: TriggerStrategy.WEBHOOK,
        sampleData: {},
        testStrategy: 'SIMULATION',
    }
}

function refusedCleanupResponse() {
    return {
        status: EngineResponseStatus.ERROR,
        response: undefined,
        error: '{"__apErrorVersion":1,"message":"Authentication required, not authenticated - You need to authenticate to access this operation.","errorName":"_","status":401}',
    }
}

describe('flowSideEffects.preUpdateStatus disabling a flow whose trigger cleanup is refused', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockFindOneBy.mockResolvedValue({
            id: TRIGGER_SOURCE_ID,
            flowId: 'flow-1',
            flowVersionId: 'fv-1',
            projectId: 'proj-1',
            pieceName: '@activepieces/piece-linear',
            simulate: false,
        })
        mockGetFlowVersionOrThrow.mockResolvedValue(PUBLISHED_FLOW_VERSION)
        mockGetPieceTrigger.mockResolvedValue(webhookTrigger())
        mockGetPieceTriggerOrThrow.mockResolvedValue(webhookTrigger())
        mockSave.mockImplementation(async (row: Record<string, unknown>) => row)
    })

    it('commits the disable when the piece refuses the remote cleanup, so the flow stops instead of staying live', async () => {
        mockSubmitAndWaitForResponse.mockResolvedValue(refusedCleanupResponse())

        await flowSideEffects(mockLog).preUpdateStatus({
            flowToUpdate: FLOW_TO_UPDATE,
            publishedFlowVersion: PUBLISHED_FLOW_VERSION,
            newStatus: FlowStatus.DISABLED,
        })

        expect(mockSoftDelete).toHaveBeenCalledWith({
            id: TRIGGER_SOURCE_ID,
            projectId: 'proj-1',
        })
    })

    it('commits the disable when the worker never answers the cleanup hook', async () => {
        mockSubmitAndWaitForResponse.mockRejectedValue(new Error('Worker did not respond within the safety timeout'))

        await flowSideEffects(mockLog).preUpdateStatus({
            flowToUpdate: FLOW_TO_UPDATE,
            publishedFlowVersion: PUBLISHED_FLOW_VERSION,
            newStatus: FlowStatus.DISABLED,
        })

        expect(mockSoftDelete).toHaveBeenCalledWith({
            id: TRIGGER_SOURCE_ID,
            projectId: 'proj-1',
        })
    })

    it('still refuses to enable a flow whose trigger registration fails', async () => {
        mockSubmitAndWaitForResponse.mockResolvedValue(refusedCleanupResponse())

        await expect(
            flowSideEffects(mockLog).preUpdateStatus({
                flowToUpdate: { ...FLOW_TO_UPDATE, status: FlowStatus.DISABLED },
                publishedFlowVersion: PUBLISHED_FLOW_VERSION,
                newStatus: FlowStatus.ENABLED,
            }),
        ).rejects.toThrow()
    })
})
