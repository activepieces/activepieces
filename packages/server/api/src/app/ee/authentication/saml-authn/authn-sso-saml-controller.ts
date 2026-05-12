import { ApplicationEventName, assertNotNullOrUndefined, PrincipalType, SAMLAuthnProviderConfig } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyRequest } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { applicationEvents } from '../../../helper/application-events'
import { networkUtils } from '../../../helper/network-utils'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { platformService } from '../../../platform/platform.service'
import { platformUtils } from '../../../platform/platform.utils'
import { platformMustHaveFeatureEnabled } from '../ee-authorization'
import { authnSsoSamlService } from './authn-sso-saml-service'

export const authnSsoSamlController: FastifyPluginAsyncZod = async (app) => {
    app.get('/login', LoginRequest, async (req, res) => {
        const { saml, platformId } = await getSamlConfigOrThrow(req, req.log)
        const loginResponse = await authnSsoSamlService(req.log).login(platformId, saml)
        return res.redirect(loginResponse.redirectUrl)
    })

    app.post('/acs', AcsRequest, async (req, res) => {
        const { saml, platformId } = await getSamlConfigOrThrow(req, req.log)
        const response = await authnSsoSamlService(req.log).acs(platformId, saml, {
            body: req.body,
            query: req.query,
        })
        const url = new URL('/authenticate', networkUtils.getRequestBaseUrl(req))
        url.searchParams.append('response', JSON.stringify(response))
        applicationEvents(req.log).sendUserEvent({
            platformId,
            userId: response.id,
            projectId: response.projectId ?? undefined,
            ip: networkUtils.extractClientRealIp(req, system.get(AppSystemProp.CLIENT_REAL_IP_HEADER)),
        }, {
            action: ApplicationEventName.USER_SIGNED_UP,
            data: {
                source: 'sso',
            },
        })
        return res.redirect(url.toString())
    })

    app.post('/sso-domain', UpdateSsoDomainRequest, async (req) => {
        return authnSsoSamlService(req.log).updateSsoDomain({
            platformId: req.principal.platform.id,
            ssoDomain: req.body.ssoDomain,
        })
    })

    app.post('/sso-domain/verify', VerifySsoDomainRequest, async (req) => {
        return authnSsoSamlService(req.log).verifySsoDomain({
            platformId: req.principal.platform.id,
        })
    })
}

async function getSamlConfigOrThrow(req: FastifyRequest, log: FastifyBaseLogger): Promise<{ saml: SAMLAuthnProviderConfig, platformId: string }> {
    const platformId = await platformUtils.getPlatformIdForRequest(req)
    assertNotNullOrUndefined(platformId, 'Platform ID is required for SAML authentication')
    const platform = await platformService(log).getOneOrThrow(platformId)
    const saml = platform.federatedAuthProviders.saml
    assertNotNullOrUndefined(saml, 'SAML IDP metadata is not configured for this platform')
    return {
        saml,
        platformId,
    }
}

const AcsRequest = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        body: z.record(z.string(), z.unknown()),
        querystring: z.record(z.string(), z.unknown()),
    },
}

const LoginRequest = {
    config: {
        security: securityAccess.public(),
    },
}

const UpdateSsoDomainRequest = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    preHandler: platformMustHaveFeatureEnabled((platform) => platform.plan.ssoEnabled),
    schema: {
        body: z.object({
            ssoDomain: z.string().max(253).nullable(),
        }),
    },
}

const VerifySsoDomainRequest = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    preHandler: platformMustHaveFeatureEnabled((platform) => platform.plan.ssoEnabled),
}
