import { AuthenticationResponse } from '@activepieces/shared'
import { AuthnProvider } from './authn-provider/authn-provider'
import { googleAuthnProvider } from './authn-provider/google-authn-provider'
import { gitHubAuthnProvider } from './authn-provider/github-authn-provider'
import { AuthnProviderName } from '@activepieces/ee-shared'

const providers: Record<AuthnProviderName, AuthnProvider> = {
    [AuthnProviderName.GOOGLE]: googleAuthnProvider,
    [AuthnProviderName.GITHUB]: gitHubAuthnProvider,
}

export const federatedAuthnService = {
    async login({ providerName }: LoginParams): Promise<LoginResponse> {
        const provider = providers[providerName]
        const loginUrl = await provider.getLoginUrl()

        return {
            loginUrl,
        }
    },

    async claim({ providerName, code }: ClaimParams): Promise<AuthenticationResponse> {
        const provider = providers[providerName]
        return await provider.authenticate(code)
    },
}

type LoginParams = {
    providerName: AuthnProviderName
}

type LoginResponse = {
    loginUrl: string
}

type ClaimParams = {
    providerName: AuthnProviderName
    code: string
}
