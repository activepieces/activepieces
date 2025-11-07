import { apId, PrincipalType } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { apiKeyAuthn } from './authn/api-key-authn'
import { bearerTokenAuthn } from './authn/bearer-token-authn'
import { principalTypeAuthz } from './authz/principal-type-authz'
import { RouteKind } from '@activepieces/server-shared'

export const securityHandlerChain = async (request: FastifyRequest): Promise<void> => {
    const security = request.routeOptions.config?.security
    
    if (security.kind === RouteKind.PUBLIC) {
        setAnonymousPrincipal(request)
        return
    }

    if (apiKeyAuthn.isApiKey(request)) {
        request.principal = await apiKeyAuthn.authenticate(request)
        await principalTypeAuthz.authorize(request, security)
        return
    }

    if (bearerTokenAuthn.isBearerToken(request)) {
        request.principal = await bearerTokenAuthn.authenticate(request)
        await principalTypeAuthz.authorize(request, security)
        return
    }

    setAnonymousPrincipal(request)
}

const setAnonymousPrincipal = (request: FastifyRequest): void => {
    request.principal = {
        id: `ANONYMOUS_${apId()}`,
        type: PrincipalType.UNKNOWN,
    }
}