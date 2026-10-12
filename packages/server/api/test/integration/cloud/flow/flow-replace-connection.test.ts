import { apId, Permission, RoleType } from '@activepieces/core-utils'
import {
    DefaultProjectRole,
    FlowActionType,
    FlowStatus,
    FlowTriggerType,
    FlowVersionState,
    PackageType,
    PieceType,
    TriggerStrategy,
    TriggerTestStrategy,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { db } from '../../../helpers/db'
import {
    createMockConnection,
    createMockFlow,
    createMockFlowVersion,
    createMockPieceMetadata,
    createMockProjectRole,
} from '../../../helpers/mocks'
import { createMemberContext, createTestContext, TestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

const PIECE_NAME = '@activepieces/piece-test'

function authFor(externalId: string): string {
    return `{{connections['${externalId}']}}`
}

async function savePiece() {
    await db.save('piece_metadata', createMockPieceMetadata({
        name: PIECE_NAME,
        version: '0.1.0',
        pieceType: PieceType.OFFICIAL,
        packageType: PackageType.REGISTRY,
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
    }))
}

function flowTrigger(sourceExternalId: string) {
    return {
        type: FlowTriggerType.PIECE,
        name: 'trigger',
        displayName: 'Trigger',
        valid: true,
        settings: {
            pieceName: PIECE_NAME,
            pieceVersion: '0.1.0',
            triggerName: 'every_hour',
            input: {},
            propertySettings: {},
        },
        nextAction: {
            type: FlowActionType.PIECE,
            name: 'step_1',
            displayName: 'Piece Step',
            valid: true,
            skip: false,
            settings: {
                pieceName: PIECE_NAME,
                pieceVersion: '0.1.0',
                actionName: 'test_action',
                input: { auth: authFor(sourceExternalId), message: 'hello' },
                propertySettings: {},
            },
        },
    }
}

async function seedFlowWithConnection(ctx: TestContext, sourceExternalId: string) {
    await savePiece()

    const flow = createMockFlow({ projectId: ctx.project.id, status: FlowStatus.DISABLED })
    await db.save('flow', flow)

    const flowVersion = createMockFlowVersion({
        flowId: flow.id,
        updatedBy: ctx.user.id,
        connectionIds: [sourceExternalId],
        trigger: flowTrigger(sourceExternalId),
    })
    await db.save('flow_version', flowVersion)

    return { flow }
}

async function seedPublishedDisabledFlow(ctx: TestContext, sourceExternalId: string) {
    await savePiece()

    const flow = createMockFlow({ projectId: ctx.project.id, status: FlowStatus.DISABLED })
    await db.save('flow', flow)

    const publishedVersion = createMockFlowVersion({
        flowId: flow.id,
        updatedBy: ctx.user.id,
        state: FlowVersionState.LOCKED,
        valid: true,
        connectionIds: [sourceExternalId],
        trigger: flowTrigger(sourceExternalId),
    })
    await db.save('flow_version', publishedVersion)
    flow.publishedVersionId = publishedVersion.id
    await db.save('flow', flow)

    return { flow }
}

async function seedConnections(ctx: TestContext, pieceName = PIECE_NAME) {
    const source = createMockConnection({ projectIds: [ctx.project.id], platformId: ctx.platform.id, pieceName, externalId: apId() }, ctx.user.id)
    const target = createMockConnection({ projectIds: [ctx.project.id], platformId: ctx.platform.id, pieceName, externalId: apId() }, ctx.user.id)
    await db.save('app_connection', source)
    await db.save('app_connection', target)
    return { source, target }
}

async function connectionOnlyMemberContext(ctx: TestContext): Promise<TestContext> {
    const role = createMockProjectRole({
        name: `connection-only-${apId()}`,
        platformId: ctx.platform.id,
        type: RoleType.CUSTOM,
        permissions: [Permission.UPDATE_FLOW_CONNECTION],
    })
    await db.save('project_role', role)
    return createMemberContext(app!, ctx, { projectRole: role.name })
}

describe('Replace flow connection endpoint', () => {
    it('lets a role with only UPDATE_FLOW_CONNECTION replace a connection on a flow', async () => {
        const ctx = await createTestContext(app!)
        const { source, target } = await seedConnections(ctx)
        const { flow } = await seedFlowWithConnection(ctx, source.externalId)
        const memberCtx = await connectionOnlyMemberContext(ctx)

        const response = await memberCtx.post(`/v1/flows/${flow.id}/replace-connection`, {
            sourceAppConnectionId: source.id,
            targetAppConnectionId: target.id,
        })

        expect(response.statusCode).toBe(StatusCodes.NO_CONTENT)

        const populated = await ctx.get(`/v1/flows/${flow.id}`)
        const auth = populated.json().version.trigger.nextAction.settings.input.auth
        expect(auth).toBe(authFor(target.externalId))
    })

    it('keeps a disabled flow disabled when replacing on the published version', async () => {
        const ctx = await createTestContext(app!)
        const { source, target } = await seedConnections(ctx)
        const { flow } = await seedPublishedDisabledFlow(ctx, source.externalId)
        const memberCtx = await connectionOnlyMemberContext(ctx)

        const response = await memberCtx.post(`/v1/flows/${flow.id}/replace-connection`, {
            sourceAppConnectionId: source.id,
            targetAppConnectionId: target.id,
            applyToPublishedVersions: true,
        })

        expect(response.statusCode).toBe(StatusCodes.NO_CONTENT)

        const updated = await db.findOneBy<{ status: FlowStatus }>('flow', { id: flow.id })
        expect(updated?.status).toBe(FlowStatus.DISABLED)
    })

    it('rejects replacing with a connection from a different app', async () => {
        const ctx = await createTestContext(app!)
        const { source } = await seedConnections(ctx)
        const otherPieceTarget = createMockConnection({ projectIds: [ctx.project.id], platformId: ctx.platform.id, pieceName: '@activepieces/piece-other', externalId: apId() }, ctx.user.id)
        await db.save('app_connection', otherPieceTarget)
        const { flow } = await seedFlowWithConnection(ctx, source.externalId)
        const memberCtx = await connectionOnlyMemberContext(ctx)

        const response = await memberCtx.post(`/v1/flows/${flow.id}/replace-connection`, {
            sourceAppConnectionId: source.id,
            targetAppConnectionId: otherPieceTarget.id,
        })

        expect(response.statusCode).toBe(StatusCodes.CONFLICT)
        expect(response.json().code).toBe('VALIDATION')
    })

    it('forbids a viewer from replacing a flow connection', async () => {
        const ctx = await createTestContext(app!)
        const { source, target } = await seedConnections(ctx)
        const { flow } = await seedFlowWithConnection(ctx, source.externalId)
        const memberCtx = await createMemberContext(app!, ctx, { projectRole: DefaultProjectRole.VIEWER })

        const response = await memberCtx.post(`/v1/flows/${flow.id}/replace-connection`, {
            sourceAppConnectionId: source.id,
            targetAppConnectionId: target.id,
        })

        expect(response.statusCode).toBe(StatusCodes.FORBIDDEN)
        expect(response.json().code).toBe('PERMISSION_DENIED')
    })
})
