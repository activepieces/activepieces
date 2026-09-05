import { PropertyType } from '@activepieces/pieces-framework'
import { FlowStatus, FlowTriggerType, FlowVersionState, PackageType, PieceType, PrincipalType, TriggerStrategy, TriggerTestStrategy } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { pieceCache } from '../../../../src/app/pieces/metadata/piece-cache'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import { createMockFlow, createMockFlowVersion, createMockPieceMetadata, mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null
let mockLog: FastifyBaseLogger

const PIECE_NAME = '@activepieces/piece-bulk-upgrade-test'

beforeAll(async () => {
    app = await setupTestEnvironment()
    mockLog = app!.log!
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    await databaseConnection().getRepository('piece_metadata').createQueryBuilder().delete().execute()
})

function triggerDefinition(props: Record<string, unknown>) {
    return {
        name: 'my_trigger',
        displayName: 'My Trigger',
        description: '',
        requireAuth: false,
        props,
        type: TriggerStrategy.POLLING,
        sampleData: {},
        testStrategy: TriggerTestStrategy.TEST_FUNCTION,
    }
}

async function setupPublishedFlowPinnedToOldVersion({ projectId, userId }: { projectId: string, userId: string }) {
    const flow = createMockFlow({ projectId, status: FlowStatus.ENABLED })
    await db.save('flow', flow)

    const version = createMockFlowVersion({
        flowId: flow.id,
        updatedBy: userId,
        state: FlowVersionState.LOCKED,
        valid: true,
        trigger: {
            type: FlowTriggerType.PIECE,
            name: 'trigger',
            settings: {
                pieceName: PIECE_NAME,
                pieceVersion: '1.0.0',
                input: {},
                propertySettings: {},
                triggerName: 'my_trigger',
            },
            valid: true,
            displayName: 'Trigger',
            lastUpdatedDate: new Date().toISOString(),
        },
    })
    await db.save('flow_version', version)
    await db.update('flow', flow.id, { publishedVersionId: version.id })

    return { flow, version }
}

describe('Bulk Upgrade Piece Version (EE)', () => {
    it('reports a compatible flow as auto-upgradeable and does not mutate it on dry run', async () => {
        const { mockPlatform, mockProject, mockOwner } = await mockAndSaveBasicSetup({
            plan: { managePiecesEnabled: true },
        })
        await db.save('piece_metadata', [
            createMockPieceMetadata({ name: PIECE_NAME, version: '1.0.0', pieceType: PieceType.OFFICIAL, packageType: PackageType.REGISTRY, triggers: { my_trigger: triggerDefinition({}) } }),
            createMockPieceMetadata({ name: PIECE_NAME, version: '1.0.1', pieceType: PieceType.OFFICIAL, packageType: PackageType.REGISTRY, triggers: { my_trigger: triggerDefinition({}) } }),
        ])
        await pieceCache(mockLog).setup()

        const { flow, version } = await setupPublishedFlowPinnedToOldVersion({ projectId: mockProject.id, userId: mockOwner.id })

        const token = await generateMockToken({ type: PrincipalType.USER, id: mockOwner.id, platform: { id: mockPlatform.id } })
        const response = await app!.inject({
            method: 'POST',
            url: '/api/v1/pieces/bulk-upgrade-version',
            headers: { authorization: `Bearer ${token}` },
            payload: { pieceName: PIECE_NAME, targetVersion: '1.0.1', dryRun: true },
        })

        expect(response.statusCode).toBe(200)
        const body = response.json()
        expect(body.autoUpgradeable).toHaveLength(1)
        expect(body.autoUpgradeable[0].flowId).toBe(flow.id)
        expect(body.autoUpgradeable[0].currentVersions).toEqual(['1.0.0'])
        expect(body.needsManual).toHaveLength(0)

        const untouched = await db.findOneByOrFail<{ trigger: { settings: { pieceVersion: string } } }>('flow_version', { id: version.id })
        expect(untouched.trigger.settings.pieceVersion).toBe('1.0.0')
    })

    it('reports a flow needing a new required input as needs-manual', async () => {
        const { mockPlatform, mockProject, mockOwner } = await mockAndSaveBasicSetup({
            plan: { managePiecesEnabled: true },
        })
        await db.save('piece_metadata', [
            createMockPieceMetadata({ name: PIECE_NAME, version: '1.0.0', pieceType: PieceType.OFFICIAL, packageType: PackageType.REGISTRY, triggers: { my_trigger: triggerDefinition({}) } }),
            createMockPieceMetadata({ name: PIECE_NAME, version: '1.0.1', pieceType: PieceType.OFFICIAL, packageType: PackageType.REGISTRY, triggers: { my_trigger: triggerDefinition({ newField: { displayName: 'New Field', required: true, type: PropertyType.SHORT_TEXT } }) } }),
        ])
        await pieceCache(mockLog).setup()

        const { flow } = await setupPublishedFlowPinnedToOldVersion({ projectId: mockProject.id, userId: mockOwner.id })

        const token = await generateMockToken({ type: PrincipalType.USER, id: mockOwner.id, platform: { id: mockPlatform.id } })
        const response = await app!.inject({
            method: 'POST',
            url: '/api/v1/pieces/bulk-upgrade-version',
            headers: { authorization: `Bearer ${token}` },
            payload: { pieceName: PIECE_NAME, targetVersion: '1.0.1', dryRun: true },
        })

        expect(response.statusCode).toBe(200)
        const body = response.json()
        expect(body.needsManual).toHaveLength(1)
        expect(body.needsManual[0].flowId).toBe(flow.id)
        expect(body.autoUpgradeable).toHaveLength(0)
    })
})
