import {
    apId,
    AppConnectionScope,
    AppConnectionType,
    PackageType,
    PrincipalType,
    UpsertGlobalConnectionRequestBody,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupServer } from '../../../../src/app/server'
import { generateMockToken } from '../../../helpers/auth'
import {
    createMockPieceMetadata,
    mockAndSaveBasicSetup,
} from '../../../helpers/mocks'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await initializeDatabase({ runMigrations: false })
    app = await setupServer()
})

afterAll(async () => {
    await databaseConnection().destroy()
    await app?.close()
})

const setupPlatformWithGlobalConnections = async () => {
    const setup = await mockAndSaveBasicSetup({
        plan: {
            globalConnectionsEnabled: true,
        },
    })

    const mockPieceMetadata = createMockPieceMetadata({
        platformId: setup.mockPlatform.id,
        packageType: PackageType.REGISTRY,
    })
    await databaseConnection().getRepository('piece_metadata').save([mockPieceMetadata])

    const mockToken = await generateMockToken({
        id: setup.mockOwner.id,
        type: PrincipalType.USER,
        platform: { id: setup.mockPlatform.id },
    })

    return { ...setup, mockPieceMetadata, mockToken }
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
            const { mockToken, mockPieceMetadata, mockProject } = await setupPlatformWithGlobalConnections()

            const conn1 = await createGlobalConnection(mockToken, {
                pieceName: mockPieceMetadata.name,
                pieceVersion: mockPieceMetadata.version,
                projectIds: [mockProject.id],
            })
            const conn2 = await createGlobalConnection(mockToken, {
                pieceName: mockPieceMetadata.name,
                pieceVersion: mockPieceMetadata.version,
                projectIds: [mockProject.id],
            })
            const connNotSelected = await createGlobalConnection(mockToken, {
                pieceName: mockPieceMetadata.name,
                pieceVersion: mockPieceMetadata.version,
                projectIds: [mockProject.id],
            })

            const createResponse = await app?.inject({
                method: 'POST',
                url: '/v1/projects',
                headers: { authorization: `Bearer ${mockToken}` },
                body: {
                    displayName: 'Project With Connections',
                    globalConnectionExternalIds: [conn1.externalId, conn2.externalId],
                },
            })

            expect(createResponse?.statusCode).toBe(StatusCodes.CREATED)
            const newProject = createResponse!.json()

            const { data: connections } = await listGlobalConnections(mockToken)

            const updatedConn1 = connections.find((c) => c.id === conn1.id)
            const updatedConn2 = connections.find((c) => c.id === conn2.id)
            const updatedConnNotSelected = connections.find((c) => c.id === connNotSelected.id)

            expect(updatedConn1?.projectIds).toContain(newProject.id)
            expect(updatedConn2?.projectIds).toContain(newProject.id)
            expect(updatedConnNotSelected?.projectIds).not.toContain(newProject.id)
        })

        it('creates project without assigning connections when none specified', async () => {
            const { mockToken, mockPieceMetadata, mockProject } = await setupPlatformWithGlobalConnections()

            const conn = await createGlobalConnection(mockToken, {
                pieceName: mockPieceMetadata.name,
                pieceVersion: mockPieceMetadata.version,
                projectIds: [mockProject.id],
            })

            const createResponse = await app?.inject({
                method: 'POST',
                url: '/v1/projects',
                headers: { authorization: `Bearer ${mockToken}` },
                body: {
                    displayName: 'Project Without Connections',
                },
            })

            expect(createResponse?.statusCode).toBe(StatusCodes.CREATED)
            const newProject = createResponse!.json()

            const { data: connections } = await listGlobalConnections(mockToken)
            const updatedConn = connections.find((c) => c.id === conn.id)

            expect(updatedConn?.projectIds).not.toContain(newProject.id)
        })

        it('ignores globalConnectionExternalIds when feature is disabled', async () => {
            const setup = await mockAndSaveBasicSetup({
                plan: {
                    globalConnectionsEnabled: false,
                },
            })

            const mockToken = await generateMockToken({
                id: setup.mockOwner.id,
                type: PrincipalType.USER,
                platform: { id: setup.mockPlatform.id },
            })

            const createResponse = await app?.inject({
                method: 'POST',
                url: '/v1/projects',
                headers: { authorization: `Bearer ${mockToken}` },
                body: {
                    displayName: 'Project Feature Disabled',
                    globalConnectionExternalIds: ['non-existent-external-id'],
                },
            })

            expect(createResponse?.statusCode).toBe(StatusCodes.CREATED)
        })
    })

    describe('Update Project globalConnectionExternalIds', () => {

        it('adds global connections to a project', async () => {
            const { mockToken, mockPieceMetadata, mockProject } = await setupPlatformWithGlobalConnections()

            const conn1 = await createGlobalConnection(mockToken, {
                pieceName: mockPieceMetadata.name,
                pieceVersion: mockPieceMetadata.version,
                projectIds: [mockProject.id],
            })
            const conn2 = await createGlobalConnection(mockToken, {
                pieceName: mockPieceMetadata.name,
                pieceVersion: mockPieceMetadata.version,
                projectIds: [mockProject.id],
            })

            const newProjectRes = await app?.inject({
                method: 'POST',
                url: '/v1/projects',
                headers: { authorization: `Bearer ${mockToken}` },
                body: { displayName: 'Target Project' },
            })
            const newProject = newProjectRes!.json()

            const updateResponse = await app?.inject({
                method: 'POST',
                url: `/v1/projects/${newProject.id}`,
                headers: { authorization: `Bearer ${mockToken}` },
                body: {
                    globalConnectionExternalIds: [conn1.externalId, conn2.externalId],
                },
            })

            expect(updateResponse?.statusCode).toBe(StatusCodes.OK)

            const { data: connections } = await listGlobalConnections(mockToken)
            const updatedConn1 = connections.find((c) => c.id === conn1.id)
            const updatedConn2 = connections.find((c) => c.id === conn2.id)

            expect(updatedConn1?.projectIds).toContain(newProject.id)
            expect(updatedConn2?.projectIds).toContain(newProject.id)
        })

        it('removes global connections from a project', async () => {
            const { mockToken, mockPieceMetadata, mockProject } = await setupPlatformWithGlobalConnections()

            const conn = await createGlobalConnection(mockToken, {
                pieceName: mockPieceMetadata.name,
                pieceVersion: mockPieceMetadata.version,
                projectIds: [mockProject.id],
            })

            const newProjectRes = await app?.inject({
                method: 'POST',
                url: '/v1/projects',
                headers: { authorization: `Bearer ${mockToken}` },
                body: {
                    displayName: 'Remove Test',
                    globalConnectionExternalIds: [conn.externalId],
                },
            })
            const newProject = newProjectRes!.json()

            // Verify the connection was assigned
            let connectionsResult = await listGlobalConnections(mockToken)
            let updatedConn = connectionsResult.data.find((c) => c.id === conn.id)
            expect(updatedConn?.projectIds).toContain(newProject.id)

            // Update to remove all connections
            const updateResponse = await app?.inject({
                method: 'POST',
                url: `/v1/projects/${newProject.id}`,
                headers: { authorization: `Bearer ${mockToken}` },
                body: {
                    globalConnectionExternalIds: [],
                },
            })

            expect(updateResponse?.statusCode).toBe(StatusCodes.OK)

            connectionsResult = await listGlobalConnections(mockToken)
            updatedConn = connectionsResult.data.find((c) => c.id === conn.id)
            expect(updatedConn?.projectIds).not.toContain(newProject.id)
        })

        it('swaps global connections: adds new ones and removes old ones', async () => {
            const { mockToken, mockPieceMetadata, mockProject } = await setupPlatformWithGlobalConnections()

            const connA = await createGlobalConnection(mockToken, {
                pieceName: mockPieceMetadata.name,
                pieceVersion: mockPieceMetadata.version,
                projectIds: [mockProject.id],
                displayName: 'Connection A',
            })
            const connB = await createGlobalConnection(mockToken, {
                pieceName: mockPieceMetadata.name,
                pieceVersion: mockPieceMetadata.version,
                projectIds: [mockProject.id],
                displayName: 'Connection B',
            })
            const connC = await createGlobalConnection(mockToken, {
                pieceName: mockPieceMetadata.name,
                pieceVersion: mockPieceMetadata.version,
                projectIds: [mockProject.id],
                displayName: 'Connection C',
            })

            // Create project with connA and connB
            const newProjectRes = await app?.inject({
                method: 'POST',
                url: '/v1/projects',
                headers: { authorization: `Bearer ${mockToken}` },
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
                headers: { authorization: `Bearer ${mockToken}` },
                body: {
                    globalConnectionExternalIds: [connB.externalId, connC.externalId],
                },
            })

            expect(updateResponse?.statusCode).toBe(StatusCodes.OK)

            const { data: connections } = await listGlobalConnections(mockToken)
            const finalA = connections.find((c) => c.id === connA.id)
            const finalB = connections.find((c) => c.id === connB.id)
            const finalC = connections.find((c) => c.id === connC.id)

            expect(finalA?.projectIds).not.toContain(newProject.id)
            expect(finalB?.projectIds).toContain(newProject.id)
            expect(finalC?.projectIds).toContain(newProject.id)
        })

        it('does not duplicate projectId when assigning same connection twice', async () => {
            const { mockToken, mockPieceMetadata, mockProject } = await setupPlatformWithGlobalConnections()
            
            const conn = await createGlobalConnection(mockToken, {
                pieceName: mockPieceMetadata.name,
                pieceVersion: mockPieceMetadata.version,
                projectIds: [mockProject.id],
            })

            const newProjectRes = await app?.inject({
                method: 'POST',
                url: '/v1/projects',
                headers: { authorization: `Bearer ${mockToken}` },
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
                headers: { authorization: `Bearer ${mockToken}` },
                body: {
                    globalConnectionExternalIds: [conn.externalId],
                },
            })

            const { data: connections } = await listGlobalConnections(mockToken)
            const updatedConn = connections.find((c) => c.id === conn.id)

            const occurrences = updatedConn?.projectIds.filter((id: string) => id === newProject.id).length
            expect(occurrences).toBe(1)
        })

        it('does not modify connections from another platform', async () => {
            const platform1 = await setupPlatformWithGlobalConnections()
            const platform2 = await setupPlatformWithGlobalConnections()

            // Create a connection on platform2 with the same externalId pattern
            const connOnPlatform2 = await createGlobalConnection(platform2.mockToken, {
                pieceName: platform2.mockPieceMetadata.name,
                pieceVersion: platform2.mockPieceMetadata.version,
                projectIds: [platform2.mockProject.id],
            })

            // Create a project on platform1 and try to assign platform2's connection externalId
            const newProjectRes = await app?.inject({
                method: 'POST',
                url: '/v1/projects',
                headers: { authorization: `Bearer ${platform1.mockToken}` },
                body: {
                    displayName: 'Cross Platform Test',
                    globalConnectionExternalIds: [connOnPlatform2.externalId],
                },
            })
            const newProject = newProjectRes!.json()

            // The platform2 connection should NOT have the platform1 project
            const { data: p2Connections } = await listGlobalConnections(platform2.mockToken)
            const p2Conn = p2Connections.find((c) => c.id === connOnPlatform2.id)
            expect(p2Conn?.projectIds).not.toContain(newProject.id)
        })

        it('preserves existing project fields when updating connections', async () => {
            const { mockToken, mockPieceMetadata, mockProject } = await setupPlatformWithGlobalConnections()

            const conn = await createGlobalConnection(mockToken, {
                pieceName: mockPieceMetadata.name,
                pieceVersion: mockPieceMetadata.version,
                projectIds: [mockProject.id],
            })

            const newProjectRes = await app?.inject({
                method: 'POST',
                url: '/v1/projects',
                headers: { authorization: `Bearer ${mockToken}` },
                body: { displayName: 'Original Name' },
            })
            const newProject = newProjectRes!.json()

            const updateResponse = await app?.inject({
                method: 'POST',
                url: `/v1/projects/${newProject.id}`,
                headers: { authorization: `Bearer ${mockToken}` },
                body: {
                    displayName: 'Updated Name',
                    globalConnectionExternalIds: [conn.externalId],
                },
            })

            expect(updateResponse?.statusCode).toBe(StatusCodes.OK)
            const updatedProject = updateResponse!.json()
            expect(updatedProject.displayName).toBe('Updated Name')

            const { data: connections } = await listGlobalConnections(mockToken)
            const updatedConn = connections.find((c) => c.id === conn.id)
            expect(updatedConn?.projectIds).toContain(newProject.id)
        })
    })
})
