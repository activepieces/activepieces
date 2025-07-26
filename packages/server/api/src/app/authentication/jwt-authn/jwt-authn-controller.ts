import {
    ALL_PRINCIPAL_TYPES,
    AuthenticationResponse,
} from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { jwtAuthnService } from './jwt-authn-service'

export const jwtAuthnController: FastifyPluginAsyncTypebox = async (
    app,
) => {
    app.post(
        '/external-token',
        JwtAuthnRequest,
        async (req): Promise<AuthenticationResponse> => {
            const { externalAccessToken } = req.body

            const response = await jwtAuthnService(req.log).externalToken({
                externalAccessToken,
            })
            return response
        },
    )
}

const JwtAuthnRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        body: Type.Object({
            externalAccessToken: Type.String(),
        }),
    },
} 