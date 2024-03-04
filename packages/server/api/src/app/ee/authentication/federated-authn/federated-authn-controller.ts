import {
    FastifyPluginAsyncTypebox,
    Type,
} from '@fastify/type-provider-typebox'
import { federatedAuthnService } from './federated-authn-service'
import {
    ApplicationEventName,
} from '@activepieces/ee-shared'
import {
    ClaimTokenRequest,
    ThirdPartyAuthnProviderEnum,
    ALL_PRINCIPAL_TYPES,
    assertNotNullOrUndefined,
} from '@activepieces/shared'
import { resolvePlatformIdForRequest } from '../../../platform/platform-utils'
import { eventsHooks } from '../../../helper/application-events'

export const federatedAuthnController: FastifyPluginAsyncTypebox = async (
    app,
) => {
    app.get('/login', LoginRequestSchema, async (req) => {
        const platformId = await resolvePlatformIdForRequest(req)
        assertNotNullOrUndefined(platformId, 'Platform id is not defined')
        return federatedAuthnService.login({
            providerName: req.query.providerName,
            platformId,
            hostname: req.hostname,
        })
    })

    app.post('/claim', ClaimTokenRequestSchema, async (req) => {
        const platformId = await resolvePlatformIdForRequest(req)
        assertNotNullOrUndefined(platformId, 'Platform id is not defined')
        const response = await federatedAuthnService.claim({
            platformId,
            hostname: req.hostname,
            providerName: req.body.providerName,
            code: req.body.code,
        })
        eventsHooks.get().send(req, {
            action: ApplicationEventName.SIGNED_UP_USING_SSO,
            userId: req.principal.id,
            createdUser: {
                id: response.id,
                email: response.email,
            },
        })
        return response
    })
}

const LoginRequestSchema = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        querystring: Type.Object({
            providerName: Type.Enum(ThirdPartyAuthnProviderEnum),
        }),
    },
}

const ClaimTokenRequestSchema = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        body: ClaimTokenRequest,
    },
}
