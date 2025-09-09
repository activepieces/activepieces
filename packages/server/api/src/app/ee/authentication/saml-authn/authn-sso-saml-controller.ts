import { ALL_PRINCIPAL_TYPES, assertNotNullOrUndefined, SAMLAuthnProviderConfig } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { FastifyRequest } from 'fastify'
import { platformService } from '../../../platform/platform.service'
import { platformUtils } from '../../../platform/platform.utils'
import { authnSsoSamlService } from './authn-sso-saml-service'

export const authnSsoSamlController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/login', LoginRequest, async (req, res) => {
        const { saml, platformId } = await getSamlConfigOrThrow(req)
        const loginResponse = await authnSsoSamlService(req.log).login(platformId, saml)
        return res.redirect(loginResponse.redirectUrl)
    })

    app.post('/acs', AcsRequest, async (req, res) => {
        const { saml, platformId } = await getSamlConfigOrThrow(req)
        const response = await authnSsoSamlService(req.log).acs(platformId, saml, {
            body: req.body,
            query: req.query,
        })
        const url = new URL('/authenticate', `${req.protocol}://${req.hostname}`)
        url.searchParams.append('response', JSON.stringify(response))
        return res.redirect(url.toString())
    })
}

async function getSamlConfigOrThrow(req: FastifyRequest): Promise<{ saml: SAMLAuthnProviderConfig, platformId: string }> {
    const platformId = await platformUtils.getPlatformIdForRequest(req)
    assertNotNullOrUndefined(platformId, 'Platform ID is required for SAML authentication')
    const platform = await platformService.getOneOrThrow(platformId)
    const saml = platform.federatedAuthProviders.saml
    assertNotNullOrUndefined(saml, 'SAML IDP metadata is not configured for this platform')
    return {
        saml,
        platformId,
    }
}

const AcsRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        body: Type.Record(Type.String(), Type.Unknown()),
        querystring: Type.Record(Type.String(), Type.Unknown()),
    },
}

const LoginRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
}