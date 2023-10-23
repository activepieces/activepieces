import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupApp } from '../../../../src/app/app'
import { generateTestToken } from '../../../helpers/auth'
import { createMockUser, createMockPlatform } from '../../../helpers/mocks'
import { StatusCodes } from 'http-status-codes'
import { FastifyInstance } from 'fastify'
import { apId } from '@activepieces/shared'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await databaseConnection.initialize()
    app = await setupApp()
})

afterAll(async () => {
    await databaseConnection.destroy()
})

describe('update platform endpoint', () => {
    it('patches a platform by id', async () => {
        // arrange
        const mockUser = createMockUser()
        await databaseConnection.getRepository('user').save(mockUser)

        const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
        await databaseConnection.getRepository('platform').save(mockPlatform)

        const testToken = await generateTestToken({ id: mockUser.id })

        // act
        const response = await app?.inject({
            method: 'POST',
            url: `/v1/platforms/${mockPlatform.id}`,
            headers: {
                authorization: `Bearer ${testToken}`,
            },
            body: {
                primaryColor: '#000000',
            },
        })

        // assert
        const responseBody = response?.json()

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(responseBody.id).toBe(mockPlatform.id)
        expect(responseBody.ownerId).toBe(mockUser.id)
        expect(responseBody.name).toBe(mockPlatform.name)
        expect(responseBody.primaryColor).toBe('#000000')
        expect(responseBody.logoIconUrl).toBe(mockPlatform.logoIconUrl)
        expect(responseBody.fullLogoUrl).toBe(mockPlatform.fullLogoUrl)
        expect(responseBody.favIconUrl).toBe(mockPlatform.favIconUrl)
    })

    it('fails if user is not owner', async () => {
        // arrange
        const mockUser = createMockUser()
        await databaseConnection.getRepository('user').save(mockUser)

        const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
        await databaseConnection.getRepository('platform').save(mockPlatform)

        const testToken = await generateTestToken({ id: 'random-user-id' })

        // act
        const response = await app?.inject({
            method: 'POST',
            url: `/v1/platforms/${mockPlatform.id}`,
            headers: {
                authorization: `Bearer ${testToken}`,
            },
            body: {
                primaryColor: '#000000',
            },
        })

        // assert
        expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
    })

    it('fails if platform doesn\'t exist', async () => {
        // arrange
        const randomPlatformId = apId()
        const testToken = await generateTestToken()

        // act
        const response = await app?.inject({
            method: 'POST',
            url: `/v1/platforms/${randomPlatformId}`,
            headers: {
                authorization: `Bearer ${testToken}`,
            },
            body: {
                primaryColor: '#000000',
            },
        })

        // assert
        expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
    })
})

describe('get platform endpoint', () => {
    it('finds a platform by id', async () => {
        // arrange
        const mockUser = createMockUser()
        await databaseConnection.getRepository('user').save(mockUser)

        const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
        await databaseConnection.getRepository('platform').save(mockPlatform)

        const testToken = await generateTestToken({ id: mockUser.id })

        // act
        const response = await app?.inject({
            method: 'GET',
            url: `/v1/platforms/${mockPlatform.id}`,
            headers: {
                authorization: `Bearer ${testToken}`,
            },
        })

        // assert
        const responseBody = response?.json()

        expect(response?.statusCode).toBe(StatusCodes.OK)
        expect(responseBody.id).toBe(mockPlatform.id)
        expect(responseBody.ownerId).toBe(mockUser.id)
        expect(responseBody.name).toBe(mockPlatform.name)
        expect(responseBody.primaryColor).toBe(mockPlatform.primaryColor)
        expect(responseBody.logoIconUrl).toBe(mockPlatform.logoIconUrl)
        expect(responseBody.fullLogoUrl).toBe(mockPlatform.fullLogoUrl)
        expect(responseBody.favIconUrl).toBe(mockPlatform.favIconUrl)
    })

    it('fails if platform doesn\'t exist', async () => {
        // arrange
        const randomPlatformId = apId()
        const testToken = await generateTestToken()

        // act
        const response = await app?.inject({
            method: 'GET',
            url: `/v1/platforms/${randomPlatformId}`,
            headers: {
                authorization: `Bearer ${testToken}`,
            },
        })

        // assert
        expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
    })
})
