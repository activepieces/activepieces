import {
    FlowTriggerType,
    FlowVersionState,
    LATEST_FLOW_SCHEMA_VERSION,
} from '@activepieces/shared'
import type { FlowTrigger, FlowVersion } from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { migrateFlowVersionTemplate } from '../../../../../src/app/flows/flow-version/migrations'
import { pieceUpgradeService } from '../../../../../src/app/flows/flow-version/piece-upgrade.service'
import { system } from '../../../../../src/app/helper/system/system'

const mockFlowFindOneBy = vi.fn()
const mockSendUserEvent = vi.fn()

vi.mock('../../../../../src/app/flows/flow-version/piece-upgrade-register', () => ({
    pieceUpgradeRegister: {
        lookup: vi.fn(async ({ pieceName, pieceVersion }: { pieceName: string, pieceVersion: string }) =>
            pieceName === WEBHOOK_PIECE_NAME && pieceVersion === OLD_WEBHOOK_VERSION
                ? { target: UPGRADED_WEBHOOK_VERSION }
                : undefined),
        resolveDecision: vi.fn(({ entry }: { entry: { target: string } }) => ({ outcome: 'upgraded', toVersion: entry.target })),
    },
}))

vi.mock('../../../../../src/app/flows/flow/flow.repo', () => ({
    flowRepo: () => ({
        findOneBy: mockFlowFindOneBy,
    }),
}))

vi.mock('../../../../../src/app/project/project-service', () => ({
    projectService: vi.fn(() => ({
        getPlatformId: vi.fn().mockResolvedValue('platform-1'),
    })),
}))

vi.mock('../../../../../src/app/helper/application-events', () => ({
    applicationEvents: vi.fn(() => ({
        sendUserEvent: mockSendUserEvent,
    })),
}))

describe('pieceUpgradeService.migrateFlowVersion', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockFlowFindOneBy.mockResolvedValue(null)
    })

    it('migrates a template that has no stored flow without sending an upgrade audit event', async () => {
        const migrated = await migrateFlowVersionTemplate({
            displayName: 'Handler flow',
            trigger: webhookTrigger(),
            schemaVersion: '20',
            notes: [],
            valid: false,
        })

        expect(migrated.schemaVersion).toBe(LATEST_FLOW_SCHEMA_VERSION)
        expect(pieceVersionOf(migrated.trigger)).toBe(UPGRADED_WEBHOOK_VERSION)
        expect(mockSendUserEvent).not.toHaveBeenCalled()
    })

    it('sends an upgrade audit event for a stored flow version resolved by its flow id', async () => {
        mockFlowFindOneBy.mockResolvedValue({ id: 'flow-1', projectId: 'project-1' })

        const result = await pieceUpgradeService(system.globalLogger()).migrateFlowVersion({ flowVersion: storedFlowVersion() })

        expect(pieceVersionOf(result.flowVersion.trigger)).toBe(UPGRADED_WEBHOOK_VERSION)
        expect(mockSendUserEvent).toHaveBeenCalledWith(
            { platformId: 'platform-1', projectId: 'project-1' },
            expect.objectContaining({ data: expect.objectContaining({ flowId: 'flow-1', flowVersionId: 'fv-1' }) }),
        )
    })
})

function webhookTrigger(): FlowTrigger {
    return {
        name: 'trigger',
        valid: true,
        displayName: 'Catch Webhook',
        lastUpdatedDate: '2026-01-01T00:00:00Z',
        type: FlowTriggerType.PIECE,
        settings: {
            pieceName: WEBHOOK_PIECE_NAME,
            pieceVersion: OLD_WEBHOOK_VERSION,
            triggerName: 'catch_webhook',
            input: {},
            propertySettings: {},
        },
    }
}

function storedFlowVersion(): FlowVersion {
    return {
        id: 'fv-1',
        created: '2026-01-01T00:00:00Z',
        updated: '2026-01-01T00:00:00Z',
        flowId: 'flow-1',
        displayName: 'Handler flow',
        trigger: webhookTrigger(),
        updatedBy: null,
        valid: true,
        schemaVersion: '23',
        agentIds: [],
        state: FlowVersionState.DRAFT,
        connectionIds: [],
        backupFiles: null,
        notes: [],
    }
}

function pieceVersionOf(trigger: FlowTrigger): string | undefined {
    return trigger.type === FlowTriggerType.PIECE ? trigger.settings.pieceVersion : undefined
}

const WEBHOOK_PIECE_NAME = '@activepieces/piece-webhook'
const OLD_WEBHOOK_VERSION = '0.1.33'
const UPGRADED_WEBHOOK_VERSION = '0.1.36'
