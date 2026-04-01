import { ApplicationEventName, assertNotNullOrUndefined, SAMLAuthnProviderConfig } from '@activepieces/shared'
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
        const url = new URL('/authenticate', `${req.protocol}://${req.hostname}`)
        url.searchParams.append('response', JSON.stringify(response))
        applicationEvents(req.log).sendUserEvent({
            platformId,
            userId: response.id,
            projectId: response.projectId,
            ip: networkUtils.extractClientRealIp(req, system.get(AppSystemProp.CLIENT_REAL_IP_HEADER)),
        }, {
            action: ApplicationEventName.USER_SIGNED_UP,
            data: {
                source: 'sso',
            },
        })
        return res.redirect(url.toString())
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
