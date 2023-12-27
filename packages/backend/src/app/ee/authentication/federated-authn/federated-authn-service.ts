import { AuthenticationResponse } from '@activepieces/shared'
import { FederatedAuthnLoginResponse, ThirdPartyAuthnProviderEnum } from '@activepieces/ee-shared'
import { providers } from './authn-provider/authn-provider'


export const federatedAuthnService = {
    async login({ providerName }: LoginParams): Promise<FederatedAuthnLoginResponse> {
        const provider = providers[providerName]
        const loginUrl = await provider.getLoginUrl()

        return {
            loginUrl,
        }
    },

    async claim({ platformId, providerName, code }: ClaimParams): Promise<AuthenticationResponse> {
        const provider = providers[providerName]
        return provider.authenticate(platformId, code)
    },
}

type LoginParams = {
    providerName: ThirdPartyAuthnProviderEnum
}


type ClaimParams = {
    platformId: string | null
    providerName: ThirdPartyAuthnProviderEnum
    code: string
}
