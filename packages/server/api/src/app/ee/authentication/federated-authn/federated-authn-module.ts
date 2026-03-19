import {
    ApplicationEventName,

    ClaimTokenRequest,
    ThirdPartyAuthnProviderEnum } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { securityAccess } from '../../../core/security/authorization/fastify-security'
import { applicationEvents } from '../../../helper/application-events'
import { networkUtils } from '../../../helper/network-utils'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { platformUtils } from '../../../platform/platform.utils'
import { federatedAuthnService } from './federated-authn-service'

export const federatedAuthModule: FastifyPluginAsyncZod = async (app) => {
    await app.register(federatedAuthnController, {
        prefix: '/v1/authn/federated',
    })
}

const federatedAuthnController: FastifyPluginAsyncZod = async (app) => {
    app.get('/login', LoginRequestSchema, async (req) => {
        const platformId = await platformUtils.getPlatformIdForRequest(req)
        return federatedAuthnService(req.log).login({
            platformId: platformId ?? undefined,
        })
    })

    app.post('/claim', ClaimTokenRequestSchema, async (req) => {
        const platformId = await platformUtils.getPlatformIdForRequest(req)
        const response = await federatedAuthnService(req.log).claim({
            platformId: platformId ?? undefined,
            code: req.body.code,
        })
        applicationEvents(req.log).sendUserEvent({
            platformId: response.platformId!,
            userId: response.id,
            projectId: response.projectId,
            ip: networkUtils.extractClientRealIp(req, system.get(AppSystemProp.CLIENT_REAL_IP_HEADER)),
        }, {
            action: ApplicationEventName.USER_SIGNED_UP,
            data: {
                source: 'sso',
            },
        })
        return response
    })
}

const LoginRequestSchema = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        querystring: z.object({
            providerName: z.nativeEnum(ThirdPartyAuthnProviderEnum),
        }),
    },
}

const ClaimTokenRequestSchema = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        body: ClaimTokenRequest,
    },
}
