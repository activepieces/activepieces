import {
    ApplicationEventName,
} from '@activepieces/ee-shared'
import { AppSystemProp, networkUtils, securityAccess } from '@activepieces/server-shared'
import {
    ClaimTokenRequest,
    ThirdPartyAuthnProviderEnum,
} from '@activepieces/shared'
import {
    FastifyPluginAsyncTypebox,
    Type,
} from '@fastify/type-provider-typebox'
import { applicationEvents } from '../../../helper/application-events'
import { system } from '../../../helper/system/system'
import { platformUtils } from '../../../platform/platform.utils'
import { federatedAuthnService } from './federated-authn-service'

export const federatedAuthModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(federatedAuthnController, {
        prefix: '/v1/authn/federated',
    })
}

const federatedAuthnController: FastifyPluginAsyncTypebox = async (app) => {
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
        applicationEvents.sendUserEvent({
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
        querystring: Type.Object({
            providerName: Type.Enum(ThirdPartyAuthnProviderEnum),
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
