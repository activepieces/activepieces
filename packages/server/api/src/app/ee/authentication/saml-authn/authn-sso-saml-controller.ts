import { assertNotNullOrUndefined } from '@activepieces/core-utils'
import { TelemetryEventName, UserIdentityProvider } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { authenticationSideEffects } from '../../../authentication/authentication-side-effects'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { networkUtils } from '../../../helper/network-utils'
import { rejectedPromiseHandler } from '../../../helper/promise-handler'
import { telemetry } from '../../../helper/telemetry.utils'
import { platformUtils } from '../../../platform/platform.utils'
import { authnSsoSamlService } from './authn-sso-saml-service'

export const authnSsoSamlController: FastifyPluginAsyncZod = async (app) => {
    app.get('/login', LoginRequest, async (req, res) => {
        const platformId = req.query.platformId ?? await platformUtils.getPlatformIdForRequest(req)
        assertNotNullOrUndefined(platformId, 'Platform Id should not be null')
        const { saml } = await authnSsoSamlService(req.log).getSamlConfigOrThrow(platformId)
        const { redirectUrl } = await authnSsoSamlService(req.log).login(platformId, saml)
        return res.redirect(redirectUrl)
    })

    app.post('/acs', AcsRequest, async (req, res) => {
        const platformId = req.query.platformId
            ?? await platformUtils.getPlatformIdByLegacyHost(req)
            ?? await platformUtils.getPlatformIdForRequest(req)
        assertNotNullOrUndefined(platformId, 'Platform Id should not be null')
        const { saml } = await authnSsoSamlService(req.log).getSamlConfigOrThrow(platformId)
        const { response, signedUp } = await authnSsoSamlService(req.log).acs(platformId, saml, {
            body: req.body,
            query: req.query,
        })
        const url = new URL('/authenticate', networkUtils.getRequestBaseUrl(req))
        url.searchParams.append('response', JSON.stringify(response))
        authenticationSideEffects(req.log).onSignIn({
            response,
            signedUp,
            method: UserIdentityProvider.SAML,
            ip: networkUtils.clientIp(req),
        })
        rejectedPromiseHandler(telemetry(req.log).trackUser({
            userId: response.id,
            platformId,
            event: {
                name: TelemetryEventName.SIGNED_IN,
                payload: {
                    userId: response.id,
                    platformId,
                },
            },
        }), req.log)
        return res.redirect(url.toString())
    })

    app.post('/discover', DiscoverRequest, async (req) => {
        return authnSsoSamlService(req.log).discoverByDomain(req.body.domain)
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
