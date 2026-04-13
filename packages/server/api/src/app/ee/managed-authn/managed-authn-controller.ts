import { ApplicationEventName, assertNotNullOrUndefined, AuthenticationResponse,
    ManagedAuthnRequestBody,
} from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { applicationEvents } from '../../helper/application-events'
import { networkUtils } from '../../helper/network-utils'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { managedAuthnService } from './managed-authn-service'

export const managedAuthnController: FastifyPluginAsyncZod = async (
    app,
) => {
    app.post(
        '/external-token',
        ManagedAuthnRequest,
        async (req): Promise<AuthenticationResponse> => {
            const { externalAccessToken } = req.body

            const response = await managedAuthnService(req.log).externalToken({
                externalAccessToken,
            })
            assertNotNullOrUndefined(response.platformId, 'Platform ID is required')
            applicationEvents(req.log).sendUserEvent({
                platformId: response.platformId,
                userId: response.id,
                projectId: response.projectId,
                ip: networkUtils.extractClientRealIp(req, system.get(AppSystemProp.CLIENT_REAL_IP_HEADER)),
            }, {
                action: ApplicationEventName.USER_SIGNED_UP,
                data: {
                    source: 'managed',
                },
            })
            return response
        },
    )
}

const ManagedAuthnRequest = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        body: ManagedAuthnRequestBody,
    },
}
