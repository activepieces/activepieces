import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupApp } from '../../../../src/app/app'
import { createMockProject, createMockUser } from '../../../helpers/mocks'
import { StatusCodes } from 'http-status-codes'
import { FastifyInstance } from 'fastify'
import { faker } from '@faker-js/faker'
import { Project } from '@activepieces/shared'
import { Platform } from '@activepieces/ee-shared'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await databaseConnection.initialize()
    app = await setupApp()
})

afterAll(async () => {
    await databaseConnection.destroy()
    await app?.close()
})

describe('admin add platform endpoint', () => {
    it('creates a new platform', async () => {
        // arrange
        const mockUser = createMockUser()
        await databaseConnection.getRepository('user').save(mockUser)

        const mockProject = createMockProject({ ownerId: mockUser.id })
        await databaseConnection.getRepository('project').save(mockProject)

        const mockPlatformName = faker.lorem.word()

        // act
        const response = await app?.inject({
            method: 'POST',
            url: '/v1/admin/platforms',
            headers: {
                'api-key': 'api-key',
            },
            body: {
                userId: mockUser.id,
                projectId: mockProject.id,
                name: mockPlatformName,
            },
        })

        // assert
        const responseBody = response?.json()

        expect(response?.statusCode).toBe(StatusCodes.CREATED)
        expect(responseBody.id).toHaveLength(21)
        expect(responseBody.ownerId).toBe(mockUser.id)
        expect(responseBody.name).toBe(mockPlatformName)
        expect(responseBody.primaryColor).toBe('#6e41e2')
        expect(responseBody.logoIconUrl).toBe('https://cdn.activepieces.com/brand/logo.svg')
        expect(responseBody.fullLogoUrl).toBe('https://cdn.activepieces.com/brand/full-logo.svg')
        expect(responseBody.favIconUrl).toBe('https://cdn.activepieces.com/brand/favicon.ico')
    })

    it('updates project to be platform-managed', async () => {
        // arrange
        const mockUser = createMockUser()
        await databaseConnection.getRepository('user').save(mockUser)

        const mockProject = createMockProject({ ownerId: mockUser.id })
        await databaseConnection.getRepository('project').save(mockProject)

        const mockPlatformName = faker.lorem.word()

        // act
        const addPlatformResponse = await app?.inject({
            method: 'POST',
            url: '/v1/admin/platforms',
            headers: {
                'api-key': 'api-key',
            },
            body: {
                userId: mockUser.id,
                projectId: mockProject.id,
                name: mockPlatformName,
            },
        })

        const updatedMockProject = await databaseConnection.getRepository<Project>('project').findOneBy({
            id: mockProject.id,
        })

        // assert
        const mockPlatform = addPlatformResponse?.json<Platform>()

        expect(addPlatformResponse?.statusCode).toBe(StatusCodes.CREATED)
        expect(mockPlatform).toBeDefined()
        expect(mockPlatform?.id).toHaveLength(21)

        expect(updatedMockProject).not.toBeNull()
        expect(updatedMockProject?.type).toBe('PLATFORM_MANAGED')
        expect(updatedMockProject?.platformId).toBe(mockPlatform?.id)
    })
})
