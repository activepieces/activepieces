export enum ThirdPartyAuthnProviderEnum {
    GOOGLE = 'google',
    OIDC = 'oidc',
    SAML = 'saml',
}

export type ThirdPartyAuthnProvidersToShowMap = {
    [k in ThirdPartyAuthnProviderEnum]: boolean;
}