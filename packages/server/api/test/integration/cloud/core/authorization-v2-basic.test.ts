
import { AuthorizationRouteSecurity, AuthorizationType, RouteKind } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    apId,
    ErrorCode,
    PlatformRole,
    Principal,
    PrincipalType,
} from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { authorizeOrThrow } from '../../../../src/app/core/security/v2/authz/authorize'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupServer } from '../../../../src/app/server'
import {
    mockAndSaveBasicSetup,
    mockAndSaveBasicSetupWithApiKey,
    mockBasicUser,
} from '../../../helpers/mocks'

let app: FastifyInstance | null = null
let mockLog: FastifyBaseLogger

beforeAll(async () => {
    await initializeDatabase({ runMigrations: false })
    app = await setupServer()
    mockLog = app!.log!
})

afterAll(async () => {
    await databaseConnection().destroy()
    await app?.close()
}, 600000)

describe('authorizeOrThrow - Basic', () => {
    describe('PUBLIC routes', () => {
        it('should allow any principal for public routes', async () => {
            
            const security: AuthorizationRouteSecurity = {
                kind: RouteKind.PUBLIC,
            }
            const principal: Principal = {
                id: apId(),
                type: PrincipalType.UNKNOWN,
            }

            await expect(authorizeOrThrow(principal, security, mockLog)).resolves.toBeUndefined()
        })
    })

    describe('PLATFORM authorization', () => {
        it('should allow USER principal when allowed', async () => {
            
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup()

            const principal: Principal = {
                id: mockOwner.id,
                type: PrincipalType.USER,
                platform: {
                    id: mockPlatform.id,
                },
                
            }
            const security: AuthorizationRouteSecurity = {
                kind: RouteKind.AUTHENTICATED,
                authorization: {
                    type: AuthorizationType.PLATFORM,
                    adminOnly: false,
                    allowedPrincipals: [PrincipalType.USER],
                },
            }

            await expect(authorizeOrThrow(principal, security, mockLog)).resolves.toBeUndefined()
        })

        it('should allow SERVICE principal when allowed', async () => {
            
            const { mockPlatform, mockApiKey } = await mockAndSaveBasicSetupWithApiKey()

            const principal: Principal = {
                id: mockApiKey.id,
                type: PrincipalType.SERVICE,
                platform: {
                    id: mockPlatform.id,
                },
                
            }
            const security: AuthorizationRouteSecurity = {
                kind: RouteKind.AUTHENTICATED,
                authorization: {
                    type: AuthorizationType.PLATFORM,
                    adminOnly: false,
                    allowedPrincipals: [PrincipalType.SERVICE],
                },
            }

            await expect(authorizeOrThrow(principal, security, mockLog)).resolves.toBeUndefined()
        })

        it('should reject principal not in allowedPrincipals', async () => {
            
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup()

            const principal: Principal = {
                id: mockOwner.id,
                type: PrincipalType.USER,
                platform: {
                    id: mockPlatform.id,
                },
                
            }
            const security: AuthorizationRouteSecurity = {
                kind: RouteKind.AUTHENTICATED,
                authorization: {
                    type: AuthorizationType.PLATFORM,
                    adminOnly: false,
                    allowedPrincipals: [PrincipalType.SERVICE], // USER not allowed
                },
            }

            await expect(authorizeOrThrow(principal, security, mockLog)).rejects.toEqual(
                new ActivepiecesError({
                    code: ErrorCode.AUTHORIZATION,
                    params: {
                        message: 'principal is not allowed for this route',
                    },
                }),
            )
        })

        it('should allow platform admin when adminOnly is true', async () => {
            
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup()

            const principal: Principal = {
                id: mockOwner.id,
                type: PrincipalType.USER,
                platform: {
                    id: mockPlatform.id,
                },
                
            }
            const security: AuthorizationRouteSecurity = {
                kind: RouteKind.AUTHENTICATED,
                authorization: {
                    type: AuthorizationType.PLATFORM,
                    adminOnly: true,
                    allowedPrincipals: [PrincipalType.USER],
                },
            }

            await expect(authorizeOrThrow(principal, security, mockLog)).resolves.toBeUndefined()
        })

        it('should reject non-admin user when adminOnly is true', async () => {
            
            const { mockPlatform } = await mockAndSaveBasicSetup()
            const { mockUser: nonAdminUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })

            const principal: Principal = {
                id: nonAdminUser.id,
                type: PrincipalType.USER,
                platform: {
                    id: mockPlatform.id,
                },
                
            }
            const security: AuthorizationRouteSecurity = {
                kind: RouteKind.AUTHENTICATED,
                authorization: {
                    type: AuthorizationType.PLATFORM,
                    adminOnly: true,
                    allowedPrincipals: [PrincipalType.USER],
                },
            }

            await expect(authorizeOrThrow(principal, security, mockLog)).rejects.toEqual(
                new ActivepiecesError({
                    code: ErrorCode.AUTHORIZATION,
                    params: {
                        message: 'User is not an admin/owner of the platform.',
                    },
                }),
            )
        })

        it('should allow SERVICE principal when adminOnly is true', async () => {
            
            const { mockPlatform, mockApiKey } = await mockAndSaveBasicSetupWithApiKey()

            const principal: Principal = {
                id: mockApiKey.id,
                type: PrincipalType.SERVICE,
                platform: {
                    id: mockPlatform.id,
                },
                
            }
            const security: AuthorizationRouteSecurity = {
                kind: RouteKind.AUTHENTICATED,
                authorization: {
                    type: AuthorizationType.PLATFORM,
                    adminOnly: true,
                    allowedPrincipals: [PrincipalType.SERVICE],
                },
            }

            await expect(authorizeOrThrow(principal, security, mockLog)).resolves.toBeUndefined()
        })
    })

    describe('WORKER authorization', () => {
        it('should allow WORKER principal', async () => {
            
            const principal: Principal = {
                id: apId(),
                type: PrincipalType.WORKER,
            }
            const security: AuthorizationRouteSecurity = {
                kind: RouteKind.AUTHENTICATED,
                authorization: {
                    type: AuthorizationType.UNSCOPED,
                    allowedPrincipals: [PrincipalType.WORKER],
                },
            }

            await expect(authorizeOrThrow(principal, security, mockLog)).resolves.toBeUndefined()
        })

        it('should reject non-WORKER principal for WORKER routes', async () => {
            
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup()

            const principal: Principal = {
                id: mockOwner.id,
                type: PrincipalType.USER,
                platform: {
                    id: mockPlatform.id,
                },
                
            }
            const security: AuthorizationRouteSecurity = {
                kind: RouteKind.AUTHENTICATED,
                authorization: {
                    type: AuthorizationType.UNSCOPED,
                    allowedPrincipals: [PrincipalType.WORKER],
                },
            }

            await expect(authorizeOrThrow(principal, security, mockLog)).rejects.toEqual(
                new ActivepiecesError({
                    code: ErrorCode.AUTHORIZATION,
                    params: {
                        message: 'principal is not allowed for this route',
                    },
                }),
            )
        })
    })

    describe('ENGINE authorization', () => {
        it('should allow ENGINE principal', async () => {
            
            const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()

            const principal: Principal = {
                id: apId(),
                type: PrincipalType.ENGINE,
                projectId: mockProject.id,
                platform: {
                    id: mockPlatform.id,
                },
            }
            const security: AuthorizationRouteSecurity = {
                kind: RouteKind.AUTHENTICATED,
                authorization: {
                    type: AuthorizationType.UNSCOPED,
                    allowedPrincipals: [PrincipalType.ENGINE],
                },
            }

            await expect(authorizeOrThrow(principal, security, mockLog)).resolves.toBeUndefined()
        })

        it('should reject non-ENGINE principal for ENGINE routes', async () => {
            
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup()

            const principal: Principal = {
                id: mockOwner.id,
                type: PrincipalType.USER,
                platform: {
                    id: mockPlatform.id,
                },
                
            }
            const security: AuthorizationRouteSecurity = {
                kind: RouteKind.AUTHENTICATED,
                authorization: {
                    type: AuthorizationType.UNSCOPED,
                    allowedPrincipals: [PrincipalType.ENGINE],
                },
            }

            await expect(authorizeOrThrow(principal, security, mockLog)).rejects.toEqual(
                new ActivepiecesError({
                    code: ErrorCode.AUTHORIZATION,
                    params: {
                        message: 'principal is not allowed for this route',
                    },
                }),
            )
        })
    })

    describe('NONE authorization', () => {
        it('should allow any authenticated principal', async () => {
            
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup()

            const principal: Principal = {
                id: mockOwner.id,
                type: PrincipalType.USER,
                platform: {
                    id: mockPlatform.id,
                },
                
            }
            const security: AuthorizationRouteSecurity = {
                kind: RouteKind.AUTHENTICATED,
                authorization: {
                    type: AuthorizationType.NONE,
                    reason: 'Test route with no specific authorization',
                },
            }

            await expect(authorizeOrThrow(principal, security, mockLog)).resolves.toBeUndefined()
        })

        it('should allow UNKNOWN principal for NONE authorization', async () => {
            
            const principal: Principal = {
                id: apId(),
                type: PrincipalType.UNKNOWN,
            }
            const security: AuthorizationRouteSecurity = {
                kind: RouteKind.AUTHENTICATED,
                authorization: {
                    type: AuthorizationType.NONE,
                    reason: 'Test route with no specific authorization',
                },
            }

            await expect(authorizeOrThrow(principal, security, mockLog)).resolves.toBeUndefined()
        })
    })

    describe('UNSCOPED authorization', () => {
        it('should allow USER principal when in allowedPrincipals', async () => {
            
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup()

            const principal: Principal = {
                id: mockOwner.id,
                type: PrincipalType.USER,
                platform: {
                    id: mockPlatform.id,
                },
                
            }
            const security: AuthorizationRouteSecurity = {
                kind: RouteKind.AUTHENTICATED,
                authorization: {
                    type: AuthorizationType.UNSCOPED,
                    allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
                },
            }

            await expect(authorizeOrThrow(principal, security, mockLog)).resolves.toBeUndefined()
        })

        it('should allow SERVICE principal when in allowedPrincipals', async () => {
            
            const { mockPlatform, mockApiKey } = await mockAndSaveBasicSetupWithApiKey()

            const principal: Principal = {
                id: mockApiKey.id,
                type: PrincipalType.SERVICE,
                platform: {
                    id: mockPlatform.id,
                },
                
            }
            const security: AuthorizationRouteSecurity = {
                kind: RouteKind.AUTHENTICATED,
                authorization: {
                    type: AuthorizationType.UNSCOPED,
                    allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE],
                },
            }

            await expect(authorizeOrThrow(principal, security, mockLog)).resolves.toBeUndefined()
        })

        it('should allow UNKNOWN principal when in allowedPrincipals', async () => {
            
            const principal: Principal = {
                id: apId(),
                type: PrincipalType.UNKNOWN,
            }
            const security: AuthorizationRouteSecurity = {
                kind: RouteKind.AUTHENTICATED,
                authorization: {
                    type: AuthorizationType.UNSCOPED,
                    allowedPrincipals: [PrincipalType.UNKNOWN],
                },
            }

            await expect(authorizeOrThrow(principal, security, mockLog)).resolves.toBeUndefined()
        })

        it('should reject principal not in allowedPrincipals', async () => {
            
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup()

            const principal: Principal = {
                id: mockOwner.id,
                type: PrincipalType.USER,
                platform: {
                    id: mockPlatform.id,
                },
                
            }
            const security: AuthorizationRouteSecurity = {
                kind: RouteKind.AUTHENTICATED,
                authorization: {
                    type: AuthorizationType.UNSCOPED,
                    allowedPrincipals: [PrincipalType.SERVICE, PrincipalType.ENGINE], // USER not allowed
                },
            }

            await expect(authorizeOrThrow(principal, security, mockLog)).rejects.toEqual(
                new ActivepiecesError({
                    code: ErrorCode.AUTHORIZATION,
                    params: {
                        message: 'principal is not allowed for this route',
                    },
                }),
            )
        })

        it('should allow multiple principal types', async () => {
            
            const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()

            const enginePrincipal: Principal = {
                id: apId(),
                type: PrincipalType.ENGINE,
                projectId: mockProject.id,
                platform: {
                    id: mockPlatform.id,
                },
            }

            const workerPrincipal: Principal = {
                id: apId(),
                type: PrincipalType.WORKER,
            }

            const security: AuthorizationRouteSecurity = {
                kind: RouteKind.AUTHENTICATED,
                authorization: {
                    type: AuthorizationType.UNSCOPED,
                    allowedPrincipals: [PrincipalType.ENGINE, PrincipalType.WORKER],
                },
            }

            await expect(authorizeOrThrow(enginePrincipal, security, mockLog)).resolves.toBeUndefined()
            await expect(authorizeOrThrow(workerPrincipal, security, mockLog)).resolves.toBeUndefined()
        })
    })
})
