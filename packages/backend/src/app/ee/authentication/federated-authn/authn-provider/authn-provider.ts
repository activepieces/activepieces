import { AuthenticationResponse } from '@activepieces/shared'
import { Platform, ThirdPartyAuthnProviderEnum } from '@activepieces/ee-shared'
import { googleAuthnProvider } from './google-authn-provider'
import { gitHubAuthnProvider } from './github-authn-provider'

export type AuthnProvider = {
    getLoginUrl: (platform: Platform) => Promise<string>
    authenticate: (platform: Platform, authorizationCode: string) => Promise<AuthenticationResponse>
}


export const providers: Record<ThirdPartyAuthnProviderEnum, AuthnProvider> = {
    [ThirdPartyAuthnProviderEnum.GOOGLE]: googleAuthnProvider,
    [ThirdPartyAuthnProviderEnum.GITHUB]: gitHubAuthnProvider,
}
