import { AuthenticationResponse,
    FederatedAuthnLoginResponse,
    ThirdPartyAuthnProviderEnum,
    UserIdentityProvider,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { authenticationService } from '../../../authentication/authentication.service'
import { platformService } from '../../../platform/platform.service'
import { providers } from './authn-provider/authn-provider'

export const federatedAuthnService = (log: FastifyBaseLogger) => ({
    async login({
        providerName,
        platformId,
        hostname,
    }: LoginParams): Promise<FederatedAuthnLoginResponse> {
        const provider = providers[providerName]
        const platform = await platformService.getOneOrThrow(platformId)
        const loginUrl = await provider.getLoginUrl(hostname, platform)

        return {
            loginUrl,
        }
    },

    async claim({
        hostname,
        platformId,
        providerName,
        code,
    }: ClaimParams): Promise<AuthenticationResponse> {
        const provider = providers[providerName]
        const platform = await platformService.getOneOrThrow(platformId)
        const idToken = await provider.authenticate(hostname, platform, code)

        return authenticationService(log).federatedAuthn({
            email: idToken.email,
            firstName: idToken.firstName ?? 'john',
            lastName: idToken.lastName ?? 'doe',
            trackEvents: true,
            newsLetter: true,
            provider: UserIdentityProvider.GOOGLE,
        })
    },
})

type LoginParams = {
    platformId: string
    hostname: string
    providerName: ThirdPartyAuthnProviderEnum
}

type ClaimParams = {
    platformId: string
    hostname: string
    providerName: ThirdPartyAuthnProviderEnum
    code: string
}
