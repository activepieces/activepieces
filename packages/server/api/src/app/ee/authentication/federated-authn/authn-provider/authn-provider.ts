import { gitHubAuthnProvider } from './github-authn-provider'
import { googleAuthnProvider } from './google-authn-provider'
import { AuthenticationResponse, Platform, ThirdPartyAuthnProviderEnum } from '@activepieces/shared'

export type AuthnProvider = {
    getLoginUrl: (hostname: string, platform: Platform) => Promise<string>
    authenticate: (
        hostname: string,
        platform: Platform,
        authorizationCode: string
    ) => Promise<AuthenticationResponse>
}

export const providers: Record<ThirdPartyAuthnProviderEnum, AuthnProvider> = {
    [ThirdPartyAuthnProviderEnum.GOOGLE]: googleAuthnProvider,
    [ThirdPartyAuthnProviderEnum.GITHUB]: gitHubAuthnProvider,
}
