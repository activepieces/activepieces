import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { setupApp } from '../../../../src/app/app'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { generateMockToken } from '../../../helpers/auth'
import {
    createMockOtp,
    createMockProjectMember,
    createMockUser,
    mockBasicSetup,
    setupMockApiKeyServiceAccount,
} from '../../../helpers/mocks'
import {
    PlatformRole,
    PrincipalType,
    UserStatus,
} from '@activepieces/shared'

let app: FastifyInstance | null = null

beforeAll(async () => {
    await databaseConnection.initialize()
    app = await setupApp()
})

afterAll(async () => {
    await databaseConnection.destroy()
    await app?.close()
})

describe('Enterprise User API', () => {
    describe('List users endpoint', () => {

        it('Allows service accounts', async () => {
            // arrange
            const { mockOwner, mockPlatform, mockApiKey } =
                setupMockApiKeyServiceAccount()

            await databaseConnection.getRepository('user').save([mockOwner])
            await databaseConnection.getRepository('platform').save([mockPlatform])
            await databaseConnection.getRepository('api_key').save([mockApiKey])

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

        it('Fail if not admin', async () => {
            // arrange
            const { mockOwner, mockPlatform } = setupMockApiKeyServiceAccount()

            const mockUser = createMockUser({
                platformId: mockPlatform.id,
                status: UserStatus.ACTIVE,
                platformRole: PlatformRole.MEMBER,
            })

            await databaseConnection
                .getRepository('user')
                .save([mockOwner, mockUser])
            await databaseConnection.getRepository('platform').save([mockPlatform])

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

            await databaseConnection
                .getRepository('user')
                .save([mockOwner, mockUser])
            await databaseConnection.getRepository('platform').save([mockPlatform])
            await databaseConnection.getRepository('api_key').save([mockApiKey])

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
            await databaseConnection.getRepository('user').save([mockEditor])

            const mockOtp = createMockOtp({ userId: mockEditor.id })
            await databaseConnection.getRepository('otp').save(mockOtp)

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
            const otp = await databaseConnection.getRepository('otp').findOneBy({ id: mockOtp.id })
            expect(otp).toBe(null)
        })

        it('Removes deleted user project memberships', async () => {
            // arrange
            const { mockOwner, mockPlatform, mockProject } = await mockBasicSetup()

            const mockUser = createMockUser({ platformId: mockPlatform.id })
            await databaseConnection.getRepository('user').save([mockUser])

            const mockProjectMember = createMockProjectMember({
                email: mockUser.email,
                platformId: mockPlatform.id,
                projectId: mockProject.id,
            })
            await databaseConnection.getRepository('project_member').save(mockProjectMember)

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
                url: `/v1/users/${mockUser.id}`,
                headers: {
                    authorization: `Bearer ${mockOwnerToken}`,
                },
            })

            // assert
            const deletedProjectMember = await databaseConnection.getRepository('project_member').findOneBy({ id: mockProjectMember.id })
            expect(deletedProjectMember).toBe(null)
        })


    })
})
