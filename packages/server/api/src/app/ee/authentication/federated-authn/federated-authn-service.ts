import {
    AuthenticationResponse,
    FederatedAuthnLoginResponse,
    UserIdentityProvider,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { authenticationService } from '../../../authentication/authentication.service'
import { domainHelper } from '../../../helper/domain-helper'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { googleAuthnProvider } from './google-authn-provider'

export const federatedAuthnService = (log: FastifyBaseLogger) => ({
    async login({
        platformId,
    }: LoginParams): Promise<FederatedAuthnLoginResponse> {
        const { clientId } = getClientIdAndSecret()
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
        const { clientId, clientSecret } = getClientIdAndSecret()
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
            imageUrl: idToken.imageUrl,
        })
    },
    async getThirdPartyRedirectUrl(): Promise<string> {
        return domainHelper.getInternalUrl({
            path: '/redirect',
        })
    },
})

function getClientIdAndSecret() {
    return {
        clientId: system.getOrThrow(AppSystemProp.GOOGLE_CLIENT_ID),
        clientSecret: system.getOrThrow(AppSystemProp.GOOGLE_CLIENT_SECRET),
    }
}

type LoginParams = {
    platformId: string | undefined
}

type ClaimParams = {
    platformId: string | undefined
    code: string
}
