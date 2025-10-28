import {
    ActivepiecesError,
    assertNotNullOrUndefined,
    ErrorCode,
    PrincipalType,
} from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { BaseSecurityHandler } from '../security-handler'

export class PrincipalTypeAuthzHandler extends BaseSecurityHandler {
    private static readonly IGNORED_ROUTES = [
        '/favicon.ico',
        '/v1/docs',
        '/redirect',
    ]

    private static readonly DEFAULT_ALLOWED_PRINCIPAL_TYPES = [
        PrincipalType.USER,
        PrincipalType.ENGINE,
        PrincipalType.SERVICE,
    ]

    protected canHandle(request: FastifyRequest): Promise<boolean> {
        const routerPath = request.routeOptions.url
        assertNotNullOrUndefined(routerPath, 'routerPath is undefined'  )    
        const requestMatches =
      !PrincipalTypeAuthzHandler.IGNORED_ROUTES.includes(routerPath) &&
      !routerPath.startsWith('/ui')

        return Promise.resolve(requestMatches)
    }

    protected doHandle(request: FastifyRequest): Promise<void> {
        const principalType = request.principal.type
        const configuredPrincipals = request.routeOptions.config?.allowedPrincipals
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
