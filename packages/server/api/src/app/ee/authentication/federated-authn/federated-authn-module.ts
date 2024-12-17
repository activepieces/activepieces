import {
    ApplicationEventName,
} from '@activepieces/ee-shared'
import {
    ALL_PRINCIPAL_TYPES,
    assertNotNullOrUndefined,
    ClaimTokenRequest,
    ThirdPartyAuthnProviderEnum,
} from '@activepieces/shared'
import {
    FastifyPluginAsyncTypebox,
    Type,
} from '@fastify/type-provider-typebox'
import { eventsHooks } from '../../../helper/application-events'
import { resolvePlatformIdForRequest } from '../../../platform/platform-utils'
import { federatedAuthnService } from './federated-authn-service'

export const federatedAuthModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(federatedAuthnController, {
        prefix: '/v1/authn/federated',
    })
}

const federatedAuthnController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/login', LoginRequestSchema, async (req) => {
        const platformId = await resolvePlatformIdForRequest(req)
        assertNotNullOrUndefined(platformId, 'Platform id is not defined')
        return federatedAuthnService(req.log).login({
            providerName: req.query.providerName,
            platformId,
            hostname: req.hostname,
        })
    })

    app.post('/claim', ClaimTokenRequestSchema, async (req) => {
        const platformId = await resolvePlatformIdForRequest(req)
        assertNotNullOrUndefined(platformId, 'Platform id is not defined')
        const response = await federatedAuthnService(req.log).claim({
            platformId,
            hostname: req.hostname,
            providerName: req.body.providerName,
            code: req.body.code,
        })
        eventsHooks.get(req.log).sendUserEventFromRequest(req, {
            action: ApplicationEventName.USER_SIGNED_UP,
            data: {
                source: 'sso',
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
