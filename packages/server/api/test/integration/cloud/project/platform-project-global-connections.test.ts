import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import {
    apId,
    AppConnectionScope,
    AppConnectionType,
    PackageType,
    UpsertGlobalConnectionRequestBody,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { db } from '../../../helpers/db'
import {
    createMockPieceMetadata,
} from '../../../helpers/mocks'
import { createTestContext } from '../../../helpers/test-context'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})
const setupPlatformWithGlobalConnections = async () => {
    const ctx = await createTestContext(app!, {
        plan: {
            globalConnectionsEnabled: true,
        },
    })

    const mockPieceMetadata = createMockPieceMetadata({
        platformId: ctx.platform.id,
        packageType: PackageType.REGISTRY,
    })
    await db.save('piece_metadata', mockPieceMetadata)

    return { ctx, mockPieceMetadata }
}

async function createGlobalConnection(
    token: string,
    params: {
        pieceName: string
        pieceVersion: string
        projectIds: string[]
        displayName?: string
    },
): Promise<{ id: string, externalId: string, projectIds: string[] }> {
    const body: UpsertGlobalConnectionRequestBody = {
        displayName: params.displayName ?? `conn-${apId()}`,
        pieceName: params.pieceName,
        pieceVersion: params.pieceVersion,
        projectIds: params.projectIds,
        scope: AppConnectionScope.PLATFORM,
        type: AppConnectionType.SECRET_TEXT,
        value: {
            type: AppConnectionType.SECRET_TEXT,
            secret_text: `secret-${apId()}`,
        },
    }

    const response = await app?.inject({
        method: 'POST',
        url: '/v1/global-connections',
        headers: { authorization: `Bearer ${token}` },
        body,
    })

    expect(response?.statusCode).toBe(StatusCodes.CREATED)
    return response!.json()
}

async function listGlobalConnections(token: string): Promise<{ data: { id: string, externalId: string, projectIds: string[] }[] }> {
    const response = await app?.inject({
        method: 'GET',
        url: '/v1/global-connections',
        headers: { authorization: `Bearer ${token}` },
    })
    expect(response?.statusCode).toBe(StatusCodes.OK)
    return response!.json()
}

