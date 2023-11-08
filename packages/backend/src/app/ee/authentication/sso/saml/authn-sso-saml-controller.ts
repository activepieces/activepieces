import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { authnSsoSamlService } from './authn-sso-saml-service'

export const authnSsoSamlController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/sp/login', async (_req, res) => {
        const loginResponse = await authnSsoSamlService.login()
        return res.redirect(loginResponse.redirectUrl)
    })

    app.post('/sp/acs', AcsRequest, async (req) => {
        return authnSsoSamlService.acs({
            body: req.body,
            query: req.query,
        })
    })
}

const AcsRequest = {
    schema: {
        body: Type.Record(Type.String(), Type.Unknown()),
        querystring: Type.Record(Type.String(), Type.Unknown()),
    },
}
