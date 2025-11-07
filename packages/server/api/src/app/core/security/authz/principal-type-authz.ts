import { ActivepiecesError, ErrorCode, PrincipalType } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { AuthenticatedRoute, AuthorizationType } from '@activepieces/server-shared'

const ALLOWED_PRINCIPAL_TYPES = [
    PrincipalType.USER,
    PrincipalType.ENGINE,
    PrincipalType.SERVICE,
]

const isPrincipalTypeAllowed = (principalType: PrincipalType, configuredPrincipals: ReadonlyArray<PrincipalType>): boolean => {
    if (!ALLOWED_PRINCIPAL_TYPES.includes(principalType)) {
        return false
    }
    return configuredPrincipals.includes(principalType)
}

const authorize = async (request: FastifyRequest, security: AuthenticatedRoute): Promise<void> => {
    const authType = security.authorization.type

    if (authType === AuthorizationType.WORKER || authType === AuthorizationType.NONE) {
        return
    }

    const principal = request.principal
    if (!principal) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {
                message: 'principal not found',
            },
        })
    }

    const configuredPrincipals = security.authorization.allowedPrincipals
    const principalTypeNotAllowed = !isPrincipalTypeAllowed(principal.type, configuredPrincipals)

    if (principalTypeNotAllowed) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {
                message: 'invalid route for principal type',
            },
        })
    }
}

export const principalTypeAuthz = {
    authorize,
}

