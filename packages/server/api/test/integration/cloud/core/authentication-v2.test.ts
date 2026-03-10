import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'
import {
    ActivepiecesError,
    ErrorCode,
    Principal,
    PrincipalType,
} from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { nanoid } from 'nanoid'
import { authenticateOrThrow } from '../../../../src/app/core/security/v2/authn/authenticate'
import { generateMockToken, generateToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import {
    mockAndSaveBasicSetup,
    mockAndSaveBasicSetupWithApiKey,
} from '../../../helpers/mocks'

let app: FastifyInstance | null = null
let log: FastifyBaseLogger

beforeAll(async () => {
    app = await setupTestEnvironment()
    log = app!.log
})

afterAll(async () => {
    await teardownTestEnvironment()
})
describe('authenticateOrThrow', () => {
    describe('API Key Authentication', () => {
        it('should authenticate with valid API key', async () => {
            
            const { mockPlatform, mockApiKey } = await mockAndSaveBasicSetupWithApiKey()

            const principal = await authenticateOrThrow(log,`Bearer ${mockApiKey.value}`)

            expect(principal).toEqual({
                id: mockApiKey.id,
                type: PrincipalType.SERVICE,
                platform: {
                    id: mockPlatform.id,
                },
            })
        })

        it('should throw AUTHENTICATION error for invalid API key', async () => {
            
            const invalidApiKey = 'sk-invalid-api-key'

            await expect(authenticateOrThrow(log,`Bearer ${invalidApiKey}`))
                .rejects.toEqual(
                    new ActivepiecesError({
                        code: ErrorCode.AUTHENTICATION,
                        params: {
                            message: 'invalid api key',
                        },
                    }),
                )
        })
    })

    describe('Access Token Authentication', () => {
        it('should authenticate with valid access token', async () => {

            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup()

            const mockPrincipal: Principal = {
                id: mockOwner.id,
                type: PrincipalType.USER,
                
                platform: {
                    id: mockPlatform.id,
                },
            }

            const mockAccessToken = await generateMockToken(mockPrincipal)

            const principal = await authenticateOrThrow(log,`Bearer ${mockAccessToken}`)

            expect(principal).toEqual(
                expect.objectContaining({
                    id: mockOwner.id,
                    type: PrincipalType.USER,
                    
                    platform: {
                        id: mockPlatform.id,
                    },
                }),
            )
        })

        it('should throw INVALID_BEARER_TOKEN error for invalid access token', async () => {
            const invalidAccessToken = 'invalid-access-token'

            await expect(authenticateOrThrow(log,`Bearer ${invalidAccessToken}`))
                .rejects.toEqual(
                    new ActivepiecesError({
                        code: ErrorCode.INVALID_BEARER_TOKEN,
                        params: {
                            message: 'invalid access token or session expired',
                        },
                    }),
                )
        })

        it('should throw SESSION_EXPIRED error for expired access token', async () => {
            const { mockOwner, mockPlatform, mockUserIdentity } = await mockAndSaveBasicSetup()

            const mockPrincipal: Principal = {
                id: mockOwner.id,
                type: PrincipalType.USER,
                
                platform: {
                    id: mockPlatform.id,
                },
            }

            const mockAccessToken = await generateMockToken(mockPrincipal)

            await db.update('user_identity', mockUserIdentity.id, {
                tokenVersion: nanoid(),
            })

            await expect(authenticateOrThrow(log,`Bearer ${mockAccessToken}`))
                .rejects.toEqual(
                    new ActivepiecesError({
                        code: ErrorCode.SESSION_EXPIRED,
                        params: {
                            message: 'The session has expired or the user is not verified.',
                        },
                    }),
                )
        })
    })

    describe('Anonymous Authentication', () => {
        it('should return UNKNOWN principal when no token is provided', async () => {
            const principal = await authenticateOrThrow(log,null)

            expect(principal.type).toBe(PrincipalType.UNKNOWN)
            expect(principal.id).toBeDefined()
        })

        it('should return UNKNOWN principal when empty string is provided', async () => {
            const principal = await authenticateOrThrow(log,'')

            expect(principal.type).toBe(PrincipalType.UNKNOWN)
            expect(principal.id).toBeDefined()
        })
    })

    describe('Token Type Routing', () => {
        it('should route OAuth JWT to OAUTH principal', async () => {
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup()

            const oauthToken = generateToken({
                payload: {
                    sub: mockOwner.id,
                    scope: 'mcp:read',
                    platformId: mockPlatform.id,
                    type: PrincipalType.OAUTH,
                },
            })

            const principal = await authenticateOrThrow(log, `Bearer ${oauthToken}`)

            expect(principal).toEqual({
                id: mockOwner.id,
                type: PrincipalType.OAUTH,
                platform: {
                    id: mockPlatform.id,
                },
            })
        })

        it('should route session USER JWT correctly and not treat as OAuth', async () => {
            const { mockOwner, mockPlatform } = await mockAndSaveBasicSetup()

            const mockPrincipal: Principal = {
                id: mockOwner.id,
                type: PrincipalType.USER,
                platform: {
                    id: mockPlatform.id,
                },
            }

            const sessionToken = await generateMockToken(mockPrincipal)
            const principal = await authenticateOrThrow(log, `Bearer ${sessionToken}`)

            expect(principal.type).toBe(PrincipalType.USER)
            expect(principal.id).toBe(mockOwner.id)
        })

        it('should throw INVALID_BEARER_TOKEN for unknown token type', async () => {
            const token = generateToken({
                payload: {
                    type: 'MADE_UP_TYPE',
                    id: nanoid(),
                },
            })

            await expect(authenticateOrThrow(log, `Bearer ${token}`))
                .rejects.toEqual(
                    new ActivepiecesError({
                        code: ErrorCode.INVALID_BEARER_TOKEN,
                        params: {
                            message: 'unknown token type: MADE_UP_TYPE',
                        },
                    }),
                )
        })

        it('should throw INVALID_BEARER_TOKEN for tampered JWT with USER type', async () => {
            const token = generateToken({
                payload: {
                    type: PrincipalType.USER,
                    id: nanoid(),
                },
                key: 'wrong-secret-key',
            })

            await expect(authenticateOrThrow(log, `Bearer ${token}`))
                .rejects.toThrow(ActivepiecesError)

            await expect(authenticateOrThrow(log, `Bearer ${token}`))
                .rejects.toMatchObject({
                    error: expect.objectContaining({
                        code: ErrorCode.INVALID_BEARER_TOKEN,
                    }),
                })
        })

        it('should throw INVALID_BEARER_TOKEN for bad-signature OAuth token with no fallback', async () => {
            const token = generateToken({
                payload: {
                    sub: nanoid(),
                    scope: 'mcp:read',
                    platformId: nanoid(),
                    type: PrincipalType.OAUTH,
                },
                key: 'wrong-secret-key',
            })

            await expect(authenticateOrThrow(log, `Bearer ${token}`))
                .rejects.toEqual(
                    new ActivepiecesError({
                        code: ErrorCode.INVALID_BEARER_TOKEN,
                        params: {
                            message: 'invalid OAuth access token',
                        },
                    }),
                )
        })
    })
})
