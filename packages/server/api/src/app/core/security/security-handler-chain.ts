import { ActivepiecesError, ErrorCode, Principal } from '@activepieces/shared'
import { FastifyRequest } from 'fastify'
import { AccessTokenAuthnHandler } from './authn/access-token-authn-handler'
import { PublicAuthnHandler } from './authn/public-authn-handler'
import { PlatformApiKeyAuthnHandler } from './authn/platform-api-key-authn-handler'
import { PrincipalTypeAuthzHandler } from './authz/principal-type-authz-handler'
import { ProjectAuthzHandler } from './authz/project-authz-handler'
import { AuthenticatedRoute, AuthorizationType, RouteKind } from '@activepieces/server-shared'

const AUTHN_HANDLERS = [
    new AccessTokenAuthnHandler(),
    new PlatformApiKeyAuthnHandler(),
]

export const securityHandlerChain = async (
    request: FastifyRequest,
): Promise<void> => {
    await processRouteSecurity(request)
}

const processRouteSecurity = async (request: FastifyRequest): Promise<void> => {
    const security = request.routeOptions.config?.security
    
    if (!security) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHENTICATION,
            params: {
                message: 'security configuration is required',
            },
        })
    }
    
    switch (security.kind) {
        case RouteKind.AUTHENTICATED:
            await authenticate(request)
            await authorize(request, security)
            break
        case RouteKind.PUBLIC:
            await new PublicAuthnHandler().handle(request)
            break
    }
}


const authorize = async (request: FastifyRequest, security: AuthenticatedRoute): Promise<void> => {
    switch (security.authorization.type) {
        case AuthorizationType.PLATFORM:
            // TODO: Checking if the principal is the owner of the platform is currently implemented
            // in the controller. We need to move this logic to the authorization handler.
            await new PrincipalTypeAuthzHandler().handle(request)
            break
        case AuthorizationType.PROJECT:
            await new PrincipalTypeAuthzHandler().handle(request)
            await new ProjectAuthzHandler().handle(request)
            break
        case AuthorizationType.WORKER:
        case AuthorizationType.NONE:
            break
        default:
            throw new ActivepiecesError({
                code: ErrorCode.AUTHORIZATION,
                params: {
                    message: 'invalid authorization type',
                },
            })
    }
}

const authenticate = async (request: FastifyRequest): Promise<void> => {
    for (const handler of AUTHN_HANDLERS) {
        await handler.handle(request)
        const principalPopulated = isPrincipalPopulated(request)
        if (principalPopulated) {
            return
        }
    }
}

const isPrincipalPopulated = (request: FastifyRequest): boolean => {
    const principal = request.principal as Principal | undefined
    return principal !== undefined
}