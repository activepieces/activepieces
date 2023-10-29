import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupApp } from '../../../../src/app/app'
import { generateTestToken } from '../../../helpers/auth'
import { createMockUser, createMockPlatform, createMockManagedAuthnKeyPair } from '../../../helpers/mocks'
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
    await app?.close()
})

describe('managed authn key pair API', () => {
    describe('add key pair endpoint', () => {
        it('creates new key pair', async () => {
            // arrange
            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const testToken = await generateTestToken({
                id: mockUser.id,
                platformId: mockPlatform.id,
            })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/managed-authn-key-pairs',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.CREATED)
            expect(responseBody.id).toHaveLength(21)
            expect(responseBody.platformId).toBe(mockPlatform.id)
            expect(responseBody.publicKey).toBeDefined()
            expect(responseBody.privateKey).toBeDefined()
            expect(responseBody.generatedBy).toBe(mockUser.id)
            expect(responseBody.algorithm).toBe('RSA')
        })

        it('fails if platformId is not provided in token', async () => {
            // arrange
            const testToken = await generateTestToken({
                platformId: undefined,
            })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/managed-authn-key-pairs',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR)
            expect(responseBody.message).toBe('platformId is null or undefined')
        })

        it('fails if platform is not found', async () => {
            // arrange
            const nonExistentPlatformId = apId()

            const testToken = await generateTestToken({
                platformId: nonExistentPlatformId,
            })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/managed-authn-key-pairs',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })

        it('fails if user is not platform owner', async () => {
            // arrange
            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const nonOwnerUserId = apId()
            const testToken = await generateTestToken({
                id: nonOwnerUserId,
                platformId: mockPlatform.id,
            })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/managed-authn-key-pairs',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })

    describe('get managed authn key pair endpoint', () => {
        it('finds a key pair by id', async () => {
            // arrange
            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const mockKeyPair = createMockManagedAuthnKeyPair({
                platformId: mockPlatform.id,
                generatedBy: mockUser.id,
            })

            await databaseConnection.getRepository('managed_authn_key_pair').save(mockKeyPair)
            const testToken = await generateTestToken()

            // act
            const response = await app?.inject({
                method: 'GET',
                url: `/v1/managed-authn-key-pairs/${mockKeyPair.id}`,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody.id).toBe(mockKeyPair.id)
            expect(responseBody.platformId).toBe(mockKeyPair.platformId)
            expect(responseBody.publicKey).toBe(mockKeyPair.publicKey)
            expect(responseBody.generatedBy).toBe(mockKeyPair.generatedBy)
            expect(responseBody.algorithm).toBe(mockKeyPair.algorithm)
        })
    })

    describe('list managed authn key pairs', () => {
        it('filters key pairs by platform', async () => {
            // arrange
            const mockUserOne = createMockUser()
            const mockUserTwo = createMockUser()
            await databaseConnection.getRepository('user').save([mockUserOne, mockUserTwo])

            const mockPlatformOne = createMockPlatform({ ownerId: mockUserOne.id })
            const mockPlatformTwo = createMockPlatform({ ownerId: mockUserTwo.id })
            await databaseConnection.getRepository('platform').save([mockPlatformOne, mockPlatformTwo])

            const mockKeyPairOne = createMockManagedAuthnKeyPair({
                platformId: mockPlatformOne.id,
                generatedBy: mockUserOne.id,
            })

            const mockKeyPairTwo = createMockManagedAuthnKeyPair({
                platformId: mockPlatformTwo.id,
                generatedBy: mockUserTwo.id,
            })

            await databaseConnection.getRepository('managed_authn_key_pair').save([mockKeyPairOne, mockKeyPairTwo])
            const testToken = await generateTestToken()

            // act
            const response = await app?.inject({
                method: 'GET',
                url: `/v1/managed-authn-key-pairs?platformId=${mockPlatformOne.id}`,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody.data).toHaveLength(1)
            expect(responseBody.data[0].id).toBe(mockKeyPairOne.id)
        })
    })
})
