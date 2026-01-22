import { apId, FilteredPieceBehavior,
    PlanName,
    PlatformRole,
    PrincipalType,
    UpdatePlatformRequestBody,
} from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupServer } from '../../../../src/app/server'
import { generateMockToken } from '../../../helpers/auth'
import { checkIfSolutionExistsInDb, createMockSolutionAndSave, createMockUser, mockAndSaveBasicSetup, mockBasicUser } from '../../../helpers/mocks'

let app: FastifyInstance | null = null

beforeAll(async () => {

    await initializeDatabase({ runMigrations: false })
    app = await setupServer()
})

afterAll(async () => {
    await databaseConnection().destroy()
    await app?.close()
})

describe('Platform API', () => {
    describe('update platform endpoint', () => {
        it('patches a platform by id', async () => {
            // arrange
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup({
                plan: {
                    embeddingEnabled: false,
                },
                platform: {
                },
            })
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                
                platform: { id: mockPlatform.id },
            })
            const requestBody: UpdatePlatformRequestBody = {
                name: 'updated name',
                primaryColor: 'updated primary color',
                filteredPieceNames: ['updated filtered piece names'],
                filteredPieceBehavior: FilteredPieceBehavior.ALLOWED,
                enforceAllowedAuthDomains: true,
                allowedAuthDomains: ['yahoo.com'],
                cloudAuthEnabled: false,
                emailAuthEnabled: false,
            }
            // act
            const response = await app?.inject({
                method: 'POST',
                url: `/v1/platforms/${mockPlatform.id}`,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
                body: requestBody,
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody.id).toBe(mockPlatform.id)
            expect(responseBody.created).toBeDefined()
            expect(responseBody.updated).toBeDefined()
            expect(responseBody.enforceAllowedAuthDomains).toBe(
                requestBody.enforceAllowedAuthDomains,
            )
            expect(responseBody.allowedAuthDomains).toEqual(
                requestBody.allowedAuthDomains,
            )
            expect(responseBody.ownerId).toBe(mockOwner.id)
            expect(responseBody.emailAuthEnabled).toBe(requestBody.emailAuthEnabled)
            expect(responseBody.name).toBe('updated name')
            expect(responseBody.primaryColor).toBe('updated primary color')
            expect(responseBody.filteredPieceNames).toStrictEqual([
                'updated filtered piece names',
            ])
            expect(responseBody.filteredPieceBehavior).toBe('ALLOWED')
            expect(responseBody.emailAuthEnabled).toBe(false)
            expect(responseBody.federatedAuthProviders).toStrictEqual({})
            expect(responseBody.cloudAuthEnabled).toBe(false)
        }),

        it('updates the platform logo icons', async () => {
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup({
                plan: {
                    embeddingEnabled: false,
                },
                platform: {
                },
            })
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                
                platform: { id: mockPlatform.id },
            })
            const formData = new FormData()
            formData.append('logoIcon', new Blob([faker.image.urlPlaceholder()], { type: 'image/png' }))
            formData.append('fullLogo', new Blob([faker.image.urlPlaceholder()], { type: 'image/png' }))
            formData.append('favIcon', new Blob([faker.image.urlPlaceholder()], { type: 'image/png' }))
            formData.append('name', 'updated name')
            // act
            const response = await app?.inject({
                method: 'POST',
                url: `/v1/platforms/${mockPlatform.id}`,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
                body: formData,
            })

            // assert
            const responseBody = response?.json()

            expect(response?.statusCode).toBe(StatusCodes.OK)
            expect(responseBody.id).toBe(mockPlatform.id)
            expect(responseBody.created).toBeDefined()
            expect(responseBody.updated).toBeDefined()
            expect(responseBody.name).toBe('updated name')

            const baseUrl = 'http://localhost:4200/api/v1/platforms/assets'
            expect(responseBody.logoIconUrl.startsWith(baseUrl)).toBeTruthy()
            expect(responseBody.fullLogoUrl.startsWith(baseUrl)).toBeTruthy()
            expect(responseBody.favIconUrl.startsWith(baseUrl)).toBeTruthy()
        }),

        it('fails if user is not owner', async () => {
            // arrange
            const { mockPlatform } = await mockAndSaveBasicSetup()

            const { mockUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })

            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockUser.id,
                
                platform: { id: mockPlatform.id },
            })

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

    })

    describe('get platform endpoint', () => {
        it('Always Returns non-sensitive information for platform', async () => {
            // arrange
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup({
                platform: {
                    federatedAuthProviders: {
                        google: {
                            clientId: faker.internet.password(),
                            clientSecret: faker.internet.password(),
                        },
                        saml: {
                            idpCertificate: faker.internet.password(),
                            idpMetadata: faker.internet.password(),
                        },
                    },
                },
            })

            const mockToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                
                platform: {
                    id: mockPlatform.id,
                },
            })

            // act
            const response = await app?.inject({
                method: 'GET',
                url: `/v1/platforms/${mockPlatform.id}`,
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
            })

            const responseBody = response?.json()

            // assert
            expect(response?.statusCode).toBe(StatusCodes.OK)

            expect(Object.keys(responseBody).length).toBe(19)
            expect(responseBody.id).toBe(mockPlatform.id)
            expect(responseBody.ownerId).toBe(mockOwner.id)
            expect(responseBody.name).toBe(mockPlatform.name)
            expect(responseBody.federatedAuthProviders.google).toStrictEqual({
                clientId: mockPlatform.federatedAuthProviders?.google?.clientId,
            })
            expect(responseBody.federatedAuthProviders.saml).toStrictEqual({})
            expect(responseBody.primaryColor).toBe(mockPlatform.primaryColor)
            expect(responseBody.logoIconUrl).toBe(mockPlatform.logoIconUrl)
            expect(responseBody.fullLogoUrl).toBe(mockPlatform.fullLogoUrl)
            expect(responseBody.favIconUrl).toBe(mockPlatform.favIconUrl)
        })


        it('Fails if user is not a platform member', async () => {
            const { mockOwner: mockOwner1, mockPlatform: mockPlatform1 } = await mockAndSaveBasicSetup()
            const { mockPlatform: mockPlatform2 } = await mockAndSaveBasicSetup()

            const mockToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner1.id,
                platform: {
                    id: mockPlatform1.id,
                },
            })

            // act
            const response = await app?.inject({
                method: 'GET',
                url: `/v1/platforms/${mockPlatform2.id}`,
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    }),
    describe('delete platform endpoint', () => {
        it('deletes a platform by id', async () => {
            // arrange
            const firstAccount = await mockAndSaveBasicSetup( {
                plan: {
                    plan: PlanName.STANDARD,
                },
            })
            const secondAccount = await mockAndSaveBasicSetup(
                {
                    plan: {
                        plan: PlanName.STANDARD,
                    },
                },
            )
          
            const ownerSolution = await createMockSolutionAndSave({ projectId: firstAccount.mockProject.id, platformId: firstAccount.mockPlatform.id, userId: firstAccount.mockOwner.id })
          
            const secondSolution = await createMockSolutionAndSave({ projectId: secondAccount.mockProject.id, platformId: secondAccount.mockPlatform.id, userId: secondAccount.mockOwner.id })
          
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: firstAccount.mockOwner.id,
                platform: { id: firstAccount.mockPlatform.id },
            })
            // act
            const response = await app?.inject({
                method: 'DELETE',
                url: `/v1/platforms/${firstAccount.mockPlatform.id}`,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
            const secondSolutionExists = await checkIfSolutionExistsInDb(secondSolution)
            expect(secondSolutionExists).toBe(true)
            const ownerSolutionExists = await checkIfSolutionExistsInDb(ownerSolution)
            expect(ownerSolutionExists).toBe(false)
        }),
        it('fails if platform is not eligible for deletion', async () => {
            // arrange
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup( {
                plan: {
                    plan: PlanName.ENTERPRISE,
                },
            })
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                
                platform: { id: mockPlatform.id },
            })
            // act
            const response = await app?.inject({
                method: 'DELETE',
                url: `/v1/platforms/${mockPlatform.id}`,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY)
        }),
        it('fails if user is not owner', async () => {
            // arrange
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup( {
                plan: {
                    plan: PlanName.STANDARD,
                },
            })
            const secondAccount = await mockAndSaveBasicSetup(
                {
                    plan: {
                        plan: PlanName.STANDARD,
                    },
                },
            )
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                
                platform: { id: mockPlatform.id },
            })

            // act
            const response = await app?.inject({
                method: 'DELETE',
                url: `/v1/platforms/${secondAccount.mockPlatform.id}`,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })

            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        }),
        it('doesn\'t delete user identity if it has other users', async () => {
            // arrange
            const firstAccount = await mockAndSaveBasicSetup( {
                plan: {
                    plan: PlanName.STANDARD,
                },
            })
            const secondPlatform = await mockAndSaveBasicSetup( {
                plan: {
                    plan: PlanName.STANDARD,
                },
            })
            const secondUser = createMockUser({
                platformId: secondPlatform.mockPlatform.id,
                platformRole: PlatformRole.ADMIN,
                identityId: firstAccount.mockUserIdentity.id,
            })
            await databaseConnection().getRepository('user').save(secondUser)
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: firstAccount.mockOwner.id,
                platform: { id: firstAccount.mockPlatform.id },
            })
            // act
            const response = await app?.inject({
                method: 'DELETE',
                url: `/v1/platforms/${firstAccount.mockPlatform.id}`,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })
            // assert
            expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
            const userIdentityExists = await databaseConnection().getRepository('user_identity').findOneBy({ id: firstAccount.mockUserIdentity.id })
            expect(userIdentityExists).not.toBeNull()
        })
    })
    describe('get platform endpoint', () => {
        it('fails if user is not part of the platform', async () => {
            // arrange
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup()
            const testToken = await generateMockToken({
                type: PrincipalType.USER,
                id: mockOwner.id,
                
                platform: { id: mockPlatform.id },
            })
            // act
            const response = await app?.inject({
                method: 'GET',
                url: `/v1/platforms/${apId()}`,
                headers: {
                    authorization: `Bearer ${testToken}`,
                },
            })
            // assert
            expect(response?.statusCode).toBe(StatusCodes.FORBIDDEN)
        })
    }),
    it('succeeds if user is part of the platform and is not admin', async () => {
        // arrange
        const { mockPlatform } = await mockAndSaveBasicSetup()
        const { mockUser } = await mockBasicUser({
            user: {
                platformId: mockPlatform.id,
                platformRole: PlatformRole.MEMBER,
            },
        })
        await databaseConnection().getRepository('user').save(mockUser)
        const testToken = await generateMockToken({
            type: PrincipalType.USER,
            id: mockUser.id,
            
            platform: { id: mockPlatform.id },
        })
        // act
        const response = await app?.inject({
            method: 'GET',
            url: `/v1/platforms/${mockPlatform.id}`,
            headers: {
                authorization: `Bearer ${testToken}`,
            },
        })
        // assert
        expect(response?.statusCode).toBe(StatusCodes.OK)
    })
})