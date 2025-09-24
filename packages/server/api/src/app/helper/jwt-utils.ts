import { randomBytes } from 'crypto'
import { promisify } from 'util'
import { AppSystemProp } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ErrorCode,
    isNil,
    spreadIfDefined,
} from '@activepieces/shared'
import { Mutex } from 'async-mutex'
import jwtLibrary, {
    DecodeOptions,
    SignOptions,
    VerifyOptions,
} from 'jsonwebtoken'
import { redisConnections } from '../database/redis'
import { localFileStore } from './local-store'
import { RedisType, system } from './system/system'

export enum JwtSignAlgorithm {
    HS256 = 'HS256',
    RS256 = 'RS256',
}

const ONE_WEEK = 7 * 24 * 3600
const KEY_ID = '1'
const ISSUER = 'activepieces'
const ALGORITHM = JwtSignAlgorithm.HS256

const redisType = redisConnections.getRedisType()

export const jwtUtils = {
    async sign({
        payload,
        key,
        expiresInSeconds = ONE_WEEK,
        keyId = KEY_ID,
        algorithm = ALGORITHM,
    }: SignParams): Promise<string> {
        const signOptions: SignOptions = {
            algorithm,
            keyid: keyId,
            expiresIn: expiresInSeconds,
            issuer: ISSUER,
        }
        return new Promise((resolve, reject) => {
            jwtLibrary.sign(payload, key, signOptions, (err, token) => {
                if (err) {
                    return reject(err)
                }

                if (isNil(token)) {
                    return reject(
                        new ActivepiecesError({
                            code: ErrorCode.INVALID_BEARER_TOKEN,
                            params: {},
                        }),
                    )
                }

                return resolve(token)
            })
        })
    },
    getJwtSecret: async (): Promise<string> => {
        const secret = system.get(AppSystemProp.JWT_SECRET) ?? null
        if (!isNil(secret)) {
            return secret
        }
        if (redisType === RedisType.MEMORY) {
            return getOrGenerateAndStoreSecret()
        }
        throw new ActivepiecesError(
            {
                code: ErrorCode.SYSTEM_PROP_INVALID,
                params: {
                    prop: AppSystemProp.JWT_SECRET,
                },
            },
            `System property AP_${AppSystemProp.JWT_SECRET} must be defined`,
        )
    },
    async decodeAndVerify<T>({ jwt, key, algorithm = ALGORITHM, issuer = ISSUER, audience }: VerifyParams): Promise<T> {
        const verifyOptions: VerifyOptions = {
            algorithms: [algorithm],
            ...spreadIfDefined('issuer', issuer),
            ...spreadIfDefined('audience', audience),
        }

        return new Promise((resolve, reject) => {
            jwtLibrary.verify(jwt, key, verifyOptions, async (err, payload) => {
                if (err) {
                    return reject(err)
                }
                return resolve(payload as T)
            })
        })
    },

    decode<T>({ jwt }: DecodeParams): DecodedJwt<T> {
        const decodeOptions: DecodeOptions = {
            complete: true,
        }

        return jwtLibrary.decode(jwt, decodeOptions) as DecodedJwt<T>
    },
}

const mutexLock = new Mutex()

const getOrGenerateAndStoreSecret = async (): Promise<string> => {
    return mutexLock.runExclusive(async () => {
        const currentSecret = await localFileStore.load(AppSystemProp.JWT_SECRET)
        if (!isNil(currentSecret)) {
            return currentSecret
        }
        const secretLengthInBytes = 32
        const secretBuffer = await promisify(randomBytes)(secretLengthInBytes)
        const secret = secretBuffer.toString('base64')
        await localFileStore.save(AppSystemProp.JWT_SECRET, secret)
        return secret
    })
}

type SignParams = {
    payload: Record<string, unknown>
    key: string
    expiresInSeconds?: number
    algorithm?: JwtSignAlgorithm
    keyId?: string
}

type VerifyParams = {
    jwt: string
    key: string
    algorithm?: JwtSignAlgorithm
    issuer?: string | string[] | null
    audience?: string
}

type DecodeParams = {
    jwt: string
}

type DecodedJwt<T> = {
    header: {
        alg: string
        typ: string
        kid: string
    }
    payload: T
    signature: string
}
