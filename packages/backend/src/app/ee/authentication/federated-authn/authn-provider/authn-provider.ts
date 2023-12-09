import { AuthenticationResponse } from '@activepieces/shared'
import { ThirdPartyAuthnProviderEnum } from '@activepieces/ee-shared'
import { googleAuthnProvider } from './google-authn-provider'
import { gitHubAuthnProvider } from './github-authn-provider'

export type AuthnProvider = {
    getLoginUrl: () => Promise<string>
    authenticate: (authorizationCode: string) => Promise<AuthenticationResponse>
    isConfiguredByUser: () => boolean
}


export const providers: Record<ThirdPartyAuthnProviderEnum, AuthnProvider> = {
    [ThirdPartyAuthnProviderEnum.GOOGLE]: googleAuthnProvider,
    [ThirdPartyAuthnProviderEnum.GITHUB]: gitHubAuthnProvider,
}

export const showThirdPartyProvidersMap: Record<ThirdPartyAuthnProviderEnum, boolean> = {
    [ThirdPartyAuthnProviderEnum.GOOGLE]: googleAuthnProvider.isConfiguredByUser(),
    [ThirdPartyAuthnProviderEnum.GITHUB]: gitHubAuthnProvider.isConfiguredByUser(),
}
