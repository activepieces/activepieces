import { AppSystemProp } from '@activepieces/server-shared'
import { assertNotNullOrUndefined, AuthenticationResponse,
    FederatedAuthnLoginResponse,
    isNil,
    UserIdentityProvider,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { authenticationService } from '../../../authentication/authentication.service'
import { system } from '../../../helper/system/system'
import { platformService } from '../../../platform/platform.service'
import { domainHelper } from '../../custom-domains/domain-helper'
import { googleAuthnProvider } from './google-authn-provider'

export const federatedAuthnService = (log: FastifyBaseLogger) => ({
    async login({
        platformId,
    }: LoginParams): Promise<FederatedAuthnLoginResponse> {
        const { clientId } = await getClientIdAndSecret(platformId)
        const loginUrl = await googleAuthnProvider(log).getLoginUrl({
            clientId,
            platformId,
        })

        return {
            loginUrl,
        }
    },

    async claim({
        platformId,
        code,
    }: ClaimParams): Promise<AuthenticationResponse> {
        const { clientId, clientSecret } = await getClientIdAndSecret(platformId)
        const idToken = await googleAuthnProvider(log).authenticate({
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
    async getThirdPartyRedirectUrl(
        platformId: string | undefined,
    ): Promise<string> {
        return domainHelper.getInternalUrl({
            path: '/redirect',
            platformId,
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
}

type ClaimParams = {
    platformId: string | undefined
    code: string
}
