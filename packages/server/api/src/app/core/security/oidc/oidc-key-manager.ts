import { createHash, createPrivateKey, createPublicKey, generateKeyPair, JsonWebKey } from 'crypto'
import { promisify } from 'util'
import { ActivepiecesError, ErrorCode, isNil } from '@activepieces/core-utils'
import { Mutex } from 'async-mutex'
import dayjs from 'dayjs'
import { FlagEntity } from '../../../flags/flag.entity'
import { EncryptedObject, encryptUtils } from '../../../helper/encryption'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { repoFactory } from '../../db/repo-factory'

const generateKeyPairAsync = promisify(generateKeyPair)
const flagRepo = repoFactory(FlagEntity)
const OIDC_PRIVATE_KEY_FLAG_ID = 'OIDC_RSA_PRIVATE_KEY'

const privateKeyMutex = new Mutex()
const publicKeyMutex = new Mutex()
let cachedPrivateKeyPem: string | undefined
let cachedPublicKeyJwk: OidcJwk | undefined

async function getPrivateKeyPem(): Promise<string> {
    if (cachedPrivateKeyPem !== undefined) return cachedPrivateKeyPem
    return privateKeyMutex.runExclusive(async () => {
        if (cachedPrivateKeyPem !== undefined) return cachedPrivateKeyPem
        const envKey = system.get(AppSystemProp.OIDC_RSA_PRIVATE_KEY)
        if (envKey) {
            cachedPrivateKeyPem = parseEnvPrivateKey(envKey)
            return cachedPrivateKeyPem
        }
        cachedPrivateKeyPem = await getOrGenerateStoredPrivateKey()
        return cachedPrivateKeyPem
    })
}

async function getPublicKeyJwk(): Promise<OidcJwk> {
    if (cachedPublicKeyJwk !== undefined) return cachedPublicKeyJwk
    return publicKeyMutex.runExclusive(async () => {
        if (cachedPublicKeyJwk !== undefined) return cachedPublicKeyJwk
        const privateKeyPem = await getPrivateKeyPem()
        const publicKey = createPublicKey(privateKeyPem)
        const jwk = publicKey.export({ format: 'jwk' })
        const kid = computeKidFromJwk(jwk)
        cachedPublicKeyJwk = { ...jwk, use: 'sig', alg: 'RS256', kid }
        return cachedPublicKeyJwk
    })
}

async function getKid(): Promise<string> {
    return (await getPublicKeyJwk()).kid
}

function parseEnvPrivateKey(envKey: string): string {
    const pem = Buffer.from(envKey, 'base64').toString('utf8')
    try {
        createPrivateKey(pem)
    }
    catch {
        throw new ActivepiecesError(
            { code: ErrorCode.SYSTEM_PROP_INVALID, params: { prop: AppSystemProp.OIDC_RSA_PRIVATE_KEY } },
            `System property AP_${AppSystemProp.OIDC_RSA_PRIVATE_KEY} is not a valid RSA private key PEM`,
        )
    }
    return pem
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
    const now = dayjs().toISOString()
    await flagRepo()
        .createQueryBuilder()
        .insert()
        .values({ id: OIDC_PRIVATE_KEY_FLAG_ID, value: encrypted, created: now, updated: now })
        .orIgnore()
        .execute()
    const stored = await loadStoredPrivateKey()
    return stored ?? privateKey
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

export const oidcKeyManager = {
    getPrivateKeyPem,
    getPublicKeyJwk,
    getKid,
}
