import {
    FastifyPluginAsyncTypebox,
    Type,
} from '@fastify/type-provider-typebox'
import { federatedAuthnService } from './federated-authn-service'
import {
    ClaimTokenRequest,
    ThirdPartyAuthnProviderEnum,
} from '@activepieces/ee-shared'
import {
    ALL_PRINICPAL_TYPES,
    assertNotNullOrUndefined,
} from '@activepieces/shared'
import { resolvePlatformIdForRequest } from '../../platform/lib/platform-utils'

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
        return federatedAuthnService.claim({
            platformId,
            hostname: req.hostname,
            providerName: req.body.providerName,
            code: req.body.code,
        })
    })
}

const LoginRequestSchema = {
    config: {
        allowedPrincipals: ALL_PRINICPAL_TYPES,
    },
    schema: {
        querystring: Type.Object({
            providerName: Type.Enum(ThirdPartyAuthnProviderEnum),
        }),
    },
}

const ClaimTokenRequestSchema = {
    config: {
        allowedPrincipals: ALL_PRINICPAL_TYPES,
    },
    schema: {
        body: ClaimTokenRequest,
    },
}
