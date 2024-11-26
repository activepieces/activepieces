import { PlatformRole, PrincipalType } from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupServer } from '../../../../src/app/server'
import { generateMockToken } from '../../../helpers/auth'
import {
    createMockPlatform,
    createMockSigningKey,
    createMockUser,
    mockBasicSetup,
} from '../../../helpers/mocks'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await initializeDatabase({ runMigrations: false })
    app = await setupServer()
})

afterAll(async () => {
    await databaseConnection().destroy()
    await app?.close()
})

describe('Signing Key API', () => {
    describe('Add Signing Key API', () => {
        it('Creates new Signing Key', async () => {
            // arrange
            const { mockPlatform, mockOwner } = await mockBasicSetup()

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            const mockSigningKeyName = faker.lorem.word()
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/signing-keys',
                body: {
                    displayName: mockSigningKeyName,
                },
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
            expect(responseBody.displayName).toBe(mockSigningKeyName)
            expect(responseBody.privateKey).toBeDefined()
            expect(responseBody.algorithm).toBe('RSA')
        }, 10000)

        it('Fails if user is not platform owner', async () => {
            // arrange
            const mockUser = createMockUser({
                platformRole: PlatformRole.MEMBER,
            })
            await databaseConnection().getRepository('user').save([mockUser])

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection().getRepository('platform').save([mockPlatform])

            const mockSigningKey = createMockSigningKey({
                platformId: mockPlatform.id,
            })

            await databaseConnection()
                .getRepository('signing_key')
                .save(mockSigningKey)

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUser.id,
                platform: { id: mockPlatform.id },
            })

            const mockSigningKeyName = faker.lorem.word()
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/signing-keys',
                body: {
                    displayName: mockSigningKeyName,
                },
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })

    describe('Get Signing Key endpoint', () => {
        it('Finds a Signing Key by id', async () => {
            // arrange
            const { mockPlatform, mockOwner } = await mockBasicSetup(

            )
            const mockSigningKey = createMockSigningKey({
                platformId: mockPlatform.id,
            })

            await databaseConnection()
                .getRepository('signing_key')
                .save(mockSigningKey)

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                platform: { id: mockPlatform.id },
            })

            // act
            const response = await app?.inject({
                method: 'GET',
                url: `/v1/signing-keys/${mockSigningKey.id}`,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody.id).toBe(mockSigningKey.id)
            expect(responseBody.platformId).toBe(mockSigningKey.platformId)
            expect(responseBody.publicKey).toBe(mockSigningKey.publicKey)
            expect(responseBody.algorithm).toBe(mockSigningKey.algorithm)
        })
    })

    describe('Delete Signing Key endpoint', () => {
        it('Fail if non owner', async () => {
            // arrange
            const mockUser = createMockUser()
            const mockUserTwo = createMockUser({
                platformRole: PlatformRole.ADMIN,
            })
            await databaseConnection()
                .getRepository('user')
                .save([mockUser, mockUserTwo])

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            const mockPlatformTwo = createMockPlatform({ ownerId: mockUserTwo.id })
            await databaseConnection()
                .getRepository('platform')
                .save([mockPlatform, mockPlatformTwo])

            const mockSigningKey = createMockSigningKey({
                platformId: mockPlatform.id,
            })

            await databaseConnection()
                .getRepository('signing_key')
                .save(mockSigningKey)

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUserTwo.id,
                platform: { id: mockPlatformTwo.id },
            })

            // act
            const response = await app?.inject({
                method: 'DELETE',
                url: `/v1/signing-keys/${mockSigningKey.id}`,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    })

    describe('List Signing Keys endpoint', () => {
        it('Filters Signing Keys by platform', async () => {
   
            const { mockPlatform: mockPlatformTwo } = await mockBasicSetup()
            const { mockOwner: mockUserOne, mockPlatform: mockPlatformOne } = await mockBasicSetup()


            const mockSigningKeyOne = createMockSigningKey({
                platformId: mockPlatformOne.id,
            })

            const mockSigningKeyTwo = createMockSigningKey({
                platformId: mockPlatformTwo.id,
            })

            await databaseConnection()
                .getRepository('signing_key')
                .save([mockSigningKeyOne, mockSigningKeyTwo])

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUserOne.id,
                platform: { id: mockPlatformOne.id },
            })
            // act
            const response = await app?.inject({
                method: 'GET',
                url: '/v1/signing-keys',
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody.data).toHaveLength(1)
            expect(responseBody.data[0].id).toBe(mockSigningKeyOne.id)
        })
    })
})
