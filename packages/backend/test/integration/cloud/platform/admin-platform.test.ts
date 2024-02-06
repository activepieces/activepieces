import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupApp } from '../../../../src/app/app'
import { createMockProject, createMockUser } from '../../../helpers/mocks'
import { StatusCodes } from 'http-status-codes'
import { FastifyInstance } from 'fastify'
import { faker } from '@faker-js/faker'
import { LocalesEnum, Project } from '@activepieces/shared'
import { Platform } from '@activepieces/shared'

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
        expect(Object.keys(responseBody)).toHaveLength(29)
        expect(responseBody.allowedAuthDomains).toEqual([])
        expect(responseBody.emailAuthEnabled).toBe(true)
        expect(responseBody.enforceAllowedAuthDomains).toBe(false)
        expect(responseBody.ssoEnabled).toBe(false)
        expect(responseBody.id).toHaveLength(21)
        expect(responseBody.federatedAuthProviders).toStrictEqual({})
        expect(responseBody.id).toHaveLength(21)
        expect(responseBody.gitSyncEnabled).toBe(false)
        expect(responseBody.created).toBeDefined()
        expect(responseBody.updated).toBeDefined()
        expect(responseBody.ownerId).toBe(mockUser.id)
        expect(responseBody.name).toBe(mockPlatformName)
        expect(responseBody.primaryColor).toBe('#6e41e2')
        expect(responseBody.logoIconUrl).toBe('https://cdn.activepieces.com/brand/logo.svg')
        expect(responseBody.fullLogoUrl).toBe('https://cdn.activepieces.com/brand/full-logo.png')
        expect(responseBody.favIconUrl).toBe('https://cdn.activepieces.com/brand/favicon.ico')
        expect(responseBody.filteredPieceNames).toStrictEqual([])
        expect(responseBody.filteredPieceBehavior).toBe('BLOCKED')
        expect(responseBody.smtpHost).toBeNull()
        expect(responseBody.smtpPort).toBeNull()
        expect(responseBody.smtpUser).toBeNull()
        expect(responseBody.smtpPassword).toBeNull()
        expect(responseBody.smtpSenderEmail).toBeNull()
        expect(responseBody.smtpUseSSL).toBeNull()
        expect(responseBody.privacyPolicyUrl).toBeNull()
        expect(responseBody.termsOfServiceUrl).toBeNull()
        expect(responseBody.cloudAuthEnabled).toBe(true)
        expect(responseBody.embeddingEnabled).toBe(false)
        expect(responseBody.showPoweredBy).toBe(false)
        expect(responseBody.privacyPolicyUrl).toBeNull()
        expect(responseBody.termsOfServiceUrl).toBeNull()
        expect(responseBody.defaultLocale).toBe(LocalesEnum.ENGLISH)
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

    it('adds owner to newly created platform', async () => {
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
        expect(response?.statusCode).toBe(StatusCodes.CREATED)
        const responseBody = response?.json()
        const newlyCreatedPlatformId = responseBody.id

        const user = await databaseConnection.getRepository('user').findOneByOrFail({ id: mockUser.id })
        expect(user.platformId).toBe(newlyCreatedPlatformId)
    })
})
