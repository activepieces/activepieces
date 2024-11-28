
import {
    PlatformRole,
    PrincipalType,
    UserStatus,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupServer } from '../../../../src/app/server'
import { generateMockToken } from '../../../helpers/auth'
import {
    createMockOtp,
    createMockUser,
    mockBasicSetup,
    setupMockApiKeyServiceAccount,
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

describe('Enterprise User API', () => {
    describe('List users endpoint', () => {

        it('Allows service accounts', async () => {
            // arrange
            const { mockOwner, mockPlatform, mockApiKey } =
                setupMockApiKeyServiceAccount()

            await databaseConnection().getRepository('user').save([mockOwner])
            await databaseConnection().getRepository('platform').save([mockPlatform])
            await databaseConnection().getRepository('api_key').save([mockApiKey])

            // act
            const response = await app?.inject({
                method: 'GET',
                url: '/v1/users',
                query: {
                    platformId: mockPlatform.id,
                },
                headers: {
                    authorization: `Bearer ${mockApiKey.value}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)
            const responseBody = response?.json()

            expect(Object.keys(responseBody)).toHaveLength(3)
            expect(responseBody.data).toHaveLength(1)
            expect(responseBody.data[0].id).toBe(mockOwner.id)
        })

    })

    describe('Update user endpoint', () => {

        it('Failed if own other platform', async () => {
            // arrange
            const { mockOwner, mockPlatform } = setupMockApiKeyServiceAccount()
            const { mockOwner: mockOwner2, mockPlatform: mockPlatform2 } = setupMockApiKeyServiceAccount()
            const mockUser = createMockUser({
                platformId: mockPlatform.id,
                status: UserStatus.ACTIVE,
                platformRole: PlatformRole.MEMBER,
            })


            await databaseConnection().getRepository('user').save([mockOwner, mockOwner2, mockUser])
            await databaseConnection().getRepository('platform').save([mockPlatform, mockPlatform2])

            const mockUserToken = await generateMockToken({
                id: mockOwner2.id,
                type: PrincipalType.USER,
                platform: {
                    id: mockPlatform2.id,
                },
            })

            const response = await app?.inject({
                method: 'POST',
                url: `/v1/users/${mockUser.id}`,
                headers: {
                    authorization: `Bearer ${mockUserToken}`,
                },
                body: {
                    status: UserStatus.INACTIVE,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.NOT_FOUND)
        })

        it('Fail if not admin', async () => {
            // arrange
            const { mockOwner, mockPlatform } = setupMockApiKeyServiceAccount()

            const mockUser = createMockUser({
                platformId: mockPlatform.id,
                status: UserStatus.ACTIVE,
                platformRole: PlatformRole.MEMBER,
            })

            await databaseConnection()
                .getRepository('user')
                .save([mockOwner, mockUser])
            await databaseConnection().getRepository('platform').save([mockPlatform])

            const mockUserToken = await generateMockToken({
                id: mockUser.id,
                type: PrincipalType.USER,
                platform: {
                    id: mockPlatform.id,
                },
            })
            // act
            const response = await app?.inject({
                method: 'POST',
                url: `/v1/users/${mockUser.id}`,
                headers: {
                    authorization: `Bearer ${mockUserToken}`,
                },
                body: {
                    status: UserStatus.INACTIVE,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('Allows service accounts to activate', async () => {
            // arrange
            const { mockOwner, mockPlatform, mockApiKey } =
                setupMockApiKeyServiceAccount()

            const mockUser = createMockUser({
                platformId: mockPlatform.id,
                status: UserStatus.INACTIVE,
            })

            await databaseConnection()
                .getRepository('user')
                .save([mockOwner, mockUser])
            await databaseConnection().getRepository('platform').save([mockPlatform])
            await databaseConnection().getRepository('api_key').save([mockApiKey])

            // act
            const response = await app?.inject({
                method: 'POST',
                url: `/v1/users/${mockUser.id}`,
                headers: {
                    authorization: `Bearer ${mockApiKey.value}`,
                },
                body: {
                    status: UserStatus.ACTIVE,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)

            const responseJson = response?.json()
            expect(responseJson.id).toBe(mockUser.id)
            expect(responseJson.password).toBeUndefined()
            expect(responseJson.status).toBe(UserStatus.ACTIVE)
        })


    })

    describe('Delete user endpoint', () => {

        it('Removes OTP for deleted user', async () => {
            // arrange
            const { mockOwner, mockPlatform } = await mockBasicSetup()

            const mockEditor = createMockUser({ platformId: mockPlatform.id })
            await databaseConnection().getRepository('user').save([mockEditor])

            const mockOtp = createMockOtp({ userId: mockEditor.id })
            await databaseConnection().getRepository('otp').save(mockOtp)

            const mockOwnerToken = await generateMockToken({
                id: mockOwner.id,
                type: PrincipalType.USER,
                platform: {
                    id: mockPlatform.id,
                },
            })

            // act
            await app?.inject({
                method: 'DELETE',
                url: `/v1/users/${mockEditor.id}`,
                headers: {
                    authorization: `Bearer ${mockOwnerToken}`,
                },
            })

            // assert
            const otp = await databaseConnection().getRepository('otp').findOneBy({ id: mockOtp.id })
            expect(otp).toBe(null)
        })

   

    })
})
