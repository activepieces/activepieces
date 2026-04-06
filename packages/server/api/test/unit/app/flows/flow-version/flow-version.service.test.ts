import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
    FlowActionType,
    FlowTriggerType,
    FlowVersionState,
} from '@activepieces/shared'
import type { FlowVersion } from '@activepieces/shared'

const mockGetPiece = vi.fn()
const mockGetPlatformId = vi.fn().mockResolvedValue('platform-1')

vi.mock('../../../../../src/app/core/db/repo-factory', () => ({
    repoFactory: vi.fn(() => () => ({
        findOne: vi.fn().mockResolvedValue(null),
        save: vi.fn(),
        exists: vi.fn().mockResolvedValue(false),
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
        prepareRequest: vi.fn((r: unknown) => Promise.resolve(r)),
    })),
}))

import { flowVersionService } from '../../../../../src/app/flows/flow-version/flow-version.service'

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

function makeFlowVersionWithPiece(): FlowVersion {
    return {
        id: 'fv-1',
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-01T00:00:00Z',
        flowId: 'flow-1',
        displayName: 'Test Flow',
        trigger: {
            name: 'trigger_1',
            valid: true,
            displayName: 'Gmail Trigger',
            lastUpdatedDate: '2024-01-01T00:00:00Z',
            type: FlowTriggerType.PIECE,
            settings: {
                pieceName: '@activepieces/piece-gmail',
                pieceVersion: '~0.1.0',
                triggerName: 'new_email',
                input: {},
                propertySettings: {},
            },
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

describe('lockPieceVersions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockGetPlatformId.mockResolvedValue('platform-1')
    })

    it('returns success:false when a piece is not found', async () => {
        mockGetPiece.mockResolvedValue(null)

        const result = await flowVersionService(mockLog).lockPieceVersions({
            projectId: 'proj-1',
            flowVersion: makeFlowVersionWithPiece(),
        })

        expect(result.success).toBe(false)
        expect(result.message).toContain('@activepieces/piece-gmail')
    })

    it('returns success:true with locked versions when all pieces are found', async () => {
        mockGetPiece.mockImplementation(({ name }: { name: string }) =>
            Promise.resolve({ version: name.includes('gmail') ? '1.2.3' : '4.5.6' }),
        )

        const result = await flowVersionService(mockLog).lockPieceVersions({
            projectId: 'proj-1',
            flowVersion: makeFlowVersionWithPiece(),
        })

        expect(result.success).toBe(true)
        expect(result.data?.trigger.settings.pieceVersion).toBe('1.2.3')
    })

    it('returns the flow as-is when already LOCKED', async () => {
        const locked: FlowVersion = { ...makeFlowVersionWithPiece(), state: FlowVersionState.LOCKED }

        const result = await flowVersionService(mockLog).lockPieceVersions({
            projectId: 'proj-1',
            flowVersion: locked,
        })

        expect(result.success).toBe(true)
        expect(result.data).toBe(locked)
    })
})
