import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupApp } from '../../../../src/app/app'
import { generateMockToken } from '../../../helpers/auth'
import { createMockUser, createMockPlatform, createMockTemplate, createMockProject } from '../../../helpers/mocks'
import { StatusCodes } from 'http-status-codes'
import { FastifyInstance } from 'fastify'
import { PlatformRole, PrincipalType, TemplateType } from '@activepieces/shared'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await databaseConnection.initialize()
    app = await setupApp()
})

afterAll(async () => {
    await databaseConnection.destroy()
    await app?.close()
})

describe('Flow Templates', () => {
    describe('List Flow Templates', () => {
        it('should list platform templates only', async () => {
            // arrange
            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const mockProject = createMockProject({ ownerId: mockUser.id, platformId: mockPlatform.id })
            await databaseConnection.getRepository('project').save(mockProject)

            const mockPlatformTemplate = createMockTemplate({ platformId: mockPlatform.id, projectId: mockProject.id, type: TemplateType.PLATFORM })
            await databaseConnection.getRepository('flow_template').save(mockPlatformTemplate)

            const mockProjectTemplate = createMockTemplate({ platformId: mockPlatform.id, projectId: mockProject.id, type: TemplateType.PROJECT })
            await databaseConnection.getRepository('flow_template').save(mockProjectTemplate)


            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUser.id,
                platform: { id: mockPlatform.id, role: PlatformRole.MEMBER },
            })

            const response = await app?.inject({
                method: 'GET',
                url: '/v1/flow-templates',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)
            const responseBody = response?.json()
            expect(responseBody.data).toHaveLength(1)
            expect(responseBody.data[0].id).toBe(mockPlatformTemplate.id)
        })

    })


})
