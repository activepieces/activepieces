import { FastifyRequest } from 'fastify'
import { BaseSecurityHandler } from '../security-handler'
import {
    ActivepiecesError,
    ErrorCode,
    PrincipalType,
} from '@activepieces/shared'

export class PrincipalTypeAuthzHandler extends BaseSecurityHandler {
    private static readonly IGNORED_ROUTES = [
        '/favicon.ico',
        '/v1/docs',
        '/redirect',
    ]

    private static readonly DEFAULT_ALLOWED_PRINCIPAL_TYPES = [
        PrincipalType.USER,
        PrincipalType.WORKER,
        PrincipalType.SERVICE,
    ]

    protected canHandle(request: FastifyRequest): Promise<boolean> {
        const requestMatches =
      !PrincipalTypeAuthzHandler.IGNORED_ROUTES.includes(request.routerPath) &&
      !request.routerPath.startsWith('/ui')

        return Promise.resolve(requestMatches)
    }

    protected doHandle(request: FastifyRequest): Promise<void> {
        const principalType = request.principal.type
        const configuredPrincipals = request.routeConfig.allowedPrincipals
        const defaultPrincipals =
      PrincipalTypeAuthzHandler.DEFAULT_ALLOWED_PRINCIPAL_TYPES
        const allowedPrincipals = configuredPrincipals ?? defaultPrincipals
        const principalTypeNotAllowed = !allowedPrincipals.includes(principalType)

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
