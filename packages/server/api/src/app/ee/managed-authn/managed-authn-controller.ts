import { ManagedAuthnRequestBody } from '@activepieces/ee-shared'
import {
    ALL_PRINCIPAL_TYPES,
    AuthenticationResponse,
} from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
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
            return response
        },
    )
}

const ManagedAuthnRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        body: ManagedAuthnRequestBody,
    },
}
