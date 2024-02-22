import {
    ALL_PRINICPAL_TYPES,
    AuthenticationResponse,
} from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { managedAuthnService } from './managed-authn-service'
import { ApplicationEventName, ManagedAuthnRequestBody } from '@activepieces/ee-shared'
import { eventsHooks } from '../../helper/application-events'

export const managedAuthnController: FastifyPluginAsyncTypebox = async (
    app,
) => {
    app.post(
        '/external-token',
        ManagedAuthnRequest,
        async (req): Promise<AuthenticationResponse> => {
            const { externalAccessToken } = req.body

            const response = await managedAuthnService.externalToken({
                externalAccessToken,
            })
            eventsHooks.get().send(req, {
                action: ApplicationEventName.SIGNED_UP_USING_MANAGED_AUTH,
                userId: req.principal.id,
                createdUser: {
                    id: response.id,
                    email: response.email,
                },
            })
            return response
        },
    )
}

const ManagedAuthnRequest = {
    config: {
        allowedPrincipals: ALL_PRINICPAL_TYPES,
    },
    schema: {
        body: ManagedAuthnRequestBody,
    },
}
