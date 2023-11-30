import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { federatedAuthnService } from './federated-authn-service'
import { ClaimTokenRequest, ThirdPartyAuthnProviderEnum } from '@activepieces/ee-shared'

export const federatedAuthnController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/login', LoginRequestSchema, async (req) => {
        return federatedAuthnService.login({
            providerName: req.query.providerName,
        })
    })

    app.post('/claim', ClaimTokenRequestSchema, async (req) => {
        return federatedAuthnService.claim(req.body)
    })
}

const LoginRequestSchema = {
    schema: {
        querystring: Type.Object({
            providerName: Type.Enum(ThirdPartyAuthnProviderEnum),
        }),
    },
}

const ClaimTokenRequestSchema = {
    schema: {
        body: ClaimTokenRequest,
    },
}
