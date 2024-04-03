import { FastifyRequest } from 'fastify'
import { AccessTokenAuthnHandler } from './authn/access-token-authn-handler'
import { AnonymousAuthnHandler } from './authn/anonymous-authn-handler'
import { AppSumoAuthnHandler } from './authn/app-sumo-authn-handler'
import { GlobalApiKeyAuthnHandler } from './authn/global-api-key-authn-handler'
import { PlatformApiKeyAuthnHandler } from './authn/platform-api-key-authn-handler'
import { PrincipalTypeAuthzHandler } from './authz/principal-type-authz-handler'
import { ProjectAuthzHandler } from './authz/project-authz-handler'
import { Principal } from '@activepieces/shared'

const AUTHN_HANDLERS = [
    new AppSumoAuthnHandler(),
    new GlobalApiKeyAuthnHandler(),
    new PlatformApiKeyAuthnHandler(),
    new AccessTokenAuthnHandler(),
    new AnonymousAuthnHandler(),
]

const AUTHZ_HANDLERS = [
    new PrincipalTypeAuthzHandler(),
    new ProjectAuthzHandler(),
]

export const securityHandlerChain = async (
    request: FastifyRequest,
): Promise<void> => {
    await executeAuthnHandlers(request)
    await executeAuthzHandlers(request)
}

/**
 * Executes authn handlers in order, if one of the handlers populates the principal,
 * the remaining handlers are skipped.
 */
const executeAuthnHandlers = async (request: FastifyRequest): Promise<void> => {
    for (const handler of AUTHN_HANDLERS) {
        await handler.handle(request)
        const principalPopulated = checkWhetherPrincipalIsPopulated(request)
        if (principalPopulated) {
            return
        }
    }
}

const executeAuthzHandlers = async (request: FastifyRequest): Promise<void> => {
    for (const handler of AUTHZ_HANDLERS) {
        await handler.handle(request)
    }
}

const checkWhetherPrincipalIsPopulated = (request: FastifyRequest): boolean => {
    const principal = request.principal as Principal | undefined
    return principal !== undefined
}
