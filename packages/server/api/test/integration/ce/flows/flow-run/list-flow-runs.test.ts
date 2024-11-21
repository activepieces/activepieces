import { rolePermissions } from '@activepieces/ee-shared'
import { apId, PrincipalType, ProjectMemberRole, ProjectRole, RoleType } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyInstance } from 'fastify'
import { databaseConnection } from '../../../../../src/app/database/database-connection'
import { setupServer } from '../../../../../src/app/server'
import { generateMockToken } from '../../../../helpers/auth'
import { createMockPlatform, createMockProject, createMockUser } from '../../../../helpers/mocks'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await databaseConnection().initialize()
    app = await setupServer()

    for (const role of Object.values(ProjectMemberRole)) {
        const projectRole: ProjectRole = {
            name: role,
            permissions: rolePermissions[role],
            type: RoleType.DEFAULT,
            id: apId(),
            created: dayjs().toISOString(),
            updated: dayjs().toISOString(),
        }
        await databaseConnection().getRepository('project_role').save(projectRole)
    }   
})

afterAll(async () => {
    await databaseConnection().destroy()
    await app?.close()
})

describe('List flow runs endpoint', () => {
    it('should return 200', async () => {
        // arrange
        const mockUser = createMockUser()
        await databaseConnection().getRepository('user').save([mockUser])

        const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
        await databaseConnection().getRepository('platform').save(mockPlatform)

        const mockProject = createMockProject({
            ownerId: mockUser.id,
            platformId: mockPlatform.id,
        })
        await databaseConnection().getRepository('project').save([mockProject])

        const testToken = await generateMockToken({
            type: PrincipalType.USER,
            id: mockUser.id,
            projectId: mockProject.id,
            platform: {
                id: mockPlatform.id,
            },
        })

        // act
        const response = await app?.inject({
            method: 'GET',
            url: '/v1/flow-runs',
            headers: {
                authorization: `Bearer ${testToken}`,
            },
            query: {
                projectId: mockProject.id,
            },
        })

        // assert
        expect(response?.statusCode).toBe(200)
    })
})
