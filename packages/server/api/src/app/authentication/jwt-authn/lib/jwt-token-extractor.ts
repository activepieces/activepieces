import { ActivepiecesError, ErrorCode, isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { JwtSignAlgorithm, jwtUtils } from '../../../helper/jwt-utils'

const ALGORITHM = JwtSignAlgorithm.HS256

export const jwtTokenExtractor = (log: FastifyBaseLogger) => {
    return {
        async extract(token: string): Promise<ExternalPrincipal> {
            try {
                // For community edition, we'll use a simple JWT secret
                const secret = process.env.AP_JWT_SECRET || 'your-jwt-secret-key'
                
                const payload = await jwtUtils.decodeAndVerify<ExternalTokenPayload>({
                    jwt: token,
                    key: secret,
                    algorithm: ALGORITHM,
                    issuer: null,
                })

                return {
                    platformId: payload.platformId,
                    externalUserId: payload.externalUserId,
                    externalProjectId: payload.externalProjectId,
                    externalFirstName: payload.firstName,
                    externalLastName: payload.lastName,
                }
            }
            catch (error) {
                log.error({ name: 'JwtTokenExtractor#extract', error })

                throw new ActivepiecesError({
                    code: ErrorCode.INVALID_BEARER_TOKEN,
                    params: {
                        message:
                            error instanceof Error ? error.message : 'error decoding token',
                    },
                })
            }
        },
    }
}

export type ExternalTokenPayload = {
    platformId: string
    externalUserId: string
    externalProjectId: string
    firstName: string
    lastName: string
    exp?: number
}

export type ExternalPrincipal = {
    platformId: string
    externalUserId: string
    externalProjectId: string
    externalFirstName: string
    externalLastName: string
} 