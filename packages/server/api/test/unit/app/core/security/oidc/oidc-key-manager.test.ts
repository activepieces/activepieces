import { generateKeyPairSync } from 'crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RedisType } from '../../../../../../src/app/database/redis/types'

const { mockLocalFileStoreLoad, mockLocalFileStoreSave } = vi.hoisted(() => ({
    mockLocalFileStoreLoad: vi.fn(),
    mockLocalFileStoreSave: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../../../../../src/app/helper/local-store', () => ({
    localFileStore: {
        load: mockLocalFileStoreLoad,
        save: mockLocalFileStoreSave,
    },
}))

describe('oidcKeyManager', () => {
    beforeEach(() => {
        vi.resetModules()
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('getPrivateKeyPem', () => {
        it('should load private key from env variable when set', async () => {
            const { privateKey } = generateKeyPairSync('rsa', {
                modulusLength: 2048,
                privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
                publicKeyEncoding: { type: 'spki', format: 'pem' },
            })
            const base64Key = Buffer.from(privateKey).toString('base64')

            vi.doMock('../../../../../../src/app/helper/system/system', () => ({
                system: { get: vi.fn().mockReturnValue(base64Key) },
            }))
            vi.doMock('../../../../../../src/app/database/redis-connections', () => ({
                redisConnections: { getRedisType: vi.fn().mockReturnValue(RedisType.MEMORY) },
            }))

            const { oidcKeyManager } = await import('../../../../../../src/app/core/security/oidc/oidc-key-manager')
            const result = await oidcKeyManager.getPrivateKeyPem()

            expect(result).toBe(privateKey)
        })

        it('should throw when env var is not set and redis is not MEMORY', async () => {
            vi.doMock('../../../../../../src/app/helper/system/system', () => ({
                system: { get: vi.fn().mockReturnValue(undefined) },
            }))
            vi.doMock('../../../../../../src/app/database/redis-connections', () => ({
                redisConnections: { getRedisType: vi.fn().mockReturnValue(RedisType.REDIS) },
            }))

            const { oidcKeyManager } = await import('../../../../../../src/app/core/security/oidc/oidc-key-manager')
            await expect(oidcKeyManager.getPrivateKeyPem()).rejects.toMatchObject({
                error: { code: 'SYSTEM_PROP_INVALID' },
            })
        })

        it('should load persisted key from local store when env var is not set and redis is MEMORY', async () => {
            const { privateKey } = generateKeyPairSync('rsa', {
                modulusLength: 2048,
                privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
                publicKeyEncoding: { type: 'spki', format: 'pem' },
            })
            const base64Key = Buffer.from(privateKey).toString('base64')

            vi.doMock('../../../../../../src/app/helper/system/system', () => ({
                system: { get: vi.fn().mockReturnValue(undefined) },
            }))
            vi.doMock('../../../../../../src/app/database/redis-connections', () => ({
                redisConnections: { getRedisType: vi.fn().mockReturnValue(RedisType.MEMORY) },
            }))
            mockLocalFileStoreLoad.mockResolvedValue(base64Key)

            const { oidcKeyManager } = await import('../../../../../../src/app/core/security/oidc/oidc-key-manager')
            const result = await oidcKeyManager.getPrivateKeyPem()

            expect(result).toBe(privateKey)
        })

        it('should generate a new RSA key pair and persist it when no key exists', async () => {
            vi.doMock('../../../../../../src/app/helper/system/system', () => ({
                system: { get: vi.fn().mockReturnValue(undefined) },
            }))
            vi.doMock('../../../../../../src/app/database/redis-connections', () => ({
                redisConnections: { getRedisType: vi.fn().mockReturnValue(RedisType.MEMORY) },
            }))
            mockLocalFileStoreLoad.mockResolvedValue(undefined)

            const { oidcKeyManager } = await import('../../../../../../src/app/core/security/oidc/oidc-key-manager')
            const result = await oidcKeyManager.getPrivateKeyPem()

            expect(result).toContain('-----BEGIN PRIVATE KEY-----')
            expect(mockLocalFileStoreSave).toHaveBeenCalledOnce()
        })
    })

    describe('getPublicKeyJwk', () => {
        it('should return a JWK with required OIDC metadata fields', async () => {
            vi.doMock('../../../../../../src/app/helper/system/system', () => ({
                system: { get: vi.fn().mockReturnValue(undefined) },
            }))
            vi.doMock('../../../../../../src/app/database/redis-connections', () => ({
                redisConnections: { getRedisType: vi.fn().mockReturnValue(RedisType.MEMORY) },
            }))
            mockLocalFileStoreLoad.mockResolvedValue(undefined)

            const { oidcKeyManager } = await import('../../../../../../src/app/core/security/oidc/oidc-key-manager')
            const jwk = await oidcKeyManager.getPublicKeyJwk()

            expect(jwk.kty).toBe('RSA')
            expect(jwk.use).toBe('sig')
            expect(jwk.alg).toBe('RS256')
            expect(jwk.kid).toBe(await oidcKeyManager.getKid())
            expect(jwk.n).toBeDefined()
            expect(jwk.e).toBeDefined()
        })

        it('should not include private key material in the JWK', async () => {
            vi.doMock('../../../../../../src/app/helper/system/system', () => ({
                system: { get: vi.fn().mockReturnValue(undefined) },
            }))
            vi.doMock('../../../../../../src/app/database/redis-connections', () => ({
                redisConnections: { getRedisType: vi.fn().mockReturnValue(RedisType.MEMORY) },
            }))
            mockLocalFileStoreLoad.mockResolvedValue(undefined)

            const { oidcKeyManager } = await import('../../../../../../src/app/core/security/oidc/oidc-key-manager')
            const jwk = await oidcKeyManager.getPublicKeyJwk()

            expect(jwk.d).toBeUndefined()
            expect(jwk.p).toBeUndefined()
            expect(jwk.q).toBeUndefined()
        })
    })
})
