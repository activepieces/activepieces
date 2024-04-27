import { gitHubAuthnProvider } from './github-authn-provider'
import { googleAuthnProvider } from './google-authn-provider'
import { Platform, ThirdPartyAuthnProviderEnum } from '@activepieces/shared'

export type AuthnProvider = {
    getLoginUrl: (hostname: string, platform: Platform) => Promise<string>
    authenticate: (
        hostname: string,
        platform: Platform,
        authorizationCode: string
    ) => Promise<FebderatedAuthnIdToken>
}

export const providers: Record<ThirdPartyAuthnProviderEnum, AuthnProvider> = {
    [ThirdPartyAuthnProviderEnum.GOOGLE]: googleAuthnProvider,
    [ThirdPartyAuthnProviderEnum.GITHUB]: gitHubAuthnProvider,
}


export type FebderatedAuthnIdToken = {
    email: string
    firstName: string
    lastName: string
}
