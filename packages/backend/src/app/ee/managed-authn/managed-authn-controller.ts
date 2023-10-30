import { AuthenticationResponse } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { managedAuthnService } from './managed-authn-service'
import { ManagedAuthnRequestBody } from '@activepieces/ee-shared'

export const managedAuthnController: FastifyPluginAsyncTypebox = async (app) => {
    app.post('/', ManagedAuthnRequest, async (req): Promise<AuthenticationResponse> => {
        return managedAuthnService.authenticate(req.body)
    })
}

const ManagedAuthnRequest = {
    schema: {
        body: ManagedAuthnRequestBody,
    },
}
