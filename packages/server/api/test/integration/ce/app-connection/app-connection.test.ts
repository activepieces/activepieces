import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import {
    apId,
    AppConnectionType,
    PackageType,
    PieceType,
} from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { pieceMetadataService } from '../../../../src/app/pieces/metadata/piece-metadata-service'
import { db } from '../../../helpers/db'
import {
    createMockPieceMetadata,
} from '../../../helpers/mocks'
import { createTestContext } from '../../../helpers/test-context'
import { describeWithAuth } from '../../../helpers/describe-with-auth'

let app: FastifyInstance | null = null
let mockLog: FastifyBaseLogger

beforeAll(async () => {
    app = await setupTestEnvironment()
    mockLog = app!.log!
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('AppConnection CE API', () => {
    describeWithAuth('POST /v1/app-connections (Create)', () => app!, (setup) => {
        it('should create a SECRET_TEXT connection', async () => {
            const ctx = await setup()

            const mockPiece = createMockPieceMetadata({
                platformId: ctx.platform.id,
                packageType: PackageType.REGISTRY,
                pieceType: PieceType.OFFICIAL,
            })
            await db.save('piece_metadata', mockPiece)
            pieceMetadataService(mockLog).getOrThrow = vi.fn().mockResolvedValue(mockPiece)

            const response = await ctx.post('/v1/app-connections', {
                externalId: 'test-secret-connection',
                displayName: 'Test Secret Connection',
                pieceName: mockPiece.name,
                projectId: ctx.project.id,
                type: AppConnectionType.SECRET_TEXT,
                value: {
                    type: AppConnectionType.SECRET_TEXT,
                    secret_text: 'my-secret',
                },
                pieceVersion: mockPiece.version,
            })

            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            const body = response?.json()
            expect(body.displayName).toBe('Test Secret Connection')
            expect(body.pieceName).toBe(mockPiece.name)
            expect(body.externalId).toBe('test-secret-connection')
            expect(body.value).toBeUndefined()
        })

        it('should create a NO_AUTH connection', async () => {
            const ctx = await setup()

            const mockPiece = createMockPieceMetadata({
                platformId: ctx.platform.id,
                packageType: PackageType.REGISTRY,
                pieceType: PieceType.OFFICIAL,
            })
            await db.save('piece_metadata', mockPiece)
            pieceMetadataService(mockLog).getOrThrow = vi.fn().mockResolvedValue(mockPiece)

            const response = await ctx.post('/v1/app-connections', {
                externalId: 'test-no-auth-connection',
                displayName: 'Test No Auth',
                pieceName: mockPiece.name,
                projectId: ctx.project.id,
                type: AppConnectionType.NO_AUTH,
                value: {
                    type: AppConnectionType.NO_AUTH,
                },
                pieceVersion: mockPiece.version,
            })

            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            const body = response?.json()
            expect(body.displayName).toBe('Test No Auth')
        })

        it('should upsert on duplicate externalId', async () => {
            const ctx = await setup()

            const mockPiece = createMockPieceMetadata({
                platformId: ctx.platform.id,
                packageType: PackageType.REGISTRY,
                pieceType: PieceType.OFFICIAL,
            })
            await db.save('piece_metadata', mockPiece)
            pieceMetadataService(mockLog).getOrThrow = vi.fn().mockResolvedValue(mockPiece)

            const createPayload = {
                externalId: 'upsert-test-connection',
                displayName: 'First Name',
                pieceName: mockPiece.name,
                projectId: ctx.project.id,
                type: AppConnectionType.SECRET_TEXT,
                value: {
                    type: AppConnectionType.SECRET_TEXT,
                    secret_text: 'secret1',
                },
                pieceVersion: mockPiece.version,
            }

            const first = await ctx.post('/v1/app-connections', createPayload)
            expect(first?.statusCode).toBe(StatusCodes.CREATED)
            const firstId = first?.json().id

            const second = await ctx.post('/v1/app-connections', {
                ...createPayload,
                displayName: 'Second Name',
                value: {
                    type: AppConnectionType.SECRET_TEXT,
                    secret_text: 'secret2',
                },
            })
            expect(second?.statusCode).toBe(StatusCodes.CREATED)
            const secondBody = second?.json()
            expect(secondBody.id).toBe(firstId)
            expect(secondBody.displayName).toBe('Second Name')
        })
    })

    describeWithAuth('POST /v1/app-connections/:id (Update)', () => app!, (setup) => {
        it('should update display name', async () => {
            const ctx = await setup()

            const mockPiece = createMockPieceMetadata({
                platformId: ctx.platform.id,
                packageType: PackageType.REGISTRY,
                pieceType: PieceType.OFFICIAL,
            })
            await db.save('piece_metadata', mockPiece)
            pieceMetadataService(mockLog).getOrThrow = vi.fn().mockResolvedValue(mockPiece)

            const createResponse = await ctx.post('/v1/app-connections', {
                externalId: 'update-test-connection',
                displayName: 'Original Name',
                pieceName: mockPiece.name,
                projectId: ctx.project.id,
                type: AppConnectionType.SECRET_TEXT,
                value: {
                    type: AppConnectionType.SECRET_TEXT,
                    secret_text: 'my-secret',
                },
                pieceVersion: mockPiece.version,
            })
            const connectionId = createResponse?.json().id

            const updateResponse = await ctx.post(`/v1/app-connections/${connectionId}`, {
                displayName: 'Updated Name',
            })

            expect(updateResponse?.statusCode).toBe(StatusCodes.OK)
            expect(updateResponse?.json().displayName).toBe('Updated Name')
        })

        it('should return 404 for non-existent connection', async () => {
            const ctx = await setup()
            const nonExistentId = apId()

            const response = await ctx.post(`/v1/app-connections/${nonExistentId}`, {
                displayName: 'Updated Name',
            })

            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })

    describeWithAuth('GET /v1/app-connections (List)', () => app!, (setup) => {
        it('should list connections', async () => {
            const ctx = await setup()

            const mockPiece = createMockPieceMetadata({
                platformId: ctx.platform.id,
                packageType: PackageType.REGISTRY,
                pieceType: PieceType.OFFICIAL,
            })
            await db.save('piece_metadata', mockPiece)
            pieceMetadataService(mockLog).getOrThrow = vi.fn().mockResolvedValue(mockPiece)

            await ctx.post('/v1/app-connections', {
                externalId: 'list-test-connection',
                displayName: 'Test Connection',
                pieceName: mockPiece.name,
                projectId: ctx.project.id,
                type: AppConnectionType.SECRET_TEXT,
                value: {
                    type: AppConnectionType.SECRET_TEXT,
                    secret_text: 'my-secret',
                },
                pieceVersion: mockPiece.version,
            })

            const response = await ctx.get('/v1/app-connections', {
                projectId: ctx.project.id,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data.length).toBeGreaterThanOrEqual(1)
        })

        it('should filter by pieceName', async () => {
            const ctx = await setup()

            const mockPieceA = createMockPieceMetadata({
                name: 'piece-a-filter',
                platformId: ctx.platform.id,
                packageType: PackageType.REGISTRY,
                pieceType: PieceType.OFFICIAL,
            })
            const mockPieceB = createMockPieceMetadata({
                name: 'piece-b-filter',
                platformId: ctx.platform.id,
                packageType: PackageType.REGISTRY,
                pieceType: PieceType.OFFICIAL,
            })
            await db.save('piece_metadata', [mockPieceA, mockPieceB])
            pieceMetadataService(mockLog).getOrThrow = vi.fn().mockResolvedValue(mockPieceA)

            await ctx.post('/v1/app-connections', {
                externalId: 'filter-a',
                displayName: 'Connection A',
                pieceName: mockPieceA.name,
                projectId: ctx.project.id,
                type: AppConnectionType.SECRET_TEXT,
                value: { type: AppConnectionType.SECRET_TEXT, secret_text: 's' },
                pieceVersion: mockPieceA.version,
            })

            pieceMetadataService(mockLog).getOrThrow = vi.fn().mockResolvedValue(mockPieceB)

            await ctx.post('/v1/app-connections', {
                externalId: 'filter-b',
                displayName: 'Connection B',
                pieceName: mockPieceB.name,
                projectId: ctx.project.id,
                type: AppConnectionType.SECRET_TEXT,
                value: { type: AppConnectionType.SECRET_TEXT, secret_text: 's' },
                pieceVersion: mockPieceB.version,
            })

            const response = await ctx.get('/v1/app-connections', {
                projectId: ctx.project.id,
                pieceName: mockPieceA.name,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.data).toHaveLength(1)
            expect(body.data[0].pieceName).toBe(mockPieceA.name)
        })
    })

    describe('GET /v1/app-connections (Isolation)', () => {
        it('should isolate connections between projects', async () => {
            const ctx1 = await createTestContext(app!)
            const ctx2 = await createTestContext(app!)

            const mockPiece = createMockPieceMetadata({
                platformId: ctx1.platform.id,
                packageType: PackageType.REGISTRY,
                pieceType: PieceType.OFFICIAL,
            })
            await db.save('piece_metadata', mockPiece)
            pieceMetadataService(mockLog).getOrThrow = vi.fn().mockResolvedValue(mockPiece)

            await ctx1.post('/v1/app-connections', {
                externalId: 'isolation-test',
                displayName: 'Project 1 Connection',
                pieceName: mockPiece.name,
                projectId: ctx1.project.id,
                type: AppConnectionType.SECRET_TEXT,
                value: { type: AppConnectionType.SECRET_TEXT, secret_text: 's' },
                pieceVersion: mockPiece.version,
            })

            const response = await ctx2.get('/v1/app-connections', {
                projectId: ctx2.project.id,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            const ids = body.data.map((c: Record<string, string>) => c.externalId)
            expect(ids).not.toContain('isolation-test')
        })
    })

    describeWithAuth('DELETE /v1/app-connections/:id', () => app!, (setup) => {
        it('should delete a connection', async () => {
            const ctx = await setup()

            const mockPiece = createMockPieceMetadata({
                platformId: ctx.platform.id,
                packageType: PackageType.REGISTRY,
                pieceType: PieceType.OFFICIAL,
            })
            await db.save('piece_metadata', mockPiece)
            pieceMetadataService(mockLog).getOrThrow = vi.fn().mockResolvedValue(mockPiece)

            const createResponse = await ctx.post('/v1/app-connections', {
                externalId: 'delete-test',
                displayName: 'Delete Me',
                pieceName: mockPiece.name,
                projectId: ctx.project.id,
                type: AppConnectionType.SECRET_TEXT,
                value: { type: AppConnectionType.SECRET_TEXT, secret_text: 's' },
                pieceVersion: mockPiece.version,
            })
            const connectionId = createResponse?.json().id

            const response = await ctx.delete(`/v1/app-connections/${connectionId}`)

            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        })

        it('should return 404 for non-existent connection', async () => {
            const ctx = await setup()
            const nonExistentId = apId()

            const response = await ctx.delete(`/v1/app-connections/${nonExistentId}`)

            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })
    })
})
