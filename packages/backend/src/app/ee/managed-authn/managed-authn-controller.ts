import { ALL_PRINICPAL_TYPES, AuthenticationResponse } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { managedAuthnService } from './managed-authn-service'
import { ManagedAuthnRequestBody } from '@activepieces/ee-shared'

export const managedAuthnController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/external-token', ManagedAuthnRequest, async (req): Promise<AuthenticationResponse> => {
        const { externalAccessToken } = req.body

        return managedAuthnService.externalToken({
            externalAccessToken,
        })
    })
}

const ManagedAuthnRequest = {
    config: {
        allowedPrincipals: ALL_PRINICPAL_TYPES,
    },
    schema: {
        body: ManagedAuthnRequestBody,
    },
}
