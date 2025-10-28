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
    mockAndSaveBasicSetup,
    mockAndSaveBasicSetupWithApiKey,
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
                    routeOptions: {
                        url: route,
                        config: {
                            skipAuth: true,
                            allowedPrincipals: ALL_PRINCIPAL_TYPES,
                        },
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
                routeOptions: {
                    url: '/v1/admin/platforms',
                    config: {
                        allowedPrincipals: [PrincipalType.SUPER_USER],
                    },
                },
                headers: {
                    'api-key': mockApiKey,
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
                routeOptions: {
                    url: '/v1/admin/users',
                    config: {},
                },
                headers: {
                    'api-key': mockInvalidApiKey,
                },
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
            const { mockPlatform, mockApiKey } =
                await mockAndSaveBasicSetupWithApiKey()

            const mockRequest = {
                method: 'GET',
                routeOptions: {
                    url: '/v1/flows',
                    config: {
                        allowedPrincipals: [PrincipalType.SERVICE],
                        scope: EndpointScope.PLATFORM,
                    },
                },
                headers: {
                    authorization: `Bearer ${mockApiKey.value}`,
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
            const { mockPlatform, mockProject, mockApiKey } =
                await mockAndSaveBasicSetupWithApiKey()

            const mockRequest = {
                method: 'GET',
                routeOptions: {
                    url: '/v1/flows',
                    config: {
                        allowedPrincipals: [PrincipalType.SERVICE],
                        scope: EndpointScope.PROJECT,
                    },
                },
                headers: {
                    authorization: `Bearer ${mockApiKey.value}`,
                },
                body: {
                    projectId: mockProject.id,
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
            const { mockPlatform, mockProject, mockApiKey } =
                await mockAndSaveBasicSetupWithApiKey()

            const mockRequest = {
                method: 'GET',
                routeOptions: {
                    url: '/v1/flows',
                    config: {
                        allowedPrincipals: [PrincipalType.SERVICE],
                        scope: EndpointScope.PROJECT,
                    },
                },
                headers: {
                    authorization: `Bearer ${mockApiKey.value}`,
                },
                query: {
                    projectId: mockProject.id,
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
            const { mockPlatform, mockProject, mockApiKey } =
                await mockAndSaveBasicSetupWithApiKey()
            const mockFlow = createMockFlow({ projectId: mockProject.id })

            await databaseConnection().getRepository('flow').save([mockFlow])

            const mockRequest = {
                method: 'GET',
                routeOptions: {
                    url: '/v1/flows/:id',
                    config: {
                        allowedPrincipals: [PrincipalType.SERVICE],
                        scope: EndpointScope.PROJECT,
                    },
                },
                params: {
                    id: mockFlow.id,
                },
                headers: {
                    authorization: `Bearer ${mockApiKey.value}`,
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
            const { mockApiKey } = await mockAndSaveBasicSetupWithApiKey()
            const { mockProject: mockOtherProject } = await mockAndSaveBasicSetup()

            const mockRequest = {
                method: 'GET',
                routeOptions: {
                    url: '/v1/flows',
                    config: {
                        allowedPrincipals: [PrincipalType.SERVICE],
                        scope: EndpointScope.PROJECT,
                    },
                },
                query: {
                    projectId: mockOtherProject.id,
                },
                headers: {
                    authorization: `Bearer ${mockApiKey.value}`,
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
            const { mockApiKey } = await mockAndSaveBasicSetupWithApiKey()

            const mockRequest = {
                method: 'GET',
                routeOptions: {
                    url: '/v1/flows',
                    config: {
                        allowedPrincipals: [PrincipalType.SERVICE],
                        scope: EndpointScope.PROJECT,
                    },
                },
                headers: {
                    authorization: `Bearer ${mockApiKey.value}`,
                },
            } as unknown as FastifyRequest

            // act
            const result = securityHandlerChain(mockRequest)

            // assert
            await expect(result).rejects.toEqual(
                new ActivepiecesError({
                    code: ErrorCode.VALIDATION,
                    params: {
                        message: 'invalid project id',
                    },
                }),
            )
        })

        it('Fails if project with extracted id doesn\'t exist and endpoint scope is PROJECT', async () => {
            // arrange
            const mockNonExistentProjectId = apId()
            const { mockApiKey } = await mockAndSaveBasicSetupWithApiKey()

            const mockRequest = {
                method: 'GET',
                routeOptions: {
                    url: '/v1/flows',
                    config: {
                        allowedPrincipals: [PrincipalType.SERVICE],
                        scope: EndpointScope.PROJECT,
                    },
                },
                query: {
                    projectId: mockNonExistentProjectId,
                },
                headers: {
                    authorization: `Bearer ${mockApiKey.value}`,
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
                routeOptions: {
                    url: '/v1/flows',
                    config: {
                        allowedPrincipals: [PrincipalType.SERVICE],
                        scope: EndpointScope.PLATFORM,
                    },
                },
                headers: {
                    authorization: `Bearer ${mockNonExistentApiKey}`,
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
            const { mockApiKey } = await mockAndSaveBasicSetupWithApiKey()

            const mockRequest = {
                method: 'POST',
                routeOptions: {
                    url: '/v1/flows',
                    config: {
                        allowedPrincipals: [PrincipalType.USER],
                        scope: EndpointScope.PLATFORM,
                    },
                },
                headers: {
                    authorization: `Bearer ${mockApiKey.value}`,
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
            const { mockOwner, mockPlatform, mockProject, mockUserIdentity } = await mockAndSaveBasicSetupWithApiKey()

            await databaseConnection().getRepository('user_identity').update(mockUserIdentity.id, {
                tokenVersion: nanoid(),
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
                routeOptions: {
                    url: '/v1/flows',
                    config: {},
                },
                headers: {
                    authorization: `Bearer ${mockAccessToken}`,
                },
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
            const { mockOwner, mockPlatform, mockProject } = await mockAndSaveBasicSetupWithApiKey()

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
                routeOptions: {
                    url: '/v1/flows',
                    config: {},
                },
                headers: {
                    authorization: `Bearer ${mockAccessToken}`,
                },
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
            const { mockOwner, mockPlatform, mockProject } = await mockAndSaveBasicSetupWithApiKey()

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
                routeOptions: {
                    url: '/v1/flows',
                    config: {
                        allowedPrincipals: [PrincipalType.SERVICE],
                    },
                },
                headers: {
                    authorization: `Bearer ${mockAccessToken}`,
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
            const { mockOwner, mockPlatform, mockProject } = await mockAndSaveBasicSetupWithApiKey()

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
                routeOptions: {
                    url: '/v1/flows',
                    config: {},
                },
                query: {
                    projectId: mockOtherProjectId,
                },
                headers: {
                    authorization: `Bearer ${mockAccessToken}`,
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

        it('Fails if projectId in body doesn\'t match principal projectId', async () => {
            const { mockOwner, mockPlatform, mockProject } = await mockAndSaveBasicSetupWithApiKey()

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
                routeOptions: {
                    url: '/v1/flows',
                    config: {},
                },
                headers: {
                    authorization: `Bearer ${mockAccessToken}`,
                },
                body: {
                    projectId: mockOtherProjectId,
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
    })

    describe('Anonymous authentication', () => {
        it('Enables access to non authenticated routes', async () => {
            // arrange
            const nonAuthenticatedRoute = '/v1/docs'

            const mockRequest = {
                method: 'GET',
                routeOptions: {
                    url: nonAuthenticatedRoute,
                    config: {},
                },
                headers: {},
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
                routeOptions: {
                    url: authenticatedRoute,
                    config: {},
                },
                headers: {},
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
