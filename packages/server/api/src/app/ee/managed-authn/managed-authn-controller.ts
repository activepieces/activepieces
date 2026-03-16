import { ApplicationEventName, AuthenticationResponse,
    ManagedAuthnRequestBody,
} from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { applicationEvents } from '../../helper/application-events'
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
            applicationEvents(req.log).sendUserEvent(req, {
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
