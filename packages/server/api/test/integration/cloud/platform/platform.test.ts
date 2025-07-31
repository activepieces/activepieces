import {
    CopilotProviderType,
    FilteredPieceBehavior,
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
import { mockAndSaveBasicSetup, mockBasicUser } from '../../../helpers/mocks'

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
                logoIconUrl: 'updated logo icon url',
                fullLogoUrl: 'updated full logo url',
                favIconUrl: 'updated fav icon url',
                filteredPieceNames: ['updated filtered piece names'],
                filteredPieceBehavior: FilteredPieceBehavior.ALLOWED,
                smtp: {
                    host: 'updated smtp host',
                    port: 123,
                    user: 'updated smtp user',
                    password: 'updated smtp password',
                    senderName: 'updated smtp sender name',
                    senderEmail: 'updated smtp sender email',
                },
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
            expect(responseBody.logoIconUrl).toBe('updated logo icon url')
            expect(responseBody.fullLogoUrl).toBe('updated full logo url')
            expect(responseBody.favIconUrl).toBe('updated fav icon url')
            expect(responseBody.filteredPieceNames).toStrictEqual([
                'updated filtered piece names',
            ])
            expect(responseBody.filteredPieceBehavior).toBe('ALLOWED')
            expect(responseBody.emailAuthEnabled).toBe(false)
            expect(responseBody.federatedAuthProviders).toStrictEqual({})
            expect(responseBody.cloudAuthEnabled).toBe(false)
        })

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
                    smtp: {
                        host: faker.internet.password(),
                        port: 123,
                        user: faker.internet.password(),
                        password: faker.internet.password(),
                        senderEmail: faker.internet.password(),
                        senderName: faker.internet.password(),
                    },
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
                    copilotSettings: {
                        providers: {
                            [CopilotProviderType.OPENAI]: {
                                baseUrl: faker.internet.password(),
                                apiKey: faker.internet.password(),
                            },
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

            expect(Object.keys(responseBody).length).toBe(20)
            expect(responseBody.id).toBe(mockPlatform.id)
            expect(responseBody.ownerId).toBe(mockOwner.id)
            expect(responseBody.name).toBe(mockPlatform.name)
            expect(responseBody.smtp).toStrictEqual({})
            expect(responseBody.federatedAuthProviders.google).toStrictEqual({
                clientId: mockPlatform.federatedAuthProviders?.google?.clientId,
            })
            expect(responseBody.copilotSettings.providers.openai).toStrictEqual({})
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
                platform: {
                    id: mockPlatform1.id,
                },
                id: mockOwner1.id,
            })

            // act
            const response = await app?.inject({
                method: 'GET',
                url: `/v1/platforms/${mockPlatform2.id}`,
                headers: {
                    authorization: `Bearer ${mockToken}`,
                },
            })

            expect(response?.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR)
            const responseBody = response?.json()

            expect(responseBody?.message).toBe(
                'userPlatformId and paramId should be equal',
            )
        })
    })
})
