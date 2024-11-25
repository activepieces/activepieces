import { FastifyInstance } from 'fastify'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { platformProjectService } from '../../../../src/app/ee/projects/platform-project-service'
import { setupServer } from '../../../../src/app/server'
import { createMockFile, createMockFlow, createMockFlowRun, createMockFlowVersion, createMockPieceMetadata, mockBasicSetup } from '../../../helpers/mocks'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await initializeDatabase({ runMigrations: false })
    app = await setupServer()
})

afterAll(async () => {
    await databaseConnection().destroy()
    await app?.close()
})

describe('Platform Project Service', () => {
    describe('Hard delete Project', () => {
        it('Hard deletes associated flows', async () => {
            // arrange
            const { mockProject } = await mockBasicSetup()

            const mockFlow = createMockFlow({ projectId: mockProject.id })
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

            // act
            await platformProjectService.hardDelete({ id: mockProject.id })

            // assert
            const flowCount = await databaseConnection().getRepository('flow').countBy({ projectId: mockProject.id })
            expect(flowCount).toBe(0)

            const flowVersionCount = await databaseConnection().getRepository('flow_version').countBy({ flowId: mockFlow.id })
            expect(flowVersionCount).toBe(0)

            const flowRunCount = await databaseConnection().getRepository('flow_run').countBy({ projectId: mockProject.id })
            expect(flowRunCount).toBe(0)
        })

        it('Hard deletes associated piece metadata', async () => {
            // arrange
            const { mockPlatform, mockProject } = await mockBasicSetup()

            const mockPieceArchive = createMockFile({ platformId: mockPlatform.id, projectId: mockProject.id })
            await databaseConnection().getRepository('file').save([mockPieceArchive])

            const mockPieceMetadata = createMockPieceMetadata({ projectId: mockProject.id, archiveId: mockPieceArchive.id })
            await databaseConnection().getRepository('piece_metadata').save([mockPieceMetadata])

            // act
            await platformProjectService.hardDelete({ id: mockProject.id })

            // assert
            const fileCount = await databaseConnection().getRepository('file').countBy({ projectId: mockProject.id })
            expect(fileCount).toBe(0)

            const pieceMetadataCount = await databaseConnection().getRepository('piece_metadata').countBy({ projectId: mockProject.id })
            expect(pieceMetadataCount).toBe(0)
        })
    })
})
