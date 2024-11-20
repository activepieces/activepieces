import { rolePermissions } from '@activepieces/ee-shared'
import { apId, PrincipalType, ProjectMemberRole, Rbac, RoleType } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupServer } from '../../../../src/app/server'
import { generateMockToken } from '../../../helpers/auth'
import { createMockPlatform, createMockProject, createMockUser } from '../../../helpers/mocks'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await databaseConnection().initialize()
    app = await setupServer()

    for (const role of Object.values(ProjectMemberRole)) {
        const rbacRole: Rbac = {
            name: role,
            permissions: rolePermissions[role],
            type: RoleType.DEFAULT,
            id: apId(),
            created: dayjs().toISOString(),
            updated: dayjs().toISOString(),
        }
        await databaseConnection().getRepository('rbac').save(rbacRole)
    }
})

afterAll(async () => {
    await databaseConnection().destroy()
    await app?.close()
})

describe('Project Worker API', () => {
    describe('Get worker project endpoint', () => {
        it('Returns worker project', async () => {
            // arrange
            const mockUser = createMockUser()
            await databaseConnection().getRepository('user').save([mockUser])

            const mockPlatform = createMockPlatform({
                ownerId: mockUser.id,
            })
            await databaseConnection().getRepository('platform').save([mockPlatform])

            const mockProject = createMockProject({ ownerId: mockUser.id, platformId: mockPlatform.id })
            await databaseConnection().getRepository('project').save([mockProject])

            const mockToken = await generateMockToken({
                type: PrincipalType.ENGINE,
                projectId: mockProject.id,
            })

            // act
            const response = await app?.inject({
                method: 'GET',
                url: '/v1/worker/project',
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)
            const responseBody = response?.json()
            expect(responseBody?.id).toBe(mockProject.id)
        })
    })
})
