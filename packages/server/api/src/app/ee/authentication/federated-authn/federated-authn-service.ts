import { authenticationService } from '../../../authentication/authentication-service'
import { resolvePlatformIdFromEmail } from '../../../platform/platform-utils'
import { platformService } from '../../../platform/platform.service'
import { providers } from './authn-provider/authn-provider'
import { AuthenticationResponse,
    FederatedAuthnLoginResponse,
    ThirdPartyAuthnProviderEnum,
} from '@activepieces/shared'

export const federatedAuthnService = {
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
        const platformIdFromEmail = (await resolvePlatformIdFromEmail(idToken.email)) ?? platformId
        return authenticationService.federatedAuthn({
            email: idToken.email,
            verified: true,
            firstName: idToken.firstName,
            lastName: idToken.lastName,
            platformId: platformIdFromEmail,
        })
    },
}

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
