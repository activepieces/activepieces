import { assertNotNullOrUndefined } from '@activepieces/core-utils'
import { AuthenticationResponse, ManagedAuthnRequestBody, UserIdentityProvider } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { authenticationSideEffects } from '../../authentication/authentication-side-effects'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { networkUtils } from '../../helper/network-utils'
import { managedAuthnService } from './managed-authn-service'

export const managedAuthnController: FastifyPluginAsyncZod = async (
    app,
) => {
    app.post(
        '/external-token',
        ManagedAuthnRequest,
        async (req): Promise<AuthenticationResponse> => {
            const { externalAccessToken } = req.body

            const { response, signedUp } = await managedAuthnService(req.log).externalToken({
                externalAccessToken,
            })
            assertNotNullOrUndefined(response.platformId, 'Platform ID is required')
            if (signedUp) {
                authenticationSideEffects(req.log).onSignIn({
                    response,
                    signedUp,
                    method: UserIdentityProvider.JWT,
                    ip: networkUtils.clientIp(req),
                })
            }
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
