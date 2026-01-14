import { ApplicationEventName, ManagedAuthnRequestBody } from '@activepieces/ee-shared'
import { securityAccess } from '@activepieces/server-shared'
import {
    AuthenticationResponse,
} from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { applicationEvents } from '../../helper/application-events'
import { managedAuthnService } from './managed-authn-service'

export const managedAuthnController: FastifyPluginAsyncTypebox = async (
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
            applicationEvents.sendUserEvent(req, {
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