describe('Platform Project Global Connections', () => {

    describe('Create Project with globalConnectionExternalIds', () => {

        it('assigns selected global connections to the new project', async () => {
            const { ctx, mockPieceMetadata } = await setupPlatformWithGlobalConnections()

            const conn1 = await createGlobalConnection(ctx.token, {
                pieceName: mockPieceMetadata.name,
                pieceVersion: mockPieceMetadata.version,
                projectIds: [ctx.project.id],
            })
            const conn2 = await createGlobalConnection(ctx.token, {
                pieceName: mockPieceMetadata.name,
                pieceVersion: mockPieceMetadata.version,
                projectIds: [ctx.project.id],
            })
            const connNotSelected = await createGlobalConnection(ctx.token, {
                pieceName: mockPieceMetadata.name,
                pieceVersion: mockPieceMetadata.version,
                projectIds: [ctx.project.id],
            })

            const createResponse = await app?.inject({
                method: 'POST',
                url: '/v1/projects',
                headers: { authorization: `Bearer ${ctx.token}` },
                body: {
                    displayName: 'Project With Connections',
                    globalConnectionExternalIds: [conn1.externalId, conn2.externalId],
                },
            })

            expect(createResponse?.statusCode).toBe(StatusCodes.CREATED)
            const newProject = createResponse!.json()

            const { data: connections } = await listGlobalConnections(ctx.token)

            const updatedConn1 = connections.find((c) => c.id === conn1.id)
            const updatedConn2 = connections.find((c) => c.id === conn2.id)
            const updatedConnNotSelected = connections.find((c) => c.id === connNotSelected.id)

            expect(updatedConn1?.projectIds).toContain(newProject.id)
            expect(updatedConn2?.projectIds).toContain(newProject.id)
            expect(updatedConnNotSelected?.projectIds).not.toContain(newProject.id)
        })

        it('creates project without assigning connections when none specified', async () => {
            const { ctx, mockPieceMetadata } = await setupPlatformWithGlobalConnections()

            const conn = await createGlobalConnection(ctx.token, {
                pieceName: mockPieceMetadata.name,
                pieceVersion: mockPieceMetadata.version,
                projectIds: [ctx.project.id],
            })

            const createResponse = await app?.inject({
                method: 'POST',
                url: '/v1/projects',
                headers: { authorization: `Bearer ${ctx.token}` },
                body: {
                    displayName: 'Project Without Connections',
                },
            })

            expect(createResponse?.statusCode).toBe(StatusCodes.CREATED)
            const newProject = createResponse!.json()

            const { data: connections } = await listGlobalConnections(ctx.token)
            const updatedConn = connections.find((c) => c.id === conn.id)

            expect(updatedConn?.projectIds).not.toContain(newProject.id)
        })

        it('ignores globalConnectionExternalIds when feature is disabled', async () => {
            const ctx = await createTestContext(app!, {
                plan: {
                    globalConnectionsEnabled: false,
                },
            })

            const createResponse = await ctx.post('/v1/projects', {
                displayName: 'Project Feature Disabled',
                globalConnectionExternalIds: ['non-existent-external-id'],
            })

            expect(createResponse?.statusCode).toBe(StatusCodes.CREATED)
        })
    })

    describe('Update Project globalConnectionExternalIds', () => {

        it('adds global connections to a project', async () => {
            const { ctx, mockPieceMetadata } = await setupPlatformWithGlobalConnections()

            const conn1 = await createGlobalConnection(ctx.token, {
                pieceName: mockPieceMetadata.name,
                pieceVersion: mockPieceMetadata.version,
                projectIds: [ctx.project.id],
            })
            const conn2 = await createGlobalConnection(ctx.token, {
                pieceName: mockPieceMetadata.name,
                pieceVersion: mockPieceMetadata.version,
                projectIds: [ctx.project.id],
            })

            const newProjectRes = await app?.inject({
                method: 'POST',
                url: '/v1/projects',
                headers: { authorization: `Bearer ${ctx.token}` },
                body: { displayName: 'Target Project' },
            })
            const newProject = newProjectRes!.json()

            const updateResponse = await app?.inject({
                method: 'POST',
                url: `/v1/projects/${newProject.id}`,
                headers: { authorization: `Bearer ${ctx.token}` },
                body: {
                    globalConnectionExternalIds: [conn1.externalId, conn2.externalId],
                },
            })

            expect(updateResponse?.statusCode).toBe(StatusCodes.OK)

            const { data: connections } = await listGlobalConnections(ctx.token)
            const updatedConn1 = connections.find((c) => c.id === conn1.id)
            const updatedConn2 = connections.find((c) => c.id === conn2.id)

            expect(updatedConn1?.projectIds).toContain(newProject.id)
            expect(updatedConn2?.projectIds).toContain(newProject.id)
        })

        it('removes global connections from a project', async () => {
            const { ctx, mockPieceMetadata } = await setupPlatformWithGlobalConnections()

            const conn = await createGlobalConnection(ctx.token, {
                pieceName: mockPieceMetadata.name,
                pieceVersion: mockPieceMetadata.version,
                projectIds: [ctx.project.id],
            })

            const newProjectRes = await app?.inject({
                method: 'POST',
                url: '/v1/projects',
                headers: { authorization: `Bearer ${ctx.token}` },
                body: {
                    displayName: 'Remove Test',
                    globalConnectionExternalIds: [conn.externalId],
                },
            })
            const newProject = newProjectRes!.json()

            // Verify the connection was assigned
            let connectionsResult = await listGlobalConnections(ctx.token)
            let updatedConn = connectionsResult.data.find((c) => c.id === conn.id)
            expect(updatedConn?.projectIds).toContain(newProject.id)

            // Update to remove all connections
            const updateResponse = await app?.inject({
                method: 'POST',
                url: `/v1/projects/${newProject.id}`,
                headers: { authorization: `Bearer ${ctx.token}` },
                body: {
                    globalConnectionExternalIds: [],
                },
            })

            expect(updateResponse?.statusCode).toBe(StatusCodes.OK)

            connectionsResult = await listGlobalConnections(ctx.token)
            updatedConn = connectionsResult.data.find((c) => c.id === conn.id)
            expect(updatedConn?.projectIds).not.toContain(newProject.id)
        })

        it('swaps global connections: adds new ones and removes old ones', async () => {
            const { ctx, mockPieceMetadata } = await setupPlatformWithGlobalConnections()

            const connA = await createGlobalConnection(ctx.token, {
                pieceName: mockPieceMetadata.name,
                pieceVersion: mockPieceMetadata.version,
                projectIds: [ctx.project.id],
                displayName: 'Connection A',
            })
            const connB = await createGlobalConnection(ctx.token, {
                pieceName: mockPieceMetadata.name,
                pieceVersion: mockPieceMetadata.version,
                projectIds: [ctx.project.id],
                displayName: 'Connection B',
            })
            const connC = await createGlobalConnection(ctx.token, {
                pieceName: mockPieceMetadata.name,
                pieceVersion: mockPieceMetadata.version,
                projectIds: [ctx.project.id],
                displayName: 'Connection C',
            })

            // Create project with connA and connB
            const newProjectRes = await app?.inject({
                method: 'POST',
                url: '/v1/projects',
                headers: { authorization: `Bearer ${ctx.token}` },
                body: {
                    displayName: 'Swap Test',
                    globalConnectionExternalIds: [connA.externalId, connB.externalId],
                },
            })
            const newProject = newProjectRes!.json()

            // Update to connB and connC (remove connA, keep connB, add connC)
            const updateResponse = await app?.inject({
                method: 'POST',
                url: `/v1/projects/${newProject.id}`,
                headers: { authorization: `Bearer ${ctx.token}` },
                body: {
                    globalConnectionExternalIds: [connB.externalId, connC.externalId],
                },
            })

            expect(updateResponse?.statusCode).toBe(StatusCodes.OK)

            const { data: connections } = await listGlobalConnections(ctx.token)
            const finalA = connections.find((c) => c.id === connA.id)
            const finalB = connections.find((c) => c.id === connB.id)
            const finalC = connections.find((c) => c.id === connC.id)

            expect(finalA?.projectIds).not.toContain(newProject.id)
            expect(finalB?.projectIds).toContain(newProject.id)
            expect(finalC?.projectIds).toContain(newProject.id)
        })

        it('does not duplicate projectId when assigning same connection twice', async () => {
            const { ctx, mockPieceMetadata } = await setupPlatformWithGlobalConnections()

            const conn = await createGlobalConnection(ctx.token, {
                pieceName: mockPieceMetadata.name,
                pieceVersion: mockPieceMetadata.version,
                projectIds: [ctx.project.id],
            })

            const newProjectRes = await app?.inject({
                method: 'POST',
                url: '/v1/projects',
                headers: { authorization: `Bearer ${ctx.token}` },
                body: {
                    displayName: 'Idempotency Test',
                    globalConnectionExternalIds: [conn.externalId],
                },
            })
            const newProject = newProjectRes!.json()

            // Update with the same connection again
            await app?.inject({
                method: 'POST',
                url: `/v1/projects/${newProject.id}`,
                headers: { authorization: `Bearer ${ctx.token}` },
                body: {
                    globalConnectionExternalIds: [conn.externalId],
                },
            })

            const { data: connections } = await listGlobalConnections(ctx.token)
            const updatedConn = connections.find((c) => c.id === conn.id)

            const occurrences = updatedConn?.projectIds.filter((id: string) => id === newProject.id).length
            expect(occurrences).toBe(1)
        })

        it('does not modify connections from another platform', async () => {
            const platform1 = await setupPlatformWithGlobalConnections()
            const platform2 = await setupPlatformWithGlobalConnections()

            // Create a connection on platform2 with the same externalId pattern
            const connOnPlatform2 = await createGlobalConnection(platform2.ctx.token, {
                pieceName: platform2.mockPieceMetadata.name,
                pieceVersion: platform2.mockPieceMetadata.version,
                projectIds: [platform2.ctx.project.id],
            })

            // Create a project on platform1 and try to assign platform2's connection externalId
            const newProjectRes = await app?.inject({
                method: 'POST',
                url: '/v1/projects',
                headers: { authorization: `Bearer ${platform1.ctx.token}` },
                body: {
                    displayName: 'Cross Platform Test',
                    globalConnectionExternalIds: [connOnPlatform2.externalId],
                },
            })
            const newProject = newProjectRes!.json()

            // The platform2 connection should NOT have the platform1 project
            const { data: p2Connections } = await listGlobalConnections(platform2.ctx.token)
            const p2Conn = p2Connections.find((c) => c.id === connOnPlatform2.id)
            expect(p2Conn?.projectIds).not.toContain(newProject.id)
        })

        it('preserves existing project fields when updating connections', async () => {
            const { ctx, mockPieceMetadata } = await setupPlatformWithGlobalConnections()

            const conn = await createGlobalConnection(ctx.token, {
                pieceName: mockPieceMetadata.name,
                pieceVersion: mockPieceMetadata.version,
                projectIds: [ctx.project.id],
            })

            const newProjectRes = await app?.inject({
                method: 'POST',
                url: '/v1/projects',
                headers: { authorization: `Bearer ${ctx.token}` },
                body: { displayName: 'Original Name' },
            })
            const newProject = newProjectRes!.json()

            const updateResponse = await app?.inject({
                method: 'POST',
                url: `/v1/projects/${newProject.id}`,
                headers: { authorization: `Bearer ${ctx.token}` },
                body: {
                    displayName: 'Updated Name',
                    globalConnectionExternalIds: [conn.externalId],
                },
            })

            expect(updateResponse?.statusCode).toBe(StatusCodes.OK)
            const updatedProject = updateResponse!.json()
            expect(updatedProject.displayName).toBe('Updated Name')

            const { data: connections } = await listGlobalConnections(ctx.token)
            const updatedConn = connections.find((c) => c.id === conn.id)
            expect(updatedConn?.projectIds).toContain(newProject.id)
        })
    })
})
