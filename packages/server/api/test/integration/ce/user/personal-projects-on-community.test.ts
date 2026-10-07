import { ProjectType } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { userService } from '../../../../src/app/user/user-service'
import { createMockProject, createMockUserIdentity, mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null
let mockLog: FastifyBaseLogger

beforeAll(async () => {
    app = await setupTestEnvironment()
    mockLog = app!.log!
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Personal projects on Community', () => {
    it('creates a personal project even when personal projects are saved off with a default project', async () => {
        const { mockPlatform, mockOwner } = await mockAndSaveBasicSetup()
        const teamProject = createMockProject({ platformId: mockPlatform.id, ownerId: mockOwner.id, type: ProjectType.TEAM })
        await databaseConnection().getRepository('project').save(teamProject)
        await databaseConnection().getRepository('platform').update({ id: mockPlatform.id }, { autoCreatePersonalProjects: false, defaultProjectIds: [teamProject.id] })
        const identity = createMockUserIdentity({ verified: true })
        await databaseConnection().getRepository('user_identity').save(identity)

        const { user } = await userService(mockLog).getOrCreateWithProject({ identity, platformId: mockPlatform.id })

        expect(await databaseConnection().getRepository('project').countBy({ ownerId: user.id, type: ProjectType.PERSONAL })).toBe(1)
    })
})
