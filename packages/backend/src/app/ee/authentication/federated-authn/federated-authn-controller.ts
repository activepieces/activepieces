import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { federatedAuthnService } from './federated-authn-service'
import { AuthnProviderName } from '@activepieces/ee-shared'

export const federatedAuthnController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/login', LoginRequest, async (req, res) => {
        const { loginUrl } = await federatedAuthnService.login({
            providerName: req.query.providerName,
        })

        return res.redirect(loginUrl)
    })

    app.post('/claim', ClaimTokenRequest, async (req) => {
        return federatedAuthnService.claim(req.body)
    })
}

const LoginRequest = {
    schema: {
        querystring: Type.Object({
            providerName: Type.Enum(AuthnProviderName),
        }),
    },
}

const ClaimTokenRequest = {
    schema: {
        body: Type.Object({
            providerName: Type.Enum(AuthnProviderName),
            code: Type.String(),
        }),
    },
}
