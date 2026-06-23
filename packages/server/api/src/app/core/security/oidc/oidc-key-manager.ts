import { createHash, createPublicKey, generateKeyPair, JsonWebKey } from 'crypto'
import { promisify } from 'util'
import { ActivepiecesError, ErrorCode, isNil } from '@activepieces/core-utils'
import { Mutex } from 'async-mutex'
import { FlagEntity } from '../../../flags/flag.entity'
import { EncryptedObject, encryptUtils } from '../../../helper/encryption'
import { repoFactory } from '../../db/repo-factory'

const flagRepo = repoFactory(FlagEntity)
const generateKeyPairAsync = promisify(generateKeyPair)
const OIDC_PRIVATE_KEY_FLAG_ID = 'OIDC_RSA_PRIVATE_KEY'

const privateKeyMutex = new Mutex()
const publicKeyMutex = new Mutex()
let cachedPrivateKeyPem: string | undefined
let cachedPublicKeyJwk: OidcJwk | undefined

export const oidcKeyManager = {
    async getPrivateKeyPem(): Promise<string> {
        if (cachedPrivateKeyPem !== undefined) return cachedPrivateKeyPem
        return privateKeyMutex.runExclusive(async () => {
            if (cachedPrivateKeyPem !== undefined) return cachedPrivateKeyPem
            cachedPrivateKeyPem = await getOrGenerateStoredPrivateKey()
            return cachedPrivateKeyPem
        })
    },
    async getPublicKeyJwk(): Promise<OidcJwk> {
        if (cachedPublicKeyJwk !== undefined) return cachedPublicKeyJwk
        return publicKeyMutex.runExclusive(async () => {
            if (cachedPublicKeyJwk !== undefined) return cachedPublicKeyJwk
            const privateKeyPem = await oidcKeyManager.getPrivateKeyPem()
            const publicKey = createPublicKey(privateKeyPem)
            const jwk = publicKey.export({ format: 'jwk' })
            const kid = computeKidFromJwk(jwk)
            cachedPublicKeyJwk = { ...jwk, use: 'sig', alg: 'RS256', kid }
            return cachedPublicKeyJwk
        })
    },
    async getKid(): Promise<string> {
        return (await oidcKeyManager.getPublicKeyJwk()).kid
    },
}

async function getOrGenerateStoredPrivateKey(): Promise<string> {
    const existing = await loadStoredPrivateKey()
    if (!isNil(existing)) {
        return existing
    }
    const { privateKey } = await generateKeyPairAsync('rsa', {
        modulusLength: 2048,
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        publicKeyEncoding: { type: 'spki', format: 'pem' },
    })
    const encrypted = await encryptUtils.encryptString(privateKey)
    const now = new Date().toISOString()
    await flagRepo()
        .createQueryBuilder()
        .insert()
        .values({ id: OIDC_PRIVATE_KEY_FLAG_ID, value: encrypted, created: now, updated: now })
        .orIgnore()
        .execute()
    const stored = await loadStoredPrivateKey()
    if (isNil(stored)) {
        throw new ActivepiecesError({
            code: ErrorCode.GENERIC_ERROR,
            params: { message: 'OIDC signing key could not be persisted to or read back from the flag store' },
        })
    }
    return stored
}

async function loadStoredPrivateKey(): Promise<string | null> {
    const flag = await flagRepo().findOneBy({ id: OIDC_PRIVATE_KEY_FLAG_ID })
    if (isNil(flag)) {
        return null
    }
    const encrypted = EncryptedObject.parse(flag.value)
    return encryptUtils.decryptString(encrypted)
}

function computeKidFromJwk(jwk: JsonWebKey): string {
    // RFC 7638: SHA-256 thumbprint of required RSA members in lexicographic order
    const thumbprintData = JSON.stringify({ e: jwk.e, kty: jwk.kty, n: jwk.n })
    return createHash('sha256').update(thumbprintData).digest('base64url')
}

type OidcJwk = JsonWebKey & { use: string, alg: string, kid: string }
