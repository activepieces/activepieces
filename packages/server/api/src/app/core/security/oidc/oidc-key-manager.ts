import { createPublicKey, generateKeyPairSync, JsonWebKey } from 'crypto'
import { ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { Mutex } from 'async-mutex'
import { RedisType } from '../../../database/redis/types'
import { redisConnections } from '../../../database/redis-connections'
import { localFileStore } from '../../../helper/local-store'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'

const OIDC_KID = 'oidc-2'
const mutex = new Mutex()
let cachedPrivateKeyPem: string | undefined
type OidcJwk = JsonWebKey & { use: string, alg: string, kid: string }
let cachedPublicKeyJwk: OidcJwk | undefined

async function getPrivateKeyPem(): Promise<string> {
    if (cachedPrivateKeyPem !== undefined) return cachedPrivateKeyPem
    return mutex.runExclusive(async () => {
        if (cachedPrivateKeyPem !== undefined) return cachedPrivateKeyPem
        const envKey = system.get(AppSystemProp.OIDC_RSA_PRIVATE_KEY)
        if (envKey) {
            cachedPrivateKeyPem = Buffer.from(envKey, 'base64').toString('utf8')
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
        const { privateKey } = generateKeyPairSync('rsa', {
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
    const privateKeyPem = await getPrivateKeyPem()
    const publicKey = createPublicKey(privateKeyPem)
    const jwk = publicKey.export({ format: 'jwk' })
    cachedPublicKeyJwk = { ...jwk, use: 'sig', alg: 'RS256', kid: OIDC_KID }
    return cachedPublicKeyJwk
}

export const oidcKeyManager = {
    getPrivateKeyPem,
    getPublicKeyJwk,
    kid: OIDC_KID,
}
