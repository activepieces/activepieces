import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupApp } from '../../../../src/app/app'
import { createMockUser, createMockPlatform, createMockSigningKey } from '../../../helpers/mocks'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { generateMockExternalToken } from '../../../helpers/auth'
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

describe('Managed Authentication API', () => {
    describe('External token endpoint', () => {
        it('Creates new user', async () => {
            // arrange
            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const mockSigningKey = createMockSigningKey({
                platformId: mockPlatform.id,
                generatedBy: mockUser.id,
            })
            await databaseConnection.getRepository('signing_key').save(mockSigningKey)

            const { mockExternalToken, mockExternalTokenPayload } = generateMockExternalToken({
                platformId: mockPlatform.id,
                signingKeyId: mockSigningKey.id,
            })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/managed-authn/external-token',
                body: {
                    externalAccessToken: mockExternalToken,
                },
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody?.id).toHaveLength(21)
            expect(responseBody?.email).toBe(mockExternalTokenPayload.email)
            expect(responseBody?.firstName).toBe(mockExternalTokenPayload.firstName)
            expect(responseBody?.lastName).toBe(mockExternalTokenPayload.lastName)
            expect(responseBody?.trackEvents).toBe(true)
            expect(responseBody?.newsLetter).toBe(true)
            expect(responseBody?.password).toBeUndefined()
            expect(responseBody?.status).toBe('EXTERNAL')
            expect(responseBody?.externalId).toBe(`${mockPlatform.id}_${mockExternalTokenPayload.externalUserId}`)
            expect(responseBody?.projectId).toHaveLength(21)
            expect(responseBody?.token).toBeDefined()
        })

        it('Creates new project', async () => {
            // arrange
            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const mockSigningKey = createMockSigningKey({
                platformId: mockPlatform.id,
                generatedBy: mockUser.id,
            })
            await databaseConnection.getRepository('signing_key').save(mockSigningKey)

            const { mockExternalToken, mockExternalTokenPayload } = generateMockExternalToken({
                platformId: mockPlatform.id,
                signingKeyId: mockSigningKey.id,
            })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/managed-authn/external-token',
                body: {
                    externalAccessToken: mockExternalToken,
                },
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.OK)

            const generatedProject = await databaseConnection.getRepository('project').findOneBy({
                id: responseBody?.projectId,
            })

            expect(generatedProject?.displayName).toBe(mockExternalTokenPayload.externalProjectId)
            expect(generatedProject?.ownerId).toBe(mockPlatform.ownerId)
            expect(generatedProject?.type).toBe('PLATFORM_MANAGED')
            expect(generatedProject?.platformId).toBe(mockPlatform.id)
            expect(generatedProject?.externalId).toBe(mockExternalTokenPayload.externalProjectId)
        })

        it('Adds new user as a member in new project', async () => {
            // arrange
            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const mockSigningKey = createMockSigningKey({
                platformId: mockPlatform.id,
                generatedBy: mockUser.id,
            })
            await databaseConnection.getRepository('signing_key').save(mockSigningKey)

            const { mockExternalToken } = generateMockExternalToken({
                platformId: mockPlatform.id,
                signingKeyId: mockSigningKey.id,
            })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/managed-authn/external-token',
                body: {
                    externalAccessToken: mockExternalToken,
                },
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.OK)

            const generatedProjectMember = await databaseConnection.getRepository('project_member').findOneBy({
                userId: responseBody?.id,
                projectId: responseBody?.projectId,
            })

            expect(generatedProjectMember?.projectId).toBe(responseBody?.projectId)
            expect(generatedProjectMember?.userId).toBe(responseBody?.id)
            expect(generatedProjectMember?.role).toBe('EDITOR')
            expect(generatedProjectMember?.status).toBe('ACTIVE')
        })

        it('Fails if signing key is not found', async () => {
            // arrange
            const mockUser = createMockUser()
            await databaseConnection.getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection.getRepository('platform').save(mockPlatform)

            const nonExistentSigningKeyId = apId()

            const { mockExternalToken } = generateMockExternalToken({
                platformId: mockPlatform.id,
                signingKeyId: nonExistentSigningKeyId,
            })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/managed-authn/external-token',
                body: {
                    externalAccessToken: mockExternalToken,
                },
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.UNAUTHORIZED)
            expect(responseBody?.params?.message).toBe(`signing key not found signingKeyId=${nonExistentSigningKeyId} platformId=${mockPlatform.id}`)
        })

        it('Fails if signing key\'s platformId doesn\'t match platformId in external token payload', async () => {
            // arrange
            const mockUserOne = createMockUser()
            const mockUserTwo = createMockUser()
            await databaseConnection.getRepository('user').save([mockUserOne, mockUserTwo])

            const mockPlatformOne = createMockPlatform({ ownerId: mockUserOne.id })
            const mockPlatformTwo = createMockPlatform({ ownerId: mockUserTwo.id })
            await databaseConnection.getRepository('platform').save([mockPlatformOne, mockPlatformTwo])

            const mockSigningKey = createMockSigningKey({
                platformId: mockPlatformOne.id,
                generatedBy: mockUserOne.id,
            })
            await databaseConnection.getRepository('signing_key').save(mockSigningKey)

            const { mockExternalToken } = generateMockExternalToken({
                platformId: mockPlatformTwo.id,
                signingKeyId: mockSigningKey.id,
            })

            // act
            const response = await app?.inject({
                method: 'POST',
                url: '/v1/managed-authn/external-token',
                body: {
                    externalAccessToken: mockExternalToken,
                },
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.UNAUTHORIZED)
            expect(responseBody?.params?.message).toBe(`signing key not found signingKeyId=${mockSigningKey.id} platformId=${mockPlatformTwo.id}`)
        })
    })
})
