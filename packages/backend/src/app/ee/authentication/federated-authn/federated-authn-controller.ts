import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { federatedAuthnService } from './federated-authn-service'
import { ThirdPartyAuthnProviderEnum } from '@activepieces/ee-shared'

export const federatedAuthnController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/login', LoginRequest, async (req) => {
        return await federatedAuthnService.login({
            providerName: req.query.providerName,
        })
       
    })

    app.post('/claim', ClaimTokenRequest, async (req) => {
        return federatedAuthnService.claim(req.body)
    })
}

const LoginRequest = {
    schema: {
        querystring: Type.Object({
            providerName: Type.Enum(ThirdPartyAuthnProviderEnum),
        }),
    },
}

const ClaimTokenRequest = {
    schema: {
        body: Type.Object({
            providerName: Type.Enum(ThirdPartyAuthnProviderEnum),
            code: Type.String(),
        }),
    },
}
