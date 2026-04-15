export enum ThirdPartyAuthnProviderEnum {
    GOOGLE = 'google',
    SAML = 'saml',
}

export type ThirdPartyAuthnProvidersToShowMap = {
    [k in ThirdPartyAuthnProviderEnum]: boolean;
}