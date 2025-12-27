import { AuthorizationRouteSecurity, AuthorizationType, RouteKind } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    apId,
    DefaultProjectRole,
    ErrorCode,
    Permission,
    PlatformRole,
    Principal,
    PrincipalType,
    RoleType,
} from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { authorizeOrThrow } from '../../../../src/app/core/security/v2/authz/authorize'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupServer } from '../../../../src/app/server'
import {
    createMockProjectMember,
    createMockProjectRole,
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
})

describe('authorizeOrThrow', () => {
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

    describe('PROJECT authorization', () => {
        it('should allow USER with project access', async () => {
            
            const { mockOwner, mockPlatform, mockProject } = await mockAndSaveBasicSetup()

            const projectRole = await databaseConnection()
                .getRepository('project_role')
                .findOneByOrFail({ name: DefaultProjectRole.ADMIN })

            const mockProjectMember = createMockProjectMember({
                userId: mockOwner.id,
                platformId: mockPlatform.id,
                projectId: mockProject.id,
                projectRoleId: projectRole.id,
            })
            await databaseConnection().getRepository('project_member').save(mockProjectMember)

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
                    type: AuthorizationType.PROJECT,
                    allowedPrincipals: [PrincipalType.USER],
                    projectId: mockProject.id,
                    permission: Permission.READ_FLOW,
                },
            }

            await expect(authorizeOrThrow(principal, security, mockLog)).resolves.toBeUndefined()
        })

        it('should reject when projectId is nil', async () => {

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
                    type: AuthorizationType.PROJECT,
                    allowedPrincipals: [PrincipalType.USER],
                    projectId: undefined,
                    permission: Permission.READ_FLOW,
                },
            }

            await expect(authorizeOrThrow(principal, security, mockLog)).rejects.toEqual(
                new ActivepiecesError({
                    code: ErrorCode.AUTHORIZATION,
                    params: {
                        message: 'Project ID is required',
                    },
                }),
            )
        })

        it('should allow SERVICE principal with access to project platform', async () => {
            
            const { mockPlatform, mockProject, mockApiKey } = await mockAndSaveBasicSetupWithApiKey()

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
                    type: AuthorizationType.PROJECT,
                    allowedPrincipals: [PrincipalType.SERVICE],
                    projectId: mockProject.id,
                    permission: Permission.READ_FLOW,
                },
            }

            await expect(authorizeOrThrow(principal, security, mockLog)).resolves.toBeUndefined()
        })

        it('should reject SERVICE principal accessing project from different platform', async () => {
            
            const { mockApiKey, mockPlatform } = await mockAndSaveBasicSetupWithApiKey()
            const { mockProject: otherProject } = await mockAndSaveBasicSetup()

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
                    type: AuthorizationType.PROJECT,
                    allowedPrincipals: [PrincipalType.SERVICE],
                    projectId: otherProject.id,
                    permission: Permission.READ_FLOW,
                },
            }

            await expect(authorizeOrThrow(principal, security, mockLog)).rejects.toEqual(
                new ActivepiecesError({
                    code: ErrorCode.AUTHORIZATION,
                    params: expect.objectContaining({
                        message: 'Service is not allowed to access this project',
                    }),
                }),
            )
        })

        it('should reject principal not in allowedPrincipals for PROJECT', async () => {
            
            const { mockOwner, mockPlatform, mockProject } = await mockAndSaveBasicSetup()

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
                    type: AuthorizationType.PROJECT,
                    allowedPrincipals: [PrincipalType.SERVICE], // USER not allowed
                    projectId: mockProject.id,
                    permission: Permission.READ_FLOW,
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

        it('should allow ENGINE principal accessing its own project', async () => {
            
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
                    type: AuthorizationType.PROJECT,
                    allowedPrincipals: [PrincipalType.ENGINE],
                    projectId: mockProject.id,
                    permission: Permission.READ_FLOW,
                },
            }

            await expect(authorizeOrThrow(principal, security, mockLog)).resolves.toBeUndefined()
        })

        it('should reject ENGINE principal accessing different project', async () => {
            
            const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()
            const { mockProject: otherProject } = await mockAndSaveBasicSetup()

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
                    type: AuthorizationType.PROJECT,
                    allowedPrincipals: [PrincipalType.ENGINE],
                    projectId: otherProject.id,
                    permission: Permission.READ_FLOW,
                },
            }

            await expect(authorizeOrThrow(principal, security, mockLog)).rejects.toEqual(
                new ActivepiecesError({
                    code: ErrorCode.AUTHORIZATION,
                    params: expect.objectContaining({
                        message: 'Engine is not allowed to access this project',
                    }),
                }),
            )
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
    
    describe('RBAC permission checks', () => {
        it('should reject user without required permission', async () => {
            
            const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()
            const { mockUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })

            // Create a role with only READ_FLOW permission
            const viewerRole = await databaseConnection()
                .getRepository('project_role')
                .findOneByOrFail({ name: DefaultProjectRole.VIEWER })

            const mockProjectMember = createMockProjectMember({
                userId: mockUser.id,
                platformId: mockPlatform.id,
                projectId: mockProject.id,
                projectRoleId: viewerRole.id,
            })
            await databaseConnection().getRepository('project_member').save(mockProjectMember)

            const principal: Principal = {
                id: mockUser.id,
                type: PrincipalType.USER,
                
                platform: {
                    id: mockPlatform.id,
                },
            }
            const security: AuthorizationRouteSecurity = {
                kind: RouteKind.AUTHENTICATED,
                authorization: {
                    type: AuthorizationType.PROJECT,
                    allowedPrincipals: [PrincipalType.USER],
                    projectId: mockProject.id,
                    permission: Permission.WRITE_FLOW, // VIEWER doesn't have WRITE_FLOW
                },
            }

            await expect(authorizeOrThrow(principal, security, mockLog)).rejects.toEqual(
                new ActivepiecesError({
                    code: ErrorCode.PERMISSION_DENIED,
                    params: expect.objectContaining({
                        userId: mockUser.id,
                        projectId: mockProject.id,
                        permission: Permission.WRITE_FLOW,
                    }),
                }),
            )
        })

        it('should reject user with no role in project', async () => {
            
            const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()
            const { mockUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })

            // No project member created for this user

            const principal: Principal = {
                id: mockUser.id,
                type: PrincipalType.USER,
                
                platform: {
                    id: mockPlatform.id,
                },
            }
            const security: AuthorizationRouteSecurity = {
                kind: RouteKind.AUTHENTICATED,
                authorization: {
                    type: AuthorizationType.PROJECT,
                    allowedPrincipals: [PrincipalType.USER],
                    projectId: mockProject.id,
                    permission: Permission.READ_FLOW,
                },
            }

            await expect(authorizeOrThrow(principal, security, mockLog)).rejects.toEqual(
                new ActivepiecesError({
                    code: ErrorCode.AUTHORIZATION,
                    params: expect.objectContaining({
                        message: 'No role found for the user',
                    }),
                }),
            )
        })

        it('should allow user with custom role having required permission', async () => {
            
            const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()
            const { mockUser } = await mockBasicUser({
                user: {
                    platformId: mockPlatform.id,
                    platformRole: PlatformRole.MEMBER,
                },
            })

            // Create a custom role with specific permission
            const customRole = createMockProjectRole({
                platformId: mockPlatform.id,
                type: RoleType.CUSTOM,
                permissions: [Permission.READ_FLOW, Permission.WRITE_FLOW],
            })
            await databaseConnection().getRepository('project_role').save(customRole)

            const mockProjectMember = createMockProjectMember({
                userId: mockUser.id,
                platformId: mockPlatform.id,
                projectId: mockProject.id,
                projectRoleId: customRole.id,
            })
            await databaseConnection().getRepository('project_member').save(mockProjectMember)

            const principal: Principal = {
                id: mockUser.id,
                type: PrincipalType.USER,
                
                platform: {
                    id: mockPlatform.id,
                },
            }
            const security: AuthorizationRouteSecurity = {
                kind: RouteKind.AUTHENTICATED,
                authorization: {
                    type: AuthorizationType.PROJECT,
                    allowedPrincipals: [PrincipalType.USER],
                    projectId: mockProject.id,
                    permission: Permission.WRITE_FLOW,
                },
            }

            await expect(authorizeOrThrow(principal, security, mockLog)).resolves.toBeUndefined()
        })
    })
})

