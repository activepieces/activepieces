import { ActivepiecesError, ErrorCode, isNil, spreadIfDefined } from '@activepieces/shared'
import jwtLibrary, { DecodeOptions, SignOptions, VerifyOptions } from 'jsonwebtoken'

export enum JwtSignAlgorithm {
    HS256 = 'HS256',
    RS256 = 'RS256',
}

const ONE_WEEK = 7 * 24 * 3600 * 1000
const KEY_ID = '1'
const ISSUER = 'activepieces'
const ALGORITHM = JwtSignAlgorithm.HS256

export const jwtUtils = {
    async sign({
        payload,
        key,
        expiresInMilliseconds = ONE_WEEK,
        keyId = KEY_ID,
        algorithm = ALGORITHM,
    }: SignParams): Promise<string> {

        const signOptions: SignOptions = {
            algorithm,
            keyid: keyId,
            expiresIn: expiresInMilliseconds,
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

    async decodeAndVerify<T>({ jwt, key, algorithm = ALGORITHM, issuer = ISSUER }: VerifyParams): Promise<T> {
        const verifyOptions: VerifyOptions = {
            algorithms: [algorithm],
            ...spreadIfDefined('issuer', issuer),
        }

        return new Promise((resolve, reject) => {
            jwtLibrary.verify(jwt, key, verifyOptions, (err, payload) => {
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

type SignParams = {
    payload: Record<string, unknown>
    key: string
    expiresInMilliseconds?: number
    algorithm?: JwtSignAlgorithm
    keyId?: string
}

type VerifyParams = {
    jwt: string
    key: string
    algorithm?: JwtSignAlgorithm
    issuer?: string | null
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
