import { createHash, createPrivateKey, createPublicKey, generateKeyPair, JsonWebKey } from 'crypto'
import { promisify } from 'util'
import { ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { Mutex } from 'async-mutex'
import { RedisType } from '../../../database/redis/types'
import { redisConnections } from '../../../database/redis-connections'
import { localFileStore } from '../../../helper/local-store'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'

const generateKeyPairAsync = promisify(generateKeyPair)

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
            cachedPrivateKeyPem = pem
            return cachedPrivateKeyPem
        }
        if (redisConnections.getRedisType() !== RedisType.MEMORY) {
            throw new ActivepiecesError(
                { code: ErrorCode.SYSTEM_PROP_INVALID, params: { prop: AppSystemProp.OIDC_RSA_PRIVATE_KEY } },
                `System property AP_${AppSystemProp.OIDC_RSA_PRIVATE_KEY} must be defined`,
            )
        }
        const stored = await localFileStore.load(AppSystemProp.OIDC_RSA_PRIVATE_KEY)
        if (stored) {
            cachedPrivateKeyPem = Buffer.from(stored, 'base64').toString('utf8')
            return cachedPrivateKeyPem
        }
        const { privateKey } = await generateKeyPairAsync('rsa', {
            modulusLength: 2048,
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
            publicKeyEncoding: { type: 'spki', format: 'pem' },
        })
        await localFileStore.save(AppSystemProp.OIDC_RSA_PRIVATE_KEY, Buffer.from(privateKey).toString('base64'))
        cachedPrivateKeyPem = privateKey
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
