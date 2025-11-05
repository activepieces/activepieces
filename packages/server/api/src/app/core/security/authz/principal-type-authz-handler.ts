import {
    ActivepiecesError,
    AuthorizationType,
    ErrorCode,
    PrincipalType,
    PlatformAuthorization,
    ProjectAuthorization,
} from '@activepieces/shared'
import { BaseAuthzHandler } from '../security-handler'
import { AuthenticatedFastifyRequest } from '../../../../../types/fastify'

const ALLOWED_PRINCIPAL_TYPES = [
    PrincipalType.USER,
    PrincipalType.ENGINE,
    PrincipalType.SERVICE,
]

export class PrincipalTypeAuthzHandler extends BaseAuthzHandler<AuthenticatedRequestWithPrincipals> {
    protected canHandle(request: AuthenticatedFastifyRequest): request is AuthenticatedRequestWithPrincipals {
        const authType = request.routeOptions.config.security.authorization.type
        const isPrincipalTypeValid = authType !== AuthorizationType.WORKER && authType !== AuthorizationType.NONE
        if (!isPrincipalTypeValid){
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: {
                    message: 'invalid route for principal type',
                },
            })
        }
        return true
    }

    protected doHandle(request: AuthenticatedRequestWithPrincipals): Promise<void> {
        const principalType = request.principal.type
        const configuredPrincipals = request.routeOptions.config.security.authorization.allowedPrincipals
        const principalTypeNotAllowed = !isPrincipalTypeAllowed(principalType, configuredPrincipals)

        if (principalTypeNotAllowed) {
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: {
                    message: 'invalid route for principal type',
                },
            })
        }

        return Promise.resolve()
    }
}

function isPrincipalTypeAllowed(principalType: PrincipalType, configuredPrincipals: PrincipalType[]): boolean {
    if (!ALLOWED_PRINCIPAL_TYPES.includes(principalType)) {
        return false
    }
    return configuredPrincipals.includes(principalType)
}

type AuthenticatedRequestWithPrincipals = AuthenticatedFastifyRequest & {
    routeOptions: {
        config: {
            security: {
                authorization: PlatformAuthorization | ProjectAuthorization
            }
        }
    }
}