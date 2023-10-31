import { ActivepiecesError, ErrorCode, isNil } from '@activepieces/shared'
import jwtLibrary, { SignOptions, VerifyOptions } from 'jsonwebtoken'

enum JwtSignAlgorithm {
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

    async verify<T>({ jwt, key, algorithm = ALGORITHM, issuer = ISSUER }: VerifyParams): Promise<T> {
        const verifyOptions: VerifyOptions = {
            algorithms: [algorithm],
            issuer,
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
    issuer?: string
}
