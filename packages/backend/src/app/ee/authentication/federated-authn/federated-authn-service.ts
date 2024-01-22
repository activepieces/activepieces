import { AuthenticationResponse } from '@activepieces/shared'
import { FederatedAuthnLoginResponse, ThirdPartyAuthnProviderEnum } from '@activepieces/shared'
import { providers } from './authn-provider/authn-provider'
import { platformService } from '../../../platform/platform.service'


export const federatedAuthnService = {
    async login({ providerName, platformId }: LoginParams): Promise<FederatedAuthnLoginResponse> {
        const provider = providers[providerName]
        const platform = await platformService.getOneOrThrow(platformId)
        const loginUrl = await provider.getLoginUrl(platform)

        return {
            loginUrl,
        }
    },

    async claim({ platformId, providerName, code }: ClaimParams): Promise<AuthenticationResponse> {
        const provider = providers[providerName]
        const platform = await platformService.getOneOrThrow(platformId)
        return provider.authenticate(platform, code)
    },
}

type LoginParams = {
    platformId: string
    providerName: ThirdPartyAuthnProviderEnum
}


type ClaimParams = {
    platformId: string
    providerName: ThirdPartyAuthnProviderEnum
    code: string
}
