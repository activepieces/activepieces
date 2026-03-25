import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import {
    AppConnectionType,
    DefaultProjectRole,
    PackageType,
} from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { pieceMetadataService } from '../../../../src/app/pieces/metadata/piece-metadata-service'
import { db } from '../../../helpers/db'
import {
    createMockPieceMetadata,
} from '../../../helpers/mocks'
import { describeRolePermissions } from '../../../helpers/permission-test'
import { createTestContext } from '../../../helpers/test-context'

let app: FastifyInstance | null = null
let mockLog: FastifyBaseLogger

beforeAll(async () => {
    app = await setupTestEnvironment()
    mockLog = app!.log!
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('AppConnection API', () => {
    describe('Upsert AppConnection endpoint', () => {
        it('Succeeds with metadata field', async () => {
            const ctx = await createTestContext(app!)

            const mockPieceMetadata = createMockPieceMetadata({
                platformId: ctx.platform.id,
                packageType: PackageType.REGISTRY,
            })
            await db.save('piece_metadata', mockPieceMetadata)
            pieceMetadataService(mockLog).getOrThrow = vi.fn().mockResolvedValue(mockPieceMetadata)

            const response = await ctx.post('/v1/app-connections', {
                externalId: 'test-app-connection-with-metadata',
                displayName: 'Test Connection with Metadata',
                pieceName: mockPieceMetadata.name,
                projectId: ctx.project.id,
                type: AppConnectionType.SECRET_TEXT,
                value: {
                    type: AppConnectionType.SECRET_TEXT,
                    secret_text: 'test-secret-text',
                },
                metadata: { foo: 'bar' },
                pieceVersion: mockPieceMetadata.version,
            })

            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            const responseBody = response?.json()
            expect(responseBody.metadata).toEqual({ foo: 'bar' })
            expect(responseBody.pieceVersion).toEqual(mockPieceMetadata.version)

            const updateResponse = await ctx.post(`/v1/app-connections/${responseBody.id}`, {
                displayName: 'Updated Connection Name',
                metadata: { foo: 'baz' },
            })

            expect(updateResponse?.statusCode).toBe(StatusCodes.OK)
            const updatedResponseBody = updateResponse?.json()
            expect(updatedResponseBody.metadata).toEqual({ foo: 'baz' })
        })

        describeRolePermissions({
            app: () => app!,
            request: async (memberCtx, ownerCtx) => {
                const mockPieceMetadata = createMockPieceMetadata({
                    platformId: ownerCtx.platform.id,
                    packageType: PackageType.REGISTRY,
                })
                await db.save('piece_metadata', mockPieceMetadata)
                pieceMetadataService(mockLog).getOrThrow = vi.fn().mockResolvedValue(mockPieceMetadata)

                return memberCtx.post('/v1/app-connections', {
                    externalId: 'test-app-connection',
                    displayName: 'test-app-connection',
                    pieceName: mockPieceMetadata.name,
                    projectId: ownerCtx.project.id,
                    type: AppConnectionType.SECRET_TEXT,
                    value: {
                        type: AppConnectionType.SECRET_TEXT,
                        secret_text: 'test-secret-text',
                    },
                    pieceVersion: mockPieceMetadata.version,
                })
            },
            allowedRoles: [DefaultProjectRole.ADMIN, DefaultProjectRole.EDITOR],
            forbiddenRoles: [DefaultProjectRole.VIEWER],
        })
    })

    describe('List AppConnections endpoint', () => {
        describeRolePermissions({
            app: () => app!,
            request: (memberCtx, ownerCtx) => {
                return memberCtx.get('/v1/app-connections', {
                    projectId: ownerCtx.project.id,
                })
            },
            allowedRoles: [DefaultProjectRole.ADMIN, DefaultProjectRole.EDITOR, DefaultProjectRole.VIEWER],
            forbiddenRoles: [],
        })
    })
})
