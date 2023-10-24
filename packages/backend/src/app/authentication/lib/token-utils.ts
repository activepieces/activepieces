import { randomBytes } from 'node:crypto'
import { promisify } from 'node:util'
import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken'
import { Principal, isNil } from '@activepieces/shared'
import { ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { QueueMode, system } from '../../helper/system/system'
import { SystemProp } from '../../helper/system/system-prop'
import { localFileStore } from '../../helper/store'

const ALGORITHM = 'HS256'
const KEY_ID = '1'
const EXPIRES_IN_SECONDS = 7 * 24 * 3600
const ISSUER = 'activepieces'

let secret: string | null = null
const queueMode: QueueMode = system.getOrThrow<QueueMode>(SystemProp.QUEUE_MODE)

const getSecret = async (): Promise<string> => {
    if (secret !== null) {
        return secret
    }
    secret = system.get(SystemProp.JWT_SECRET) ?? null

    if (queueMode === QueueMode.MEMORY) {
        if (isNil(secret)) {
            secret = await getSecretFromStore()
        }
        if (isNil(secret)) {
            secret = await generateAndStoreSecret()
        }
    }
    if (isNil(secret)) {
        throw new ActivepiecesError({
            code: ErrorCode.SYSTEM_PROP_INVALID,
            params: {
                prop: SystemProp.JWT_SECRET,
            },
        }, `System property AP_${SystemProp.JWT_SECRET} must be defined`)
    }
    return secret
}

const getSecretFromStore = async (): Promise<string | null> => {
    return await localFileStore.load(SystemProp.JWT_SECRET)
}

const generateAndStoreSecret = async (): Promise<string> => {
    const secretLengthInBytes = 32
    const secretBuffer = await promisify(randomBytes)(secretLengthInBytes)
    const secret = secretBuffer.toString('base64')
    await localFileStore.save(SystemProp.JWT_SECRET, secret)
    return secret
}

export const tokenUtils = {
    encode: async (principal: Principal): Promise<string> => {
        const secret = await getSecret()

        const signOptions: SignOptions = {
            algorithm: ALGORITHM,
            keyid: KEY_ID,
            expiresIn: EXPIRES_IN_SECONDS,
            issuer: ISSUER,
        }

        return await new Promise((resolve, reject) => {
            jwt.sign(principal, secret, signOptions, (err, token) => {
                if (err != null) {
                    return reject(err)
                }
                if (token === undefined) {
                    reject(
                        new ActivepiecesError({
                            code: ErrorCode.INVALID_BEARER_TOKEN,
                            params: {},
                        }),
                    )
                }
                else {
                    resolve(token)
                }
            })
        })
    },

    decode: async (token: string): Promise<Principal> => {
        const secret = await getSecret()

        const verifyOptions: VerifyOptions = {
            algorithms: [ALGORITHM],
            issuer: ISSUER,
        }

        try {
            return await new Promise((resolve, reject) => {
                jwt.verify(token, secret, verifyOptions, (err, payload) => {
                    if (err != null) {
                        return reject(err)
                    }

                    resolve(payload as Principal)
                })
            })
        }
        catch (e) {
            throw new ActivepiecesError({ code: ErrorCode.INVALID_BEARER_TOKEN, params: {} })
        }
    },
}
