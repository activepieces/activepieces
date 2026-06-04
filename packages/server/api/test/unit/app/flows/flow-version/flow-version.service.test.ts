import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
    FlowActionType,
    FlowOperationType,
    FlowTriggerType,
    FlowVersionState,
    PieceTrigger,
    SampleDataSettings,
} from '@activepieces/shared'
import type { FlowVersion } from '@activepieces/shared'

const mockGetPiece = vi.fn()
const mockGetPlatformId = vi.fn().mockResolvedValue('platform-1')
const mockRepoFindOne = vi.fn()
const mockRepoSave = vi.fn()
const mockRepoExists = vi.fn()

vi.mock('../../../../../src/app/core/db/repo-factory', () => ({
    repoFactory: vi.fn(() => () => ({
        findOne: mockRepoFindOne,
        save: mockRepoSave,
        exists: mockRepoExists,
    })),
}))

vi.mock('../../../../../src/app/pieces/metadata/piece-metadata-service', () => ({
    pieceMetadataService: vi.fn(() => ({
        get: mockGetPiece,
    })),
}))

vi.mock('../../../../../src/app/project/project-service', () => ({
    projectService: vi.fn(() => ({
        getPlatformId: mockGetPlatformId,
    })),
}))

vi.mock('../../../../../src/app/user/user-service', () => ({
    userService: vi.fn(() => ({
        getMetaInformation: vi.fn(),
    })),
}))

vi.mock('../../../../../src/app/flows/step-run/sample-data.service', () => ({
    sampleDataService: vi.fn(() => ({
        saveSampleDataFileIdsInStep: vi.fn(),
    })),
}))

vi.mock('../../../../../src/app/flows/flow-version/flow-version-migration.service', () => ({
    flowVersionMigrationService: vi.fn(() => ({
        migrate: vi.fn((v: FlowVersion) => Promise.resolve(v)),
    })),
}))

vi.mock('../../../../../src/app/flows/flow-version/flow-version-side-effects', () => ({
    flowVersionSideEffects: vi.fn(() => ({
        preApplyOperation: vi.fn(),
    })),
}))

vi.mock('../../../../../src/app/flows/flow-version/flow-version-validator-util', () => ({
    flowVersionValidationUtil: vi.fn(() => ({
        prepareRequest: vi.fn(({ request }: { request: unknown }) => Promise.resolve(request)),
    })),
}))

import { flowVersionService } from '../../../../../src/app/flows/flow-version/flow-version.service'
import type { FastifyBaseLogger } from 'fastify'

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
} as unknown as FastifyBaseLogger

function makePieceTriggerSettings(extras: Partial<PieceTrigger['settings']> = {}): PieceTrigger['settings'] {
    return {
        pieceName: '@activepieces/piece-gmail',
        pieceVersion: '~0.1.0',
        triggerName: 'new_email',
        input: {},
        propertySettings: {},
        ...extras,
    }
}

function makeFlowVersion(overrides: { id?: string, trigger?: FlowVersion['trigger'] } = {}): FlowVersion {
    return {
        id: overrides.id ?? 'fv-1',
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-01T00:00:00Z',
        flowId: 'flow-1',
        displayName: 'Test Flow',
        trigger: overrides.trigger ?? {
            name: 'trigger',
            valid: true,
            displayName: 'Gmail Trigger',
            lastUpdatedDate: '2024-01-01T00:00:00Z',
            type: FlowTriggerType.PIECE,
            settings: makePieceTriggerSettings(),
            nextAction: {
                name: 'step_1',
                valid: true,
                displayName: 'Slack Action',
                lastUpdatedDate: '2024-01-01T00:00:00Z',
                type: FlowActionType.PIECE,
                settings: {
                    pieceName: '@activepieces/piece-slack',
                    pieceVersion: '~0.2.0',
                    actionName: 'send_message',
                    input: {},
                    propertySettings: {},
                },
            },
        },
        updatedBy: null,
        valid: true,
        schemaVersion: null,
        agentIds: [],
        state: FlowVersionState.DRAFT,
        connectionIds: [],
        backupFiles: null,
        notes: [],
    }
}

describe('flowVersionService.applyOperation - USE_AS_DRAFT', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockGetPlatformId.mockResolvedValue('platform-1')
        mockRepoFindOne.mockResolvedValue(null)
        mockRepoSave.mockImplementation((v: FlowVersion) => Promise.resolve(v))
        mockRepoExists.mockResolvedValue(false)
    })

    it('preserves PIECE trigger sample data from the previous version', async () => {
        const sampleData: SampleDataSettings = {
            sampleDataFileId: 'sd-file-1',
            sampleDataInputFileId: 'sdi-file-1',
            lastTestDate: '2024-01-01T00:00:00Z',
        }
        const currentDraft = makeFlowVersion()
        const previousVersion = makeFlowVersion({
            id: 'fv-prev',
            trigger: {
                ...makeFlowVersion().trigger,
                settings: makePieceTriggerSettings({ sampleData }),
            } as PieceTrigger,
        })
        mockRepoFindOne.mockResolvedValue(previousVersion)

        const result = await flowVersionService(mockLog).applyOperation({
            projectId: 'proj-1',
            platformId: 'platform-1',
            userId: 'user-1',
            flowVersion: currentDraft,
            userOperation: {
                type: FlowOperationType.USE_AS_DRAFT,
                request: { versionId: 'fv-prev' },
            },
        })

        expect(result.trigger.type).toBe(FlowTriggerType.PIECE)
        const settings = (result.trigger as PieceTrigger).settings
        expect(settings.sampleData?.sampleDataFileId).toBe(sampleData.sampleDataFileId)
        expect(settings.sampleData?.sampleDataInputFileId).toBe(sampleData.sampleDataInputFileId)
    })

    it('does not set trigger sample data when previous version has no sampleData', async () => {
        const currentDraft = makeFlowVersion()
        const previousVersion = makeFlowVersion({ id: 'fv-prev' })
        mockRepoFindOne.mockResolvedValue(previousVersion)

        const result = await flowVersionService(mockLog).applyOperation({
            projectId: 'proj-1',
            platformId: 'platform-1',
            userId: 'user-1',
            flowVersion: currentDraft,
            userOperation: {
                type: FlowOperationType.USE_AS_DRAFT,
                request: { versionId: 'fv-prev' },
            },
        })

        expect(result.trigger.type).toBe(FlowTriggerType.PIECE)
        expect((result.trigger as PieceTrigger).settings.sampleData).toBeUndefined()
    })

    it('skips the sample data preservation when previous version has an EMPTY trigger', async () => {
        const currentDraft = makeFlowVersion()
        const previousVersion = makeFlowVersion({
            id: 'fv-prev',
            trigger: {
                name: 'trigger',
                valid: false,
                displayName: 'Select Trigger',
                lastUpdatedDate: '2024-01-01T00:00:00Z',
                type: FlowTriggerType.EMPTY,
                settings: {},
            },
        })
        mockRepoFindOne.mockResolvedValue(previousVersion)

        const result = await flowVersionService(mockLog).applyOperation({
            projectId: 'proj-1',
            platformId: 'platform-1',
            userId: 'user-1',
            flowVersion: currentDraft,
            userOperation: {
                type: FlowOperationType.USE_AS_DRAFT,
                request: { versionId: 'fv-prev' },
            },
        })

        expect(result.trigger.type).toBe(FlowTriggerType.EMPTY)
    })
})
