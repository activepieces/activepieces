import { assertNotNullOrUndefined, isNil } from '@activepieces/core-utils'
import { ApplicationEventName, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { applicationEvents } from '../../../helper/application-events'
import { networkUtils } from '../../../helper/network-utils'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { platformUtils } from '../../../platform/platform.utils'
import { platformMustHaveFeatureEnabled } from '../ee-authorization'
import { authnSsoSamlService } from './authn-sso-saml-service'

export const authnSsoSamlController: FastifyPluginAsyncZod = async (app) => {
    app.get('/login', LoginRequest, async (req, res) => {
        const platformId = req.query.platformId ?? await platformUtils.getPlatformIdForRequest(req)
        assertNotNullOrUndefined(platformId, 'Platform Id should not be null')
        const { saml } = await authnSsoSamlService(req.log).getSamlConfigOrThrow(platformId)
        const { redirectUrl } = await authnSsoSamlService(req.log).login({
            platformId,
            samlProvider: saml,
            from: req.query.from,
            originBaseUrl: networkUtils.getRequestBaseUrl(req),
        })
        return res.redirect(redirectUrl)
    })

    app.post('/acs', AcsRequest, async (req, res) => {
        const platformId = req.query.platformId
            ?? await platformUtils.getPlatformIdByLegacyHost(req)
            ?? await platformUtils.getPlatformIdForRequest(req)
        assertNotNullOrUndefined(platformId, 'Platform Id should not be null')
        const { saml } = await authnSsoSamlService(req.log).getSamlConfigOrThrow(platformId)
        const relayState = typeof req.body.RelayState === 'string' ? req.body.RelayState : undefined
        const { authenticationResponse, from, originBaseUrl } = await authnSsoSamlService(req.log).acs({
            platformId,
            samlProvider: saml,
            idpLoginResponse: {
                body: req.body,
                query: req.query,
            },
            relayState,
        })
        const baseUrl = originBaseUrl ?? networkUtils.getRequestBaseUrl(req)
        const url = new URL('/authenticate', baseUrl)
        url.searchParams.append('response', JSON.stringify(authenticationResponse))
        if (!isNil(from)) {
            url.searchParams.append('from', from)
        }
        applicationEvents(req.log).sendUserEvent({
            platformId,
            userId: authenticationResponse.id,
            projectId: authenticationResponse.projectId ?? undefined,
            ip: networkUtils.extractClientRealIp(req, system.get(AppSystemProp.CLIENT_REAL_IP_HEADER)),
        }, {
            action: ApplicationEventName.USER_SIGNED_UP,
            data: {
                source: 'sso',
            },
        })
        return res.redirect(url.toString())
    })

    app.post('/discover', DiscoverRequest, async (req) => {
        return authnSsoSamlService(req.log).discoverByDomain(req.body.domain)
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

const AcsRequest = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        body: z.record(z.string(), z.unknown()),
        querystring: z.object({
            platformId: z.string().optional(),
        }).catchall(z.unknown()),
    },
}

const LoginRequest = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        querystring: z.object({
            platformId: z.string().optional(),
            from: z.string().max(512).optional(),
        }),
    },
}

const DiscoverRequest = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        body: z.object({
            domain: z.string().min(1).max(253),
        }),
        response: {
            200: z.object({
                platformId: z.string().nullable(),
            }),
        },
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
