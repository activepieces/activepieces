import { apId, DefaultProjectRole, PiecesFilterType, PieceType, ProjectRole } from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { stripeHelper } from '../../../../src/app/ee/billing/project-billing/stripe-helper'
import { setupServer } from '../../../../src/app/server'
import { generateMockExternalToken } from '../../../helpers/auth'
import {
    createMockPieceMetadata,
    createMockPieceTag,
    createMockPlatform,
    createMockProject,
    createMockSigningKey,
    createMockTag,
    createMockUser,
} from '../../../helpers/mocks'

let app: FastifyInstance | null = null

beforeAll(async () => { 
    await initializeDatabase({ runMigrations: false })
    app = await setupServer()
})

beforeEach(async () => {
    stripeHelper.getOrCreateCustomer = jest
        .fn()
        .mockResolvedValue(faker.string.alphanumeric())
})

afterAll(async () => {
    await databaseConnection().destroy()
    await app?.close()
})

describe('Managed Authentication API', () => {
    describe('External token endpoint', () => {
        it('Signs up new users', async () => {
            // arrange
            const mockUser = createMockUser()
            await databaseConnection().getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection().getRepository('platform').save(mockPlatform)

            const mockSigningKey = createMockSigningKey({
                platformId: mockPlatform.id,
            })
            await databaseConnection()
                .getRepository('signing_key')
                .save(mockSigningKey)

            const { mockExternalToken, mockExternalTokenPayload } =
                generateMockExternalToken({
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
            expect(responseBody?.email).toBe(mockExternalTokenPayload.email.toLocaleLowerCase().trim())
            expect(responseBody?.firstName).toBe(mockExternalTokenPayload.firstName)
            expect(responseBody?.lastName).toBe(mockExternalTokenPayload.lastName)
            expect(responseBody?.trackEvents).toBe(true)
            expect(responseBody?.newsLetter).toBe(false)
            expect(responseBody?.password).toBeUndefined()
            expect(responseBody?.status).toBe('ACTIVE')
            expect(responseBody?.verified).toBe(true)
            expect(responseBody?.externalId).toBe(
                mockExternalTokenPayload.externalUserId,
            )
            expect(responseBody?.platformId).toBe(mockPlatform.id)
            expect(responseBody?.projectId).toHaveLength(21)
            expect(responseBody?.token).toBeDefined()
        })

        it('Creates new project', async () => {
            // arrange
            const mockUser = createMockUser()
            await databaseConnection().getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection().getRepository('platform').save(mockPlatform)

            const mockSigningKey = createMockSigningKey({
                platformId: mockPlatform.id,
            })
            await databaseConnection()
                .getRepository('signing_key')
                .save(mockSigningKey)

            const { mockExternalToken, mockExternalTokenPayload } =
                generateMockExternalToken({
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

            const generatedProject = await databaseConnection()
                .getRepository('project')
                .findOneBy({
                    id: responseBody?.projectId,
                })

            expect(generatedProject?.displayName).toBe(
                mockExternalTokenPayload.externalProjectId,
            )
            expect(generatedProject?.ownerId).toBe(mockPlatform.ownerId)
            expect(generatedProject?.platformId).toBe(mockPlatform.id)
            expect(generatedProject?.externalId).toBe(
                mockExternalTokenPayload.externalProjectId,
            )
        })

        it('Sync Pieces when exchanging external token', async () => {
            // arrange
            const mockUser = createMockUser()
            await databaseConnection().getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection().getRepository('platform').save(mockPlatform)


            const mockPieceMetadata1 = createMockPieceMetadata({
                name: '@ap/a',
                version: '0.0.1',
                pieceType: PieceType.OFFICIAL,
            })
            await databaseConnection()
                .getRepository('piece_metadata')
                .save(mockPieceMetadata1)

            const mockTag = createMockTag({
                id: apId(),
                platformId: mockPlatform.id,
                name: 'free',
            })

            await databaseConnection()
                .getRepository('tag')
                .save(mockTag)


            const mockPieceTag = createMockPieceTag({
                platformId: mockPlatform.id,
                tagId: mockTag.id,
                pieceName: '@ap/a',
            })

            await databaseConnection()
                .getRepository('piece_tag')
                .save(mockPieceTag)


            const mockSigningKey = createMockSigningKey({
                platformId: mockPlatform.id,
            })
            await databaseConnection()
                .getRepository('signing_key')
                .save(mockSigningKey)



            const mockedEmail = faker.internet.email()
            const { mockExternalToken } = generateMockExternalToken({
                platformId: mockPlatform.id,
                externalEmail: mockedEmail,
                signingKeyId: mockSigningKey.id,
                pieces: {
                    filterType: PiecesFilterType.ALLOWED,
                    tags: ['free'],
                },
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

            const generatedProject = await databaseConnection()
                .getRepository('project_plan')
                .findOneBy({ projectId: responseBody?.projectId })

            expect(generatedProject?.piecesFilterType).toBe('ALLOWED')
            expect(generatedProject?.pieces).toStrictEqual(['@ap/a'])
        })

        it('Adds new user as a member in new project', async () => {
            // arrange
            const mockUser = createMockUser()
            await databaseConnection().getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection().getRepository('platform').save(mockPlatform)

            const mockSigningKey = createMockSigningKey({
                platformId: mockPlatform.id,
            })
            await databaseConnection()
                .getRepository('signing_key')
                .save(mockSigningKey)

            const mockedEmail = faker.internet.email()

            const projectRole = await databaseConnection().getRepository('project_role').findOneByOrFail({ name: DefaultProjectRole.VIEWER }) as ProjectRole

            const { mockExternalToken } = generateMockExternalToken({
                platformId: mockPlatform.id,
                externalEmail: mockedEmail,
                signingKeyId: mockSigningKey.id,
                projectRole: projectRole.name,
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

            const generatedProjectMember = await databaseConnection()
                .getRepository('project_member')
                .findOneBy({
                    projectId: responseBody?.projectId,
                    userId: responseBody?.id,
                })

            expect(generatedProjectMember?.projectId).toBe(responseBody?.projectId)
            expect(generatedProjectMember?.userId).toBe(responseBody?.id)
            expect(generatedProjectMember?.platformId).toBe(mockPlatform.id)
            expect(generatedProjectMember?.projectRoleId).toBe(projectRole.id)
        })

        it('Adds new user to existing project', async () => {
            // arrange
            const mockUser = createMockUser()
            await databaseConnection().getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection().getRepository('platform').save(mockPlatform)

            const mockSigningKey = createMockSigningKey({
                platformId: mockPlatform.id,
            })
            await databaseConnection()
                .getRepository('signing_key')
                .save(mockSigningKey)

            const mockExternalProjectId = apId()

            const mockProject = createMockProject({
                ownerId: mockUser.id,
                platformId: mockPlatform.id,
                externalId: mockExternalProjectId,
            })
            await databaseConnection().getRepository('project').save(mockProject)

            const { mockExternalToken } = generateMockExternalToken({
                platformId: mockPlatform.id,
                signingKeyId: mockSigningKey.id,
                externalProjectId: mockExternalProjectId,
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
            expect(responseBody?.projectId).toBe(mockProject.id)
        })

        it('Signs in existing users', async () => {
            // arrange
            const mockPlatformOwner = createMockUser()
            await databaseConnection().getRepository('user').save(mockPlatformOwner)

            const mockPlatform = createMockPlatform({
                ownerId: mockPlatformOwner.id,
            })
            await databaseConnection().getRepository('platform').save(mockPlatform)

            const mockSigningKey = createMockSigningKey({
                platformId: mockPlatform.id,
            })
            await databaseConnection()
                .getRepository('signing_key')
                .save(mockSigningKey)

            const { mockExternalToken, mockExternalTokenPayload } =
                generateMockExternalToken({
                    platformId: mockPlatform.id,
                    signingKeyId: mockSigningKey.id,
                })

            const mockUser = createMockUser({
                externalId: mockExternalTokenPayload.externalUserId,
                platformId: mockPlatform.id,
            })
            await databaseConnection().getRepository('user').save(mockUser)

            const mockProject = createMockProject({
                ownerId: mockPlatformOwner.id,
                platformId: mockPlatform.id,
                externalId: mockExternalTokenPayload.externalProjectId,
            })
            await databaseConnection().getRepository('project').save(mockProject)

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
            expect(responseBody?.projectId).toBe(mockProject.id)
            expect(responseBody?.id).toBe(mockUser.id)
        })

        it('Fails if signing key is not found', async () => {
            // arrange
            const mockUser = createMockUser()
            await databaseConnection().getRepository('user').save(mockUser)

            const mockPlatform = createMockPlatform({ ownerId: mockUser.id })
            await databaseConnection().getRepository('platform').save(mockPlatform)

            const nonExistentSigningKeyId = apId()

            const { mockExternalToken } = generateMockExternalToken({
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
            expect(responseBody?.params?.message).toBe(
                `signing key not found signingKeyId=${nonExistentSigningKeyId}`,
            )
        })
    })
})
