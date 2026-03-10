import { ActivepiecesError, ErrorCode, isNil, Principal, PrincipalType, tryCatch } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { nanoid } from 'nanoid'
import { accessTokenManager } from '../../../../authentication/lib/access-token-manager'
import { oauthService } from '../../../../authentication/oauth/oauth-service'
import { apiKeyService } from '../../../../ee/api-keys/api-key-service'
import { jwtUtils } from '../../../../helper/jwt-utils'

const SESSION_TOKEN_TYPES: PrincipalType[] = [
    PrincipalType.USER,
    PrincipalType.ENGINE,
    PrincipalType.WORKER,
    PrincipalType.SERVICE,
]

export const authenticateOrThrow = async (log: FastifyBaseLogger, rawToken: string | null): Promise<Principal> => {
    if (!isNil(rawToken) && rawToken.startsWith('Bearer sk-')) {
        const trimBearerPrefix = rawToken.replace('Bearer ', '')
        return createPrincipalForApiKey(trimBearerPrefix)
    }
    if (!isNil(rawToken) && rawToken.startsWith('Bearer ')) {
        const trimBearerPrefix = rawToken.replace('Bearer ', '')
        return verifyBearerJwt(log, trimBearerPrefix)
    }
    return {
        id: nanoid(),
        type: PrincipalType.UNKNOWN,
    }
}

async function verifyBearerJwt(log: FastifyBaseLogger, token: string): Promise<Principal> {
    if (token.split('.').length !== 3) {
        throw new ActivepiecesError({
            code: ErrorCode.INVALID_BEARER_TOKEN,
            params: {
                message: 'invalid access token or session expired',
            },
        })
    }

    const decoded = jwtUtils.decode<{ type?: string }>({ jwt: token })
    const type = decoded?.payload?.type ?? null

    if (isNil(type)) {
        throw new ActivepiecesError({
            code: ErrorCode.INVALID_BEARER_TOKEN,
            params: {
                message: 'invalid access token or session expired',
            },
        })
    }

    if (type === PrincipalType.OAUTH) {
        return createPrincipalForOAuthToken(log, token)
    }

    if (SESSION_TOKEN_TYPES.includes(type as PrincipalType)) {
        return accessTokenManager(log).verifyPrincipal(token)
    }

    throw new ActivepiecesError({
        code: ErrorCode.INVALID_BEARER_TOKEN,
        params: {
            message: `unknown token type: ${type}`,
        },
    })
}

async function createPrincipalForOAuthToken(log: FastifyBaseLogger, token: string): Promise<Principal> {
    const { data: payload, error } = await tryCatch(() => oauthService(log).verifyAccessToken(token))
    if (error) {
        if (error instanceof ActivepiecesError) {
            throw error
        }
        throw new ActivepiecesError({
            code: ErrorCode.INVALID_BEARER_TOKEN,
            params: {
                message: 'invalid OAuth access token',
            },
        })
    }
    return {
        id: payload.sub,
        type: PrincipalType.OAUTH,
        platform: {
            id: payload.platformId,
        },
    }
}

async function createPrincipalForApiKey(apiKeyValue: string): Promise<Principal> {
    const apiKey = await apiKeyService.getByValue(apiKeyValue)
    if (isNil(apiKey)) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHENTICATION,
            params: {
                message: 'invalid api key',
            },
        })
    }
    return {
        id: apiKey.id,
        type: PrincipalType.SERVICE,
        platform: {
            id: apiKey.platformId,
        },
    }
}
