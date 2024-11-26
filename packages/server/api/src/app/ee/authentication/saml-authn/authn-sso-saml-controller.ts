import { ActivepiecesError, ALL_PRINCIPAL_TYPES, assertNotNullOrUndefined, AuthenticationResponse, ErrorCode, SAMLAuthnProviderConfig } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { FastifyRequest } from 'fastify'
import { resolvePlatformIdForRequest } from '../../../platform/platform-utils'
import { platformService } from '../../../platform/platform.service'
import { authenticationHelper } from '../authentication-service/hooks/authentication-helper'
import { authnSsoSamlService } from './authn-sso-saml-service'

export const authnSsoSamlController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/login', LoginRequest, async (req, res) => {
        const { saml, platformId } = await getSamlConfigOrThrow(req)
        const loginResponse = await authnSsoSamlService.login(platformId, saml)
        return res.redirect(loginResponse.redirectUrl)
    })
    app.post('/acs', AcsRequest, async (req, res) => {
        const { saml, platformId } = await getSamlConfigOrThrow(req)
        const user = await authnSsoSamlService.acs( platformId, saml, {
            body: req.body,
            query: req.query,
        })
        const { token, project } = await authenticationHelper.getProjectAndTokenOrThrow(user)
        const url = new URL('/authenticate', `${req.protocol}://${req.hostname}`)
        const response: AuthenticationResponse = {
            token,  
            ...user,
            projectId: project.id,
        }
        url.searchParams.append('response', JSON.stringify(response))
        return res.redirect(url.toString())
    })
}

async function getSamlConfigOrThrow(request: FastifyRequest): Promise<{ saml: SAMLAuthnProviderConfig, platformId: string }> {
    const platformId = await resolvePlatformIdForRequest(request)
    assertNotNullOrUndefined(platformId, 'Platform ID is required for SAML authentication')
    const platform = await platformService.getOneOrThrow(platformId)
    if (!platform.ssoEnabled) {
        throw new ActivepiecesError({
            code: ErrorCode.FEATURE_DISABLED,
            params: {
                message: 'Feature is disabled',
            },
        })
    }
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