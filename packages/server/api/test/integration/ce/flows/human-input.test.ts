import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import {
    apId,
    FlowStatus,
    FlowTriggerType,
    FlowVersionState,
    PackageType,
    PieceType,
} from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { pieceCache } from '../../../../src/app/pieces/metadata/piece-cache'
import { db } from '../../../helpers/db'
import {
    createMockFlow,
    createMockFlowVersion,
    createMockPieceMetadata,
} from '../../../helpers/mocks'
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

describe('Human Input API', () => {
    describe('GET /v1/human-input/form/:flowId', () => {
        it('should return form config for flow with form trigger', async () => {
            const ctx = await createTestContext(app!)

            await databaseConnection().getRepository('piece_metadata').createQueryBuilder().delete().execute()
            const mockPiece = createMockPieceMetadata({
                name: '@activepieces/piece-forms',
                version: '0.2.0',
                pieceType: PieceType.OFFICIAL,
                packageType: PackageType.REGISTRY,
            })
            await db.save('piece_metadata', mockPiece)
            await pieceCache(mockLog).setup()

            const mockFlow = createMockFlow({
                projectId: ctx.project.id,
                status: FlowStatus.ENABLED,
            })
            await db.save('flow', mockFlow)

            const mockFlowVersion = createMockFlowVersion({
                flowId: mockFlow.id,
                state: FlowVersionState.LOCKED,
                trigger: {
                    type: FlowTriggerType.PIECE,
                    settings: {
                        pieceName: '@activepieces/piece-forms',
                        pieceVersion: '0.2.0',
                        triggerName: 'form_submission',
                        input: {
                            inputs: [
                                {
                                    displayName: 'Name',
                                    required: true,
                                    description: 'Enter your name',
                                    type: 'text',
                                },
                            ],
                            waitForResponse: false,
                        },
                        propertySettings: {},
                    },
                    valid: true,
                    name: 'trigger',
                    displayName: 'Form Submission',
                },
            })
            await db.save('flow_version', mockFlowVersion)
            await db.update('flow', mockFlow.id, { publishedVersionId: mockFlowVersion.id })

            const response = await app?.inject({
                method: 'GET',
                url: `/v1/human-input/form/${mockFlow.id}`,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.id).toBe(mockFlow.id)
            expect(typeof body.title).toBe('string')
            expect(body.props).toEqual(
                expect.objectContaining({
                    inputs: expect.any(Array),
                }),
            )
        })

        it('should return 400 for non-existent flow', async () => {
            const nonExistentId = apId()
            const response = await app?.inject({
                method: 'GET',
                url: `/v1/human-input/form/${nonExistentId}`,
            })

            expect(response?.statusCode).toBe(StatusCodes.BAD_REQUEST)
        })

        it('should return error for flow without form trigger', async () => {
            const ctx = await createTestContext(app!)

            const mockFlow = createMockFlow({
                projectId: ctx.project.id,
                status: FlowStatus.ENABLED,
            })
            await db.save('flow', mockFlow)

            const mockFlowVersion = createMockFlowVersion({
                flowId: mockFlow.id,
                state: FlowVersionState.LOCKED,
            })
            await db.save('flow_version', mockFlowVersion)
            await db.update('flow', mockFlow.id, { publishedVersionId: mockFlowVersion.id })

            const response = await app?.inject({
                method: 'GET',
                url: `/v1/human-input/form/${mockFlow.id}`,
            })

            expect(response?.statusCode).toBe(StatusCodes.BAD_REQUEST)
        })
    })

    describe('GET /v1/human-input/chat/:flowId', () => {
        it('should return chat config for flow with chat trigger', async () => {
            const ctx = await createTestContext(app!)

            await databaseConnection().getRepository('piece_metadata').createQueryBuilder().delete().execute()
            const mockPiece = createMockPieceMetadata({
                name: '@activepieces/piece-forms',
                version: '0.3.0',
                pieceType: PieceType.OFFICIAL,
                packageType: PackageType.REGISTRY,
            })
            await db.save('piece_metadata', mockPiece)
            await pieceCache(mockLog).setup()

            const mockFlow = createMockFlow({
                projectId: ctx.project.id,
                status: FlowStatus.ENABLED,
            })
            await db.save('flow', mockFlow)

            const mockFlowVersion = createMockFlowVersion({
                flowId: mockFlow.id,
                state: FlowVersionState.LOCKED,
                trigger: {
                    type: FlowTriggerType.PIECE,
                    settings: {
                        pieceName: '@activepieces/piece-forms',
                        pieceVersion: '0.3.0',
                        triggerName: 'chat_submission',
                        input: {
                            botName: 'Test Bot',
                        },
                        propertySettings: {},
                    },
                    valid: true,
                    name: 'trigger',
                    displayName: 'Chat Submission',
                },
            })
            await db.save('flow_version', mockFlowVersion)
            await db.update('flow', mockFlow.id, { publishedVersionId: mockFlowVersion.id })

            const response = await app?.inject({
                method: 'GET',
                url: `/v1/human-input/chat/${mockFlow.id}`,
            })

            expect(response?.statusCode).toBe(StatusCodes.OK)
            const body = response?.json()
            expect(body.id).toBe(mockFlow.id)
            expect(typeof body.title).toBe('string')
            expect(body.props).toEqual(
                expect.objectContaining({
                    botName: 'Test Bot',
                }),
            )
        })

        it('should return 400 for non-existent flow', async () => {
            const nonExistentId = apId()
            const response = await app?.inject({
                method: 'GET',
                url: `/v1/human-input/chat/${nonExistentId}`,
            })

            expect(response?.statusCode).toBe(StatusCodes.BAD_REQUEST)
        })
    })
})
