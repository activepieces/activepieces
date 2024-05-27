export enum ThirdPartyAuthnProviderEnum {
    GOOGLE = 'google',
    GITHUB = 'github',
    SAML = 'saml',
}

export type ThirdPartyAuthnProvidersToShowMap = {
    [k in ThirdPartyAuthnProviderEnum]: boolean;
}