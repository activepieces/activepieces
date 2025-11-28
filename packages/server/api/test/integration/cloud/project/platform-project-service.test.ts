import { ActivepiecesError, ErrorCode, FlowStatus } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { platformProjectService } from '../../../../src/app/ee/projects/platform-project-service'
import { setupServer } from '../../../../src/app/server'
import { createMockFlow, createMockFlowRun, createMockFlowVersion, mockAndSaveBasicSetup } from '../../../helpers/mocks'

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


    })
})
