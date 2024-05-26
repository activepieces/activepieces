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

const emptyProvider: AuthnProvider = {
    getLoginUrl: async () => {
        throw new Error('No provider configured')
    },
    authenticate: async () => {
        throw new Error('No provider configured')
    },
}

export const providers: Record<ThirdPartyAuthnProviderEnum, AuthnProvider> = {
    [ThirdPartyAuthnProviderEnum.GOOGLE]: googleAuthnProvider,
    [ThirdPartyAuthnProviderEnum.GITHUB]: gitHubAuthnProvider,
    [ThirdPartyAuthnProviderEnum.SAML]: emptyProvider,
}


export type FebderatedAuthnIdToken = {
    email: string
    firstName: string
    lastName: string
}
