import { PlatformRole, PrincipalType } from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupServer } from '../../../../src/app/server'
import { generateMockToken } from '../../../helpers/auth'
import {
    createMockSigningKey,
    mockAndSaveBasicSetup,
    mockBasicUser,
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

const setupEnabledPlatform = () => mockAndSaveBasicSetup({ plan: { embeddingEnabled: true } })

describe('Signing Key API', () => {
    describe('Add Signing Key API', () => {
        it('Creates new Signing Key', async () => {
            // arrange
            const { mockOwner, mockPlatform } = await setupEnabledPlatform()

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
            const { mockPlatform } = await setupEnabledPlatform()
            const { mockUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })

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
            const { mockOwner, mockPlatform } = await setupEnabledPlatform()
            
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
            const { mockPlatform: mockPlatformOne } = await setupEnabledPlatform()

            const { mockUser: nonOwnerUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatformOne.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })

            const mockSigningKey = createMockSigningKey({
                platformId: mockPlatformOne.id,
            })

            await databaseConnection()
                .getRepository('signing_key')
                .save(mockSigningKey)

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: nonOwnerUser.id,
                platform: { id: mockPlatformOne.id },
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
            const { mockPlatform: mockPlatformTwo } = await setupEnabledPlatform()
            const { mockOwner: mockUserOne, mockPlatform: mockPlatformOne } = await setupEnabledPlatform()

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
