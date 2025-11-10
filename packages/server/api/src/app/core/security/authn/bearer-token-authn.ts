import { ActivepiecesError, ErrorCode, isNil, Principal } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { accessTokenManager } from '../../../authentication/lib/access-token-manager'

const HEADER_NAME = 'authorization'
const HEADER_PREFIX = 'Bearer '

const isBearerToken = (request: FastifyRequest): boolean => {
    const header = request.headers[HEADER_NAME]
    return header?.startsWith(HEADER_PREFIX) ?? false
}

const extractAccessToken = (request: FastifyRequest): string => {
    const header = request.headers[HEADER_NAME]
    const accessToken = header?.substring(HEADER_PREFIX.length)

    if (isNil(accessToken)) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHENTICATION,
            params: {
                message: 'missing access token',
            },
        })
    }

    return accessToken
}

const authenticateOrThrow = async (request: FastifyRequest): Promise<Principal> => {
    const accessToken = extractAccessToken(request)
    return await accessTokenManager.verifyPrincipal(accessToken)
}

export const bearerTokenAuthn = {
    isBearerToken,
    authenticateOrThrow,
}

