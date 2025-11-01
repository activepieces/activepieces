import {
    ActivepiecesError,
    assertNotNullOrUndefined,
    ErrorCode,
} from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { BaseSecurityHandler } from '../security-handler'

export class PrincipalTypeAuthzHandler extends BaseSecurityHandler {
    private static readonly IGNORED_ROUTES = [
        '/favicon.ico',
        '/v1/docs',
        '/redirect',
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
        assertNotNullOrUndefined(configuredPrincipals, 'configuredPrincipals is undefined')
        const principalTypeNotAllowed = !configuredPrincipals.includes(principalType)

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
