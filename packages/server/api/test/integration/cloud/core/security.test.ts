import {
    ActivepiecesError,
    ALL_PRINCIPAL_TYPES,
    apId,
    EndpointScope,
    ErrorCode,
    Principal,
    PrincipalType,
} from '@activepieces/shared'
import { FastifyInstance, FastifyRequest } from 'fastify'
import { nanoid } from 'nanoid'
import { securityHandlerChain } from '../../../../src/app/core/security/security-handler-chain'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupServer } from '../../../../src/app/server'
import { generateMockToken } from '../../../helpers/auth'
import {
    createMockFlow,
    createMockPlatformWithOwner,
    createMockProject,
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

describe('API Security', () => {
    describe('Webhook Authentication', () => {
        it('Skips principal authentication and authorization for webhook routes', async () => {
            // arrange
            const routes = [
                '/v1/webhooks',
                '/v1/webhooks/:flowId',
                '/v1/webhooks/:flowId/simulate',
                '/v1/webhooks/:flowId/sync',
            ]
            for (const route of routes) {
                const mockRequest = {
                    method: 'POST',
                    routerPath: route,
                    routeConfig: {
                        skipAuth: true,
                        allowedPrincipals: ALL_PRINCIPAL_TYPES,
                    },
                    headers: {

                    },
                } as unknown as FastifyRequest

                // act
                const result = securityHandlerChain(mockRequest)

                // assert
                await expect(result).resolves.toBeUndefined()
                expect(mockRequest.principal.type).toEqual(PrincipalType.UNKNOWN)
            }
        })

    })
    describe('Global API Key Authentication', () => {
        it('Authenticates Admin User using Global API Key', async () => {
            // arrange
            const mockApiKey = 'api-key'
            const mockRequest = {
                method: 'POST',
                routerPath: '/v1/admin/platforms',
                headers: {
                    'api-key': mockApiKey,
                },
                routeConfig: {
                    allowedPrincipals: [PrincipalType.SUPER_USER],
                },
            } as unknown as FastifyRequest

            // act
            const result = securityHandlerChain(mockRequest)

            // assert
            await expect(result).resolves.toBeUndefined()

            expect(mockRequest.principal).toEqual(
                expect.objectContaining({
                    id: expect.stringMatching(/SUPER_USER_.{21}/),
                    type: PrincipalType.SUPER_USER,
                    projectId: expect.stringMatching(/SUPER_USER_.{21}/),
                }),
            )
        })

        it('Fails if provided API key is invalid', async () => {
            // arrange
            const mockInvalidApiKey = '321'
            const mockRequest = {
                method: 'POST',
                routerPath: '/v1/admin/users',
                headers: {
                    'api-key': mockInvalidApiKey,
                },
                routeConfig: {},
            } as unknown as FastifyRequest

            // act
            const result = securityHandlerChain(mockRequest)

            // assert
            return result.catch((e) => {
                expect(e).toEqual(
                    new ActivepiecesError({
                        code: ErrorCode.INVALID_API_KEY,
                        params: {},
                    }),
                )
            })
        })
    })

    describe('Platform API Key Authentication', () => {
        it('Authenticates service principals', async () => {
            // arrange
            const { mockOwner, mockPlatform, mockApiKey } =
                setupMockApiKeyServiceAccount()

            await databaseConnection().getRepository('user').save([mockOwner])
            await databaseConnection().getRepository('platform').save([mockPlatform])
            await databaseConnection().getRepository('api_key').save([mockApiKey])

            const mockRequest = {
                method: 'GET',
                routerPath: '/v1/flows',
                headers: {
                    authorization: `Bearer ${mockApiKey.value}`,
                },
                routeConfig: {
                    allowedPrincipals: [PrincipalType.SERVICE],
                    scope: EndpointScope.PLATFORM,
                },
            } as unknown as FastifyRequest

            // act
            const result = securityHandlerChain(mockRequest)

            // assert
            await expect(result).resolves.toBeUndefined()

            expect(mockRequest.principal).toEqual(
                expect.objectContaining({
                    id: mockApiKey.id,
                    type: PrincipalType.SERVICE,
                    projectId: expect.stringMatching(/ANONYMOUS_.{21}/),
                    platform: {
                        id: mockPlatform.id,
                    },
                }),
            )
        })

        it('Gets projectId from body if endpoint scope is PROJECT', async () => {
            // arrange
            const { mockOwner, mockPlatform, mockApiKey } =
                setupMockApiKeyServiceAccount()
            const mockProject = createMockProject({
                ownerId: mockOwner.id,
                platformId: mockPlatform.id,
            })

            await databaseConnection().getRepository('user').save([mockOwner])
            await databaseConnection().getRepository('platform').save([mockPlatform])
            await databaseConnection().getRepository('api_key').save([mockApiKey])
            await databaseConnection().getRepository('project').save([mockProject])

            const mockRequest = {
                method: 'GET',
                routerPath: '/v1/flows',
                headers: {
                    authorization: `Bearer ${mockApiKey.value}`,
                },
                body: {
                    projectId: mockProject.id,
                },
                routeConfig: {
                    allowedPrincipals: [PrincipalType.SERVICE],
                    scope: EndpointScope.PROJECT,
                },
            } as unknown as FastifyRequest

            // act
            const result = securityHandlerChain(mockRequest)

            // assert
            await expect(result).resolves.toBeUndefined()

            expect(mockRequest.principal).toEqual(
                expect.objectContaining({
                    id: mockApiKey.id,
                    type: PrincipalType.SERVICE,
                    projectId: mockProject.id,
                    platform: {
                        id: mockPlatform.id,
                    },
                }),
            )
        })

        it('Gets projectId from query if endpoint scope is PROJECT', async () => {
            // arrange
            const { mockOwner, mockPlatform, mockApiKey } =
                setupMockApiKeyServiceAccount()
            const mockProject = createMockProject({
                ownerId: mockOwner.id,
                platformId: mockPlatform.id,
            })

            await databaseConnection().getRepository('user').save([mockOwner])
            await databaseConnection().getRepository('platform').save([mockPlatform])
            await databaseConnection().getRepository('api_key').save([mockApiKey])
            await databaseConnection().getRepository('project').save([mockProject])

            const mockRequest = {
                method: 'GET',
                routerPath: '/v1/flows',
                headers: {
                    authorization: `Bearer ${mockApiKey.value}`,
                },
                query: {
                    projectId: mockProject.id,
                },
                routeConfig: {
                    allowedPrincipals: [PrincipalType.SERVICE],
                    scope: EndpointScope.PROJECT,
                },
            } as unknown as FastifyRequest

            // act
            const result = securityHandlerChain(mockRequest)

            // assert
            await expect(result).resolves.toBeUndefined()

            expect(mockRequest.principal).toEqual(
                expect.objectContaining({
                    id: mockApiKey.id,
                    type: PrincipalType.SERVICE,
                    projectId: mockProject.id,
                    platform: {
                        id: mockPlatform.id,
                    },
                }),
            )
        })

        it('extracts projectId from resource if endpoint scope is PROJECT', async () => {
            // arrange
            const { mockOwner, mockPlatform, mockApiKey } =
                setupMockApiKeyServiceAccount()
            const mockProject = createMockProject({
                ownerId: mockOwner.id,
                platformId: mockPlatform.id,
            })
            const mockFlow = createMockFlow({ projectId: mockProject.id })

            await databaseConnection().getRepository('user').save([mockOwner])
            await databaseConnection().getRepository('platform').save([mockPlatform])
            await databaseConnection().getRepository('api_key').save([mockApiKey])
            await databaseConnection().getRepository('project').save([mockProject])
            await databaseConnection().getRepository('flow').save([mockFlow])

            const mockRequest = {
                method: 'GET',
                routerPath: '/v1/flows/:id',
                params: {
                    id: mockFlow.id,
                },
                headers: {
                    authorization: `Bearer ${mockApiKey.value}`,
                },
                routeConfig: {
                    allowedPrincipals: [PrincipalType.SERVICE],
                    scope: EndpointScope.PROJECT,
                },
            } as unknown as FastifyRequest

            // act
            const result = securityHandlerChain(mockRequest)

            // assert
            await expect(result).resolves.toBeUndefined()

            expect(mockRequest.principal).toEqual(
                expect.objectContaining({
                    id: mockApiKey.id,
                    type: PrincipalType.SERVICE,
                    projectId: mockProject.id,
                    platform: {
                        id: mockPlatform.id,
                    },
                }),
            )
        })

        it('Fails if API key and project don\'t belong to same platform if endpoint scope is PROJECT', async () => {
            // arrange
            const { mockOwner, mockPlatform, mockApiKey } =
                setupMockApiKeyServiceAccount()
            const { mockOwner: mockOtherOwner, mockPlatform: mockOtherPlatform } =
                createMockPlatformWithOwner()
            const mockOtherProject = createMockProject({
                ownerId: mockOtherOwner.id,
                platformId: mockOtherPlatform.id,
            })

            await databaseConnection()
                .getRepository('user')
                .save([mockOwner, mockOtherOwner])
            await databaseConnection()
                .getRepository('platform')
                .save([mockPlatform, mockOtherPlatform])
            await databaseConnection().getRepository('api_key').save([mockApiKey])
            await databaseConnection()
                .getRepository('project')
                .save([mockOtherProject])

            const mockRequest = {
                method: 'GET',
                routerPath: '/v1/flows',
                query: {
                    projectId: mockOtherProject.id,
                },
                headers: {
                    authorization: `Bearer ${mockApiKey.value}`,
                },
                routeConfig: {
                    allowedPrincipals: [PrincipalType.SERVICE],
                    scope: EndpointScope.PROJECT,
                },
            } as unknown as FastifyRequest

            // act
            const result = securityHandlerChain(mockRequest)

            // assert
            await expect(result).rejects.toEqual(
                new ActivepiecesError({
                    code: ErrorCode.AUTHORIZATION,
                    params: {
                        message: 'invalid project id',
                    },
                }),
            )
        })

        it('Fails if no projectId is extracted from request or resource and endpoint scope is PROJECT', async () => {
            // arrange
            const { mockOwner, mockPlatform, mockApiKey } =
                setupMockApiKeyServiceAccount()

            await databaseConnection().getRepository('user').save([mockOwner])
            await databaseConnection().getRepository('platform').save([mockPlatform])
            await databaseConnection().getRepository('api_key').save([mockApiKey])

            const mockRequest = {
                method: 'GET',
                routerPath: '/v1/flows',
                headers: {
                    authorization: `Bearer ${mockApiKey.value}`,
                },
                routeConfig: {
                    allowedPrincipals: [PrincipalType.SERVICE],
                    scope: EndpointScope.PROJECT,
                },
            } as unknown as FastifyRequest

            // act
            const result = securityHandlerChain(mockRequest)

            // assert
            await expect(result).rejects.toEqual(
                new ActivepiecesError({
                    code: ErrorCode.AUTHORIZATION,
                    params: {
                        message: 'invalid project id',
                    },
                }),
            )
        })

        it('Fails if project with extracted id doesn\'t exist and endpoint scope is PROJECT', async () => {
            // arrange
            const mockNonExistentProjectId = apId()
            const { mockOwner, mockPlatform, mockApiKey } =
                setupMockApiKeyServiceAccount()

            await databaseConnection().getRepository('user').save([mockOwner])
            await databaseConnection().getRepository('platform').save([mockPlatform])
            await databaseConnection().getRepository('api_key').save([mockApiKey])

            const mockRequest = {
                method: 'GET',
                routerPath: '/v1/flows',
                query: {
                    projectId: mockNonExistentProjectId,
                },
                headers: {
                    authorization: `Bearer ${mockApiKey.value}`,
                },
                routeConfig: {
                    allowedPrincipals: [PrincipalType.SERVICE],
                    scope: EndpointScope.PROJECT,
                },
            } as unknown as FastifyRequest

            // act
            const result = securityHandlerChain(mockRequest)

            // assert
            await expect(result).rejects.toEqual(
                new ActivepiecesError({
                    code: ErrorCode.AUTHORIZATION,
                    params: {
                        message: 'invalid project id',
                    },
                }),
            )
        })

        it('Fails if API key doesn\'t exist', async () => {
            // arrange
            const mockNonExistentApiKey = '123'

            const mockRequest = {
                method: 'POST',
                routerPath: '/v1/flows',
                headers: {
                    authorization: `Bearer ${mockNonExistentApiKey}`,
                },
                routeConfig: {
                    allowedPrincipals: [PrincipalType.SERVICE],
                    scope: EndpointScope.PLATFORM,
                },
            } as unknown as FastifyRequest

            // act
            const result = securityHandlerChain(mockRequest)

            // assert
            await expect(result).rejects.toEqual(
                new ActivepiecesError({
                    code: ErrorCode.INVALID_BEARER_TOKEN,
                    params: {
                        message: 'invalid access token',
                    },
                }),
            )
        })

        it('Fails if route doesn\'t allow SERVICE principals', async () => {
            // arrange
            const { mockOwner, mockPlatform, mockApiKey } =
                setupMockApiKeyServiceAccount()

            await databaseConnection().getRepository('user').save([mockOwner])
            await databaseConnection().getRepository('platform').save([mockPlatform])
            await databaseConnection().getRepository('api_key').save([mockApiKey])

            const mockRequest = {
                method: 'POST',
                routerPath: '/v1/flows',
                headers: {
                    authorization: `Bearer ${mockApiKey.value}`,
                },
                routeConfig: {
                    allowedPrincipals: [PrincipalType.USER],
                    scope: EndpointScope.PLATFORM,
                },
            } as unknown as FastifyRequest

            // act
            const result = securityHandlerChain(mockRequest)

            // assert
            await expect(result).rejects.toEqual(
                new ActivepiecesError({
                    code: ErrorCode.AUTHORIZATION,
                    params: {
                        message: 'invalid route for principal type',
                    },
                }),
            )
        })
    })

    describe('Access Token Authentication', () => {

        it('Session expirey for Users', async () => {
            // arrange
            const { mockOwner, mockPlatform, mockProject } = setupMockApiKeyServiceAccount()

            await databaseConnection().getRepository('user').save([mockOwner])
            await databaseConnection().getRepository('platform').save([mockPlatform])
            await databaseConnection().getRepository('project').save([mockProject])

            const sessionId = nanoid()
            await databaseConnection().getRepository('user').update(mockOwner.id, {
                tokenVersion: sessionId,
            })
            const mockPrincipal: Principal = {
                id: mockOwner.id,
                type: PrincipalType.USER,
                projectId: mockProject.id,
                platform: {
                    id: mockPlatform.id,
                },
            }

            const mockAccessToken = await generateMockToken(mockPrincipal)

            const mockRequest = {
                method: 'GET',
                routerPath: '/v1/flows',
                headers: {
                    authorization: `Bearer ${mockAccessToken}`,
                },
                routeConfig: {},
            } as unknown as FastifyRequest

            // act
            const result = securityHandlerChain(mockRequest)

            // assert
            await expect(result).rejects.toEqual(
                new ActivepiecesError({
                    code: ErrorCode.SESSION_EXPIRED,
                    params: {
                        message: 'The session has expired.',
                    },
                }),
            )
        })

        it('Authenticates users', async () => {
            // arrange

            const { mockOwner, mockPlatform, mockProject } = setupMockApiKeyServiceAccount()

            await databaseConnection().getRepository('user').save([mockOwner])
            await databaseConnection().getRepository('platform').save([mockPlatform])
            await databaseConnection().getRepository('project').save([mockProject])

            const mockPrincipal: Principal = {
                id: mockOwner.id,
                type: PrincipalType.USER,
                projectId: mockProject.id,
                platform: {
                    id: mockPlatform.id,
                },

            }

            const mockAccessToken = await generateMockToken(mockPrincipal)

            const mockRequest = {
                method: 'GET',
                routerPath: '/v1/flows',
                headers: {
                    authorization: `Bearer ${mockAccessToken}`,
                },
                routeConfig: {},
            } as unknown as FastifyRequest

            // act
            const result = securityHandlerChain(mockRequest)

            // assert
            await expect(result).resolves.toBeUndefined()

            expect(mockRequest.principal).toEqual(
                expect.objectContaining({
                    id: mockPrincipal.id,
                    type: PrincipalType.USER,
                    projectId: mockPrincipal.projectId,
                    platform: {
                        id: mockPrincipal.platform.id,
                    },
                }),
            )
        })

        it('Fails if route disallows USER principal type', async () => {

            const { mockOwner, mockPlatform, mockProject } = setupMockApiKeyServiceAccount()

            await databaseConnection().getRepository('user').save([mockOwner])
            await databaseConnection().getRepository('platform').save([mockPlatform])
            await databaseConnection().getRepository('project').save([mockProject])


            // arrange
            const mockPrincipal: Principal = {
                id: mockOwner.id,
                type: PrincipalType.USER,
                projectId: mockProject.id,
                platform: {
                    id: mockPlatform.id,
                },

            }
            const mockAccessToken = await generateMockToken(mockPrincipal)

            const mockRequest = {
                method: 'GET',
                routerPath: '/v1/flows',
                headers: {
                    authorization: `Bearer ${mockAccessToken}`,
                },
                routeConfig: {
                    allowedPrincipals: [PrincipalType.SERVICE],
                },
            } as unknown as FastifyRequest

            // act
            const result = securityHandlerChain(mockRequest)

            // assert
            await expect(result).rejects.toEqual(
                new ActivepiecesError({
                    code: ErrorCode.AUTHORIZATION,
                    params: {
                        message: 'invalid route for principal type',
                    },
                }),
            )
        })

        it('Fails if projectId in query doesn\'t match principal projectId', async () => {


            const { mockOwner, mockPlatform, mockProject } = setupMockApiKeyServiceAccount()

            await databaseConnection().getRepository('user').save([mockOwner])
            await databaseConnection().getRepository('platform').save([mockPlatform])
            await databaseConnection().getRepository('project').save([mockProject])


            const mockPrincipal: Principal = {
                id: mockOwner.id,
                type: PrincipalType.USER,
                projectId: mockProject.id,
                platform: {
                    id: mockPlatform.id,
                },

            }

            // arrange
            const mockOtherProjectId = apId()
            const mockAccessToken = await generateMockToken(mockPrincipal)

            const mockRequest = {
                method: 'GET',
                routerPath: '/v1/flows',
                query: {
                    projectId: mockOtherProjectId,
                },
                headers: {
                    authorization: `Bearer ${mockAccessToken}`,
                },
                routeConfig: {},
            } as unknown as FastifyRequest

            // act
            const result = securityHandlerChain(mockRequest)

            // assert
            await expect(result).rejects.toEqual(
                new ActivepiecesError({
                    code: ErrorCode.AUTHORIZATION,
                    params: {
                        message: 'invalid project id',
                    },
                }),
            )
        })

        it('Fails if projectId in body doesn\'t match principal projectId', async () => {
            
            const { mockOwner, mockPlatform, mockProject } = setupMockApiKeyServiceAccount()

            await databaseConnection().getRepository('user').save([mockOwner])
            await databaseConnection().getRepository('platform').save([mockPlatform])
            await databaseConnection().getRepository('project').save([mockProject])


            const mockPrincipal: Principal = {
                id: mockOwner.id,
                type: PrincipalType.USER,
                projectId: mockProject.id,
                platform: {
                    id: mockPlatform.id,
                },

            }

            // arrange
            const mockOtherProjectId = apId()
            const mockAccessToken = await generateMockToken(mockPrincipal)

            const mockRequest = {
                method: 'GET',
                routerPath: '/v1/flows',
                headers: {
                    authorization: `Bearer ${mockAccessToken}`,
                },
                body: {
                    projectId: mockOtherProjectId,
                },
                routeConfig: {},
            } as unknown as FastifyRequest

            // act
            const result = securityHandlerChain(mockRequest)

            // assert
            await expect(result).rejects.toEqual(
                new ActivepiecesError({
                    code: ErrorCode.AUTHORIZATION,
                    params: {
                        message: 'invalid project id',
                    },
                }),
            )
        })
    })

    describe('Anonymous authentication', () => {
        it('Enables access to non authenticated routes', async () => {
            // arrange
            const nonAuthenticatedRoute = '/v1/docs'

            const mockRequest = {
                method: 'GET',
                routerPath: nonAuthenticatedRoute,
                headers: {},
                routeConfig: {},
            } as unknown as FastifyRequest

            // act
            const result = securityHandlerChain(mockRequest)

            // assert
            await expect(result).resolves.toBeUndefined()

            expect(mockRequest.principal).toEqual(
                expect.objectContaining({
                    id: expect.stringMatching(/ANONYMOUS_.{21}/),
                    type: PrincipalType.UNKNOWN,
                    projectId: expect.stringMatching(/ANONYMOUS_.{21}/),
                    platform: {
                        id: expect.stringMatching(/ANONYMOUS_.{21}/),
                    },
                }),
            )
        })

        it('Fails if route is authenticated', async () => {
            // arrange
            const authenticatedRoute = '/v1/flows'

            const mockRequest = {
                method: 'GET',
                routerPath: authenticatedRoute,
                headers: {},
                routeConfig: {},
            } as unknown as FastifyRequest

            // act
            const result = securityHandlerChain(mockRequest)

            // assert
            await expect(result).rejects.toEqual(
                new ActivepiecesError({
                    code: ErrorCode.AUTHORIZATION,
                    params: {
                        message: 'invalid route for principal type',
                    },
                }),
            )
        })
    })
})
