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

const importKeyManager = (): Promise<typeof import('../../../../../../src/app/core/security/oidc/oidc-key-manager')> =>
    import('../../../../../../src/app/core/security/oidc/oidc-key-manager')

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
        it('should load the persisted key from the flag store when one already exists', async () => {
            const { privateKey } = generateKeyPairSync('rsa', {
                modulusLength: 2048,
                privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
                publicKeyEncoding: { type: 'spki', format: 'pem' },
            })
            storedFlag.value = { iv: 'test-iv', data: privateKey }

            const { oidcKeyManager } = await importKeyManager()
            const result = await oidcKeyManager.getPrivateKeyPem()

            expect(result).toBe(privateKey)
            expect(mockExecute).not.toHaveBeenCalled()
        })

        it('should generate a new RSA key pair and persist it when no key exists', async () => {
            const { oidcKeyManager } = await importKeyManager()
            const result = await oidcKeyManager.getPrivateKeyPem()

            expect(result).toContain('-----BEGIN PRIVATE KEY-----')
            expect(mockExecute).toHaveBeenCalledOnce()
            expect(mockOrIgnore).toHaveBeenCalledOnce()
        })

        it('should converge on the winner key when another node wins the race between the two reads', async () => {
            const { privateKey: winnerKey } = generateKeyPairSync('rsa', {
                modulusLength: 2048,
                privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
                publicKeyEncoding: { type: 'spki', format: 'pem' },
            })
            // First read finds no key, so this node generates one; a competing node then
            // persists the winner before this node's INSERT runs, so the INSERT is a no-op
            // (ON CONFLICT DO NOTHING) and the second read returns the winner.
            mockFindOneBy.mockImplementationOnce(async () => {
                storedFlag.value = { iv: 'test-iv', data: winnerKey }
                return null
            })

            const { oidcKeyManager } = await importKeyManager()
            const result = await oidcKeyManager.getPrivateKeyPem()

            expect(mockExecute).toHaveBeenCalledOnce()
            expect(result).toBe(winnerKey)
        })

        it('should throw rather than sign with an unpersisted key if the post-insert read returns nothing', async () => {
            // both the pre-generate read and the post-insert read return null (DB inconsistency)
            mockFindOneBy.mockImplementationOnce(async () => null).mockImplementationOnce(async () => null)

            const { oidcKeyManager } = await importKeyManager()
            await expect(oidcKeyManager.getPrivateKeyPem()).rejects.toMatchObject({
                error: { code: 'GENERIC_ERROR' },
            })
        })
    })

    describe('getPublicKeyJwk', () => {
        it('should return a JWK with required OIDC metadata fields', async () => {
            const { oidcKeyManager } = await importKeyManager()
            const jwk = await oidcKeyManager.getPublicKeyJwk()

            expect(jwk.kty).toBe('RSA')
            expect(jwk.use).toBe('sig')
            expect(jwk.alg).toBe('RS256')
            expect(jwk.kid).toBe(await oidcKeyManager.getKid())
            expect(jwk.n).toBeDefined()
            expect(jwk.e).toBeDefined()
        })

        it('should not include private key material in the JWK', async () => {
            const { oidcKeyManager } = await importKeyManager()
            const jwk = await oidcKeyManager.getPublicKeyJwk()

            expect(jwk.d).toBeUndefined()
            expect(jwk.p).toBeUndefined()
            expect(jwk.q).toBeUndefined()
        })
    })
})
