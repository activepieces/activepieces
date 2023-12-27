import { FastifyRequest } from 'fastify'
import { AccessTokenAuthnHandler } from './authn/access-token-authn-handler'
import { AnonymousAuthnHandler } from './authn/anonymous-authn-handler'
import { GlobalApiKeyAuthnHandler } from './authn/global-api-key-authn-handler'
import { PlatformApiKeyAuthnHandler } from './authn/platform-api-key-authn-handler'
import { PrincipalTypeAuthzHandler } from './authz/principal-type-authz-handler'
import { ProjectAuthzHandler } from './authz/project-authz-handler'

const HANDLERS = [
    new GlobalApiKeyAuthnHandler(),
    new PlatformApiKeyAuthnHandler(),
    new AccessTokenAuthnHandler(),
    new AnonymousAuthnHandler(),
    new PrincipalTypeAuthzHandler(),
    new ProjectAuthzHandler(),
]

export const securityHandlerChain = async (request: FastifyRequest): Promise<void> => {
    for (const handler of HANDLERS) {
        await handler.handle(request)
    }
}
