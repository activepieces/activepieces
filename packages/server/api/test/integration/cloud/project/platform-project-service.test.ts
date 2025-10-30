import { ActivepiecesError, ErrorCode, FlowStatus } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { platformProjectService } from '../../../../src/app/ee/projects/platform-project-service'
import { setupServer } from '../../../../src/app/server'
import { createMockFile, createMockFlow, createMockFlowRun, createMockFlowVersion, createMockPieceMetadata, mockAndSaveBasicSetup } from '../../../helpers/mocks'

let app: FastifyInstance | null = null
let mockLog: FastifyBaseLogger

beforeAll(async () => {
    await initializeDatabase({ runMigrations: false })
    app = await setupServer()
    mockLog = app!.log!
})

afterAll(async () => {
    await databaseConnection().destroy()
    await app?.close()
})

describe('Platform Project Service', () => {
    describe('Hard delete Project', () => {
        it('Hard deletes associated flows fails', async () => {
            // arrange
            const { mockProject, mockPlatform } = await mockAndSaveBasicSetup()

            const mockFlow = createMockFlow({ projectId: mockProject.id, status: FlowStatus.ENABLED })
            await databaseConnection().getRepository('flow').save([mockFlow])

            const mockFlowVersion = createMockFlowVersion({ flowId: mockFlow.id })
            const mockPublishedFlowVersion = createMockFlowVersion({ flowId: mockFlow.id })
            await databaseConnection().getRepository('flow_version').save([mockFlowVersion, mockPublishedFlowVersion])

            const mockFlowRun = createMockFlowRun({
                projectId: mockProject.id,
                flowId: mockFlow.id,
                flowVersionId: mockPublishedFlowVersion.id,
            })
            await databaseConnection().getRepository('flow_run').save([mockFlowRun])

            await databaseConnection().getRepository('flow').update(mockFlow.id, {
                publishedVersionId: mockPublishedFlowVersion.id,
            })

            try {
                // act
                await platformProjectService(mockLog).hardDelete({ id: mockProject.id, platformId: mockPlatform.id })

            }
            catch (error) {
            // assert

                expect(error).toBeInstanceOf(ActivepiecesError)
                expect((error as ActivepiecesError).error.code).toBe(ErrorCode.VALIDATION)
                return
            }
            throw new Error('Expected error to be thrown because project has enabled flows')

         
        })

        it('Hard deletes associated piece metadata', async () => {
            // arrange
            const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()

            const mockPieceArchive = createMockFile({ platformId: mockPlatform.id, projectId: mockProject.id })
            await databaseConnection().getRepository('file').save([mockPieceArchive])

            const mockPieceMetadata = createMockPieceMetadata({ projectId: mockProject.id, archiveId: mockPieceArchive.id })
            await databaseConnection().getRepository('piece_metadata').save([mockPieceMetadata])

            // act
            await platformProjectService(mockLog).hardDelete({ id: mockProject.id, platformId: mockPlatform.id })

            // assert
            const fileCount = await databaseConnection().getRepository('file').countBy({ projectId: mockProject.id })
            expect(fileCount).toBe(0)

            const pieceMetadataCount = await databaseConnection().getRepository('piece_metadata').countBy({ projectId: mockProject.id })
            expect(pieceMetadataCount).toBe(0)
        })
    })
})
