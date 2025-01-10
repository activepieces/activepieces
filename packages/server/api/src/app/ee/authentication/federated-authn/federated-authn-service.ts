import { assertNotNullOrUndefined, AuthenticationResponse,
    FederatedAuthnLoginResponse,
    isNil,
    UserIdentityProvider,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { authenticationService } from '../../../authentication/authentication.service'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-prop'
import { platformService } from '../../../platform/platform.service'
import { googleAuthnProvider } from './google-authn-provider'

export const federatedAuthnService = (log: FastifyBaseLogger) => ({
    async login({
        platformId,
        hostname,
    }: LoginParams): Promise<FederatedAuthnLoginResponse> {
        const { clientId } = await getClientIdAndSecret(platformId)
        const loginUrl = await googleAuthnProvider.getLoginUrl({
            hostname,
            clientId,
            platformId,
        })

        return {
            loginUrl,
        }
    },

    async claim({
        hostname,
        platformId,
        code,
    }: ClaimParams): Promise<AuthenticationResponse> {
        const { clientId, clientSecret } = await getClientIdAndSecret(platformId)
        const idToken = await googleAuthnProvider.authenticate({
            hostname,
            clientId,
            clientSecret,
            authorizationCode: code,
            platformId,
        })

        return authenticationService(log).federatedAuthn({
            email: idToken.email,
            firstName: idToken.firstName ?? 'john',
            lastName: idToken.lastName ?? 'doe',
            trackEvents: true,
            newsLetter: true,
            provider: UserIdentityProvider.GOOGLE,
            predefinedPlatformId: platformId ?? null,
        })
    },
})

async function getClientIdAndSecret(platformId: string | undefined) {
    if (isNil(platformId)) {
        return {
            clientId: system.getOrThrow(AppSystemProp.GOOGLE_CLIENT_ID),
            clientSecret: system.getOrThrow(AppSystemProp.GOOGLE_CLIENT_SECRET),
        }
    }
    const platform = await platformService.getOneOrThrow(platformId)
    const clientInformation = platform.federatedAuthProviders.google
    assertNotNullOrUndefined(clientInformation, 'Google client information is not defined')
    return {
        clientId: clientInformation.clientId,
        clientSecret: clientInformation.clientSecret,
    }
}

type LoginParams = {
    platformId: string | undefined
    hostname: string
}

type ClaimParams = {
    platformId: string | undefined
    hostname: string
    code: string
}
