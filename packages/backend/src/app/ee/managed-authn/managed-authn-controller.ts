import { AuthenticationResponse } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { managedAuthnService } from './managed-authn-service'
import { ManagedAuthnRequestBody } from '@activepieces/ee-shared'

export const managedAuthnController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/external-token', ManagedAuthnRequest, async (req): Promise<AuthenticationResponse> => {
        const { externalAccessToken } = req.body

        return managedAuthnService.authenticate({
            externalAccessToken,
        })
    })
}

const ManagedAuthnRequest = {
    schema: {
        body: ManagedAuthnRequestBody,
    },
}
