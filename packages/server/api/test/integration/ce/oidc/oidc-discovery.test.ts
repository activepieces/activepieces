import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('OIDC Discovery', () => {
    describe('GET /.well-known/openid-configuration', () => {
        it('should return a valid OIDC discovery document', async () => {
            const response = await app!.inject({
                method: 'GET',
                url: '/.well-known/openid-configuration',
            })

            expect(response.statusCode).toBe(StatusCodes.OK)
            const body = response.json()
            expect(body.issuer).toBeDefined()
            expect(body.jwks_uri).toBe(`${body.issuer}/.well-known/jwks.json`)
            expect(body.response_types_supported).toEqual(['id_token'])
            expect(body.id_token_signing_alg_values_supported).toEqual(['RS256'])
            expect(body.subject_types_supported).toEqual(['public'])
        })

        it('should include CORS header to allow AWS STS to fetch the document', async () => {
            const response = await app!.inject({
                method: 'GET',
                url: '/.well-known/openid-configuration',
            })

            expect(response.headers['access-control-allow-origin']).toBe('*')
        })

        it('should not require authentication', async () => {
            const response = await app!.inject({
                method: 'GET',
                url: '/.well-known/openid-configuration',
            })

            expect(response.statusCode).toBe(StatusCodes.OK)
        })
    })

    describe('GET /.well-known/jwks.json', () => {
        it('should return a JWKS document with a single RSA public key', async () => {
            const response = await app!.inject({
                method: 'GET',
                url: '/.well-known/jwks.json',
            })

            expect(response.statusCode).toBe(StatusCodes.OK)
            const body = response.json()
            expect(Array.isArray(body.keys)).toBe(true)
            expect(body.keys).toHaveLength(1)
        })

        it('should return a key with required OIDC signing fields', async () => {
            const response = await app!.inject({
                method: 'GET',
                url: '/.well-known/jwks.json',
            })

            const { keys } = response.json()
            const key = keys[0]
            expect(key.kty).toBe('RSA')
            expect(key.use).toBe('sig')
            expect(key.alg).toBe('RS256')
            expect(key.kid).toBeDefined()
            expect(key.n).toBeDefined()
            expect(key.e).toBeDefined()
        })

        it('should not expose private key material', async () => {
            const response = await app!.inject({
                method: 'GET',
                url: '/.well-known/jwks.json',
            })

            const { keys } = response.json()
            const key = keys[0]
            expect(key.d).toBeUndefined()
            expect(key.p).toBeUndefined()
            expect(key.q).toBeUndefined()
        })

        it('should serve the public key at the jwks_uri advertised in the discovery document', async () => {
            const discoveryResponse = await app!.inject({ method: 'GET', url: '/.well-known/openid-configuration' })
            const discovery = discoveryResponse.json()

            const jwksPath = new URL(discovery.jwks_uri).pathname
            const jwksResponse = await app!.inject({ method: 'GET', url: jwksPath })

            expect(jwksResponse.statusCode).toBe(StatusCodes.OK)
            const { keys } = jwksResponse.json()
            expect(keys).toHaveLength(1)
            expect(keys[0].kty).toBe('RSA')
        })

        it('should include CORS header to allow AWS STS to fetch the keys', async () => {
            const response = await app!.inject({
                method: 'GET',
                url: '/.well-known/jwks.json',
            })

            expect(response.headers['access-control-allow-origin']).toBe('*')
        })

        it('should not require authentication', async () => {
            const response = await app!.inject({
                method: 'GET',
                url: '/.well-known/jwks.json',
            })

            expect(response.statusCode).toBe(StatusCodes.OK)
        })
    })
})
