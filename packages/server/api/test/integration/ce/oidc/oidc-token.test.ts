import { apId, PrincipalType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { jwtUtils } from '../../../../src/app/helper/jwt-utils'
import { generateMockToken } from '../../../helpers/auth'
import { mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null
let engineToken: string
let platformId: string
let projectId: string

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

beforeEach(async () => {
    const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()
    platformId = mockPlatform.id
    projectId = mockProject.id
    engineToken = await generateMockToken({
        type: PrincipalType.ENGINE,
        id: apId(),
        projectId,
        platform: { id: platformId },
    })
})

describe('OIDC Token Endpoint', () => {
    describe('POST /v1/worker/oidc-token', () => {
        it('should return a JWT token when called with a valid engine token', async () => {
            const response = await app!.inject({
                method: 'POST',
                url: '/api/v1/worker/oidc-token',
                headers: { authorization: `Bearer ${engineToken}` },
            })

            expect(response.statusCode).toBe(StatusCodes.OK)
            const body = response.json()
            expect(typeof body.token).toBe('string')
            expect(body.token.split('.')).toHaveLength(3)
        })

        it('should reject requests without an authorization header', async () => {
            const response = await app!.inject({
                method: 'POST',
                url: '/api/v1/worker/oidc-token',
            })

            expect(response.statusCode).toBe(StatusCodes.FORBIDDEN)
        })

        it('should reject requests with a user token instead of an engine token', async () => {
            const userToken = await generateMockToken({
                type: PrincipalType.USER,
                id: apId(),
                projectId,
                platform: { id: platformId },
            })

            const response = await app!.inject({
                method: 'POST',
                url: '/api/v1/worker/oidc-token',
                headers: { authorization: `Bearer ${userToken}` },
            })

            expect(response.statusCode).toBe(StatusCodes.UNAUTHORIZED)
        })

        it('should issue a JWT with the correct audience for AWS STS', async () => {
            const response = await app!.inject({
                method: 'POST',
                url: '/api/v1/worker/oidc-token',
                headers: { authorization: `Bearer ${engineToken}` },
            })

            const { token } = response.json()
            const decoded = jwtUtils.decode<{ aud: string, sub: string, iss: string }>({ jwt: token })

            expect(decoded.payload.aud).toBe('sts.amazonaws.com')
        })

        it('should include platform and project in the sub claim', async () => {
            const response = await app!.inject({
                method: 'POST',
                url: '/api/v1/worker/oidc-token',
                headers: { authorization: `Bearer ${engineToken}` },
            })

            const { token } = response.json()
            const decoded = jwtUtils.decode<{ sub: string }>({ jwt: token })

            expect(decoded.payload.sub).toMatch(/^platform:.+:project:.+$/)
            expect(decoded.payload.sub).toContain(platformId)
            expect(decoded.payload.sub).toContain(projectId)
        })

        it('should use RS256 as the signing algorithm', async () => {
            const response = await app!.inject({
                method: 'POST',
                url: '/api/v1/worker/oidc-token',
                headers: { authorization: `Bearer ${engineToken}` },
            })

            const { token } = response.json()
            const decoded = jwtUtils.decode<Record<string, unknown>>({ jwt: token })

            expect(decoded.header.alg).toBe('RS256')
        })

        it('should set a 1-hour expiration on the token', async () => {
            const before = Math.floor(Date.now() / 1000)

            const response = await app!.inject({
                method: 'POST',
                url: '/api/v1/worker/oidc-token',
                headers: { authorization: `Bearer ${engineToken}` },
            })

            const after = Math.floor(Date.now() / 1000)
            const { token } = response.json()
            const decoded = jwtUtils.decode<{ iat: number, exp: number }>({ jwt: token })

            expect(decoded.payload.iat).toBeGreaterThanOrEqual(before)
            expect(decoded.payload.iat).toBeLessThanOrEqual(after)
            expect(decoded.payload.exp - decoded.payload.iat).toBe(3600)
        })

        it('should include a kid header matching the JWKS endpoint', async () => {
            const [tokenResponse, jwksResponse] = await Promise.all([
                app!.inject({
                    method: 'POST',
                    url: '/api/v1/worker/oidc-token',
                    headers: { authorization: `Bearer ${engineToken}` },
                }),
                app!.inject({ method: 'GET', url: '/.well-known/jwks.json' }),
            ])

            const { token } = tokenResponse.json()
            const decoded = jwtUtils.decode<Record<string, unknown>>({ jwt: token })
            const jwks = jwksResponse.json()

            expect(decoded.header.kid).toBe(jwks.keys[0].kid)
        })
    })
})
