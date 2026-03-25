import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import {
    DefaultProjectRole,
    FlowOperationType,
    FlowStatus,
    FlowTriggerType,
    PackageType,
    PieceType,
    TriggerStrategy,
    TriggerTestStrategy,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { db } from '../../../helpers/db'
import {
    createMockFlow,
    createMockFlowVersion,
    createMockPieceMetadata,
} from '../../../helpers/mocks'
import { describeRolePermissions } from '../../../helpers/permission-test'
import { createTestContext, TestContext } from '../../../helpers/test-context'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

async function setupFlowWithScheduleTrigger(ctx: TestContext) {
    const mockFlow = createMockFlow({
        projectId: ctx.project.id,
        status: FlowStatus.DISABLED,
    })
    await db.save('flow', mockFlow)

    const mockPieceMetadata = createMockPieceMetadata({
        name: '@activepieces/piece-schedule',
        version: '0.1.5',
        triggers: {
            every_hour: {
                name: 'every_hour',
                displayName: 'Every Hour',
                description: 'Triggers the current flow every hour',
                requireAuth: false,
                props: {},
                type: TriggerStrategy.POLLING,
                sampleData: {},
                testStrategy: TriggerTestStrategy.TEST_FUNCTION,
            },
        },
        pieceType: PieceType.OFFICIAL,
        packageType: PackageType.REGISTRY,
    })
    await db.save('piece_metadata', mockPieceMetadata)

    const mockFlowVersion = createMockFlowVersion({
        flowId: mockFlow.id,
        updatedBy: ctx.user.id,
        trigger: {
            type: FlowTriggerType.PIECE,
            name: 'trigger',
            settings: {
                pieceName: '@activepieces/piece-schedule',
                pieceVersion: '0.1.5',
                input: {},
                propertySettings: {},
                triggerName: 'every_hour',
            },
            valid: true,
            displayName: 'Trigger',
        },
    })
    await db.save('flow_version', mockFlowVersion)
    await db.update('flow', mockFlow.id, { publishedVersionId: mockFlowVersion.id })

    return { mockFlow, mockFlowVersion, mockPieceMetadata }
}

describe('Flow API', () => {
    describe('Create Flow endpoint', () => {
        describeRolePermissions({
            app: () => app!,
            request: (memberCtx, ownerCtx) => {
                return memberCtx.post('/v1/flows', {
                    displayName: 'test flow',
                    projectId: ownerCtx.project.id,
                })
            },
            allowedRoles: [DefaultProjectRole.ADMIN, DefaultProjectRole.EDITOR],
            forbiddenRoles: [DefaultProjectRole.VIEWER],
        })
    })

    describe('Update flow endpoint', () => {
        describeRolePermissions({
            app: () => app!,
            beforeEach: async (ctx) => {
                await setupFlowWithScheduleTrigger(ctx)
            },
            request: async (memberCtx, ownerCtx) => {
                const { mockFlow } = await setupFlowWithScheduleTrigger(ownerCtx)
                return memberCtx.post(`/v1/flows/${mockFlow.id}`, {
                    type: FlowOperationType.CHANGE_STATUS,
                    request: { status: 'ENABLED' },
                })
            },
            allowedRoles: [DefaultProjectRole.ADMIN, DefaultProjectRole.EDITOR],
            forbiddenRoles: [DefaultProjectRole.VIEWER],
        })
    })

    describe('List Flows endpoint', () => {
        describeRolePermissions({
            app: () => app!,
            request: (memberCtx, ownerCtx) => {
                return memberCtx.get('/v1/flows', {
                    projectId: ownerCtx.project.id,
                    status: 'ENABLED',
                })
            },
            allowedRoles: [DefaultProjectRole.ADMIN, DefaultProjectRole.EDITOR, DefaultProjectRole.VIEWER],
            forbiddenRoles: [],
        })
    })
})
