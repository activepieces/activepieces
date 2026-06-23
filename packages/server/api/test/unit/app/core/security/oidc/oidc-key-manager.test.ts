import { generateKeyPairSync } from 'crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockFindOneBy, mockExecute, storedFlag } = vi.hoisted(() => {
    const storedFlag: { value: { iv: string, data: string } | null } = { value: null }
    return {
        storedFlag,
        mockFindOneBy: vi.fn(async () => (storedFlag.value === null ? null : { id: 'OIDC_RSA_PRIVATE_KEY', value: storedFlag.value })),
        mockExecute: vi.fn(async () => undefined),
    }
})

const mockOrIgnore = vi.fn((): { execute: typeof mockExecute } => ({ execute: mockExecute }))
const mockValues = vi.fn((row: { value: { iv: string, data: string } }): { orIgnore: typeof mockOrIgnore } => {
    if (storedFlag.value === null) {
        storedFlag.value = row.value
    }
    return { orIgnore: mockOrIgnore }
})
const mockInsert = vi.fn(() => ({ values: mockValues }))
const mockCreateQueryBuilder = vi.fn(() => ({ insert: mockInsert }))

vi.mock('../../../../../../src/app/flags/flag.entity', () => ({
    FlagEntity: {},
}))

vi.mock('../../../../../../src/app/core/db/repo-factory', () => ({
    repoFactory: (): () => { findOneBy: typeof mockFindOneBy, createQueryBuilder: typeof mockCreateQueryBuilder } => () => ({
        findOneBy: mockFindOneBy,
        createQueryBuilder: mockCreateQueryBuilder,
    }),
}))

vi.mock('../../../../../../src/app/helper/encryption', () => ({
    encryptUtils: {
        encryptString: vi.fn(async (input: string) => ({ iv: 'test-iv', data: input })),
        decryptString: vi.fn(async (encrypted: { data: string }) => encrypted.data),
    },
    EncryptedObject: {
        parse: (value: unknown): unknown => value,
    },
}))

describe('oidcKeyManager', () => {
    beforeEach(() => {
        vi.resetModules()
        vi.clearAllMocks()
        storedFlag.value = null
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

            const { oidcKeyManager } = await import('../../../../../../src/app/core/security/oidc/oidc-key-manager')
            const result = await oidcKeyManager.getPrivateKeyPem()

            expect(result).toBe(privateKey)
            expect(mockExecute).not.toHaveBeenCalled()
        })

        it('should throw when env var is set but not a valid RSA private key', async () => {
            vi.doMock('../../../../../../src/app/helper/system/system', () => ({
                system: { get: vi.fn().mockReturnValue(Buffer.from('not-a-key').toString('base64')) },
            }))

            const { oidcKeyManager } = await import('../../../../../../src/app/core/security/oidc/oidc-key-manager')
            await expect(oidcKeyManager.getPrivateKeyPem()).rejects.toMatchObject({
                error: { code: 'SYSTEM_PROP_INVALID' },
            })
        })

        it('should load persisted key from the flag store when env var is not set', async () => {
            const { privateKey } = generateKeyPairSync('rsa', {
                modulusLength: 2048,
                privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
                publicKeyEncoding: { type: 'spki', format: 'pem' },
            })
            storedFlag.value = { iv: 'test-iv', data: privateKey }

            vi.doMock('../../../../../../src/app/helper/system/system', () => ({
                system: { get: vi.fn().mockReturnValue(undefined) },
            }))

            const { oidcKeyManager } = await import('../../../../../../src/app/core/security/oidc/oidc-key-manager')
            const result = await oidcKeyManager.getPrivateKeyPem()

            expect(result).toBe(privateKey)
            expect(mockExecute).not.toHaveBeenCalled()
        })

        it('should generate a new RSA key pair and persist it when no key exists', async () => {
            vi.doMock('../../../../../../src/app/helper/system/system', () => ({
                system: { get: vi.fn().mockReturnValue(undefined) },
            }))

            const { oidcKeyManager } = await import('../../../../../../src/app/core/security/oidc/oidc-key-manager')
            const result = await oidcKeyManager.getPrivateKeyPem()

            expect(result).toContain('-----BEGIN PRIVATE KEY-----')
            expect(mockExecute).toHaveBeenCalledOnce()
            expect(mockOrIgnore).toHaveBeenCalledOnce()
        })

        it('should converge on the persisted key when another node wins the generation race', async () => {
            const { privateKey: winnerKey } = generateKeyPairSync('rsa', {
                modulusLength: 2048,
                privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
                publicKeyEncoding: { type: 'spki', format: 'pem' },
            })
            storedFlag.value = { iv: 'test-iv', data: winnerKey }

            vi.doMock('../../../../../../src/app/helper/system/system', () => ({
                system: { get: vi.fn().mockReturnValue(undefined) },
            }))

            const { oidcKeyManager } = await import('../../../../../../src/app/core/security/oidc/oidc-key-manager')
            const result = await oidcKeyManager.getPrivateKeyPem()

            expect(result).toBe(winnerKey)
        })
    })

    describe('getPublicKeyJwk', () => {
        it('should return a JWK with required OIDC metadata fields', async () => {
            vi.doMock('../../../../../../src/app/helper/system/system', () => ({
                system: { get: vi.fn().mockReturnValue(undefined) },
            }))

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

            const { oidcKeyManager } = await import('../../../../../../src/app/core/security/oidc/oidc-key-manager')
            const jwk = await oidcKeyManager.getPublicKeyJwk()

            expect(jwk.d).toBeUndefined()
            expect(jwk.p).toBeUndefined()
            expect(jwk.q).toBeUndefined()
        })
    })
})
