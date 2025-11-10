import { ApiKey } from '@activepieces/ee-shared'
import { ActivepiecesError, ErrorCode, isNil, Principal, PrincipalType } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { apiKeyService } from '../../../ee/api-keys/api-key-service'

const HEADER_NAME = 'authorization'
const HEADER_PREFIX = 'Bearer '
const API_KEY_PREFIX = 'sk-'

const isApiKey = (request: FastifyRequest): boolean => {
    const prefix = `${HEADER_PREFIX}${API_KEY_PREFIX}`
    return request.headers[HEADER_NAME]?.startsWith(prefix) ?? false
}

const extractApiKeyValue = (request: FastifyRequest): string => {
    const header = request.headers[HEADER_NAME]
    const apiKeyValue = header?.substring(HEADER_PREFIX.length)

    if (isNil(apiKeyValue)) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHENTICATION,
            params: {
                message: 'missing api key',
            },
        })
    }

    return apiKeyValue
}

const createPrincipal = (apiKey: ApiKey): Principal => {
    return {
        id: apiKey.id,
        type: PrincipalType.SERVICE,
        platform: {
            id: apiKey.platformId,
        },
    }
}

const authenticateOrThrow = async (request: FastifyRequest): Promise<Principal> => {
    const apiKeyValue = extractApiKeyValue(request)
    
    try {
        const apiKey = await apiKeyService.getByValueOrThrow(apiKeyValue)
        return createPrincipal(apiKey)
    }
    catch (e) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHENTICATION,
            params: {
                message: 'invalid api key',
            },
        })
    }
}

export const apiKeyAuthn = {
    isApiKey,
    authenticateOrThrow,
}

