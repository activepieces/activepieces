import {
    ActivepiecesError,
    ErrorCode,
    Principal,
    PrincipalType,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { nanoid } from 'nanoid'
import { authenticateOrThrow } from '../../../../src/app/core/security/v2/authn/authenticate'
import { initializeDatabase } from '../../../../src/app/database'
import { databaseConnection } from '../../../../src/app/database/database-connection'
import { setupServer } from '../../../../src/app/server'
import { generateMockToken } from '../../../helpers/auth'
import {
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

describe('authenticateOrThrow', () => {
    describe('API Key Authentication', () => {
        it('should authenticate with valid API key', async () => {
            
            const { mockPlatform, mockApiKey } = await mockAndSaveBasicSetupWithApiKey()

            const principal = await authenticateOrThrow(`Bearer ${mockApiKey.value}`)

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

            await expect(authenticateOrThrow(`Bearer ${invalidApiKey}`))
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

            const principal = await authenticateOrThrow(`Bearer ${mockAccessToken}`)

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

            await expect(authenticateOrThrow(`Bearer ${invalidAccessToken}`))
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

            await databaseConnection().getRepository('user_identity').update(mockUserIdentity.id, {
                tokenVersion: nanoid(),
            })

            await expect(authenticateOrThrow(`Bearer ${mockAccessToken}`))
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
            const principal = await authenticateOrThrow(null)

            expect(principal.type).toBe(PrincipalType.UNKNOWN)
            expect(principal.id).toBeDefined()
        })

        it('should return UNKNOWN principal when empty string is provided', async () => {
            const principal = await authenticateOrThrow('')

            expect(principal.type).toBe(PrincipalType.UNKNOWN)
            expect(principal.id).toBeDefined()
        })
    })
})
