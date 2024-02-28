export enum ThirdPartyAuthnProviderEnum {
    GOOGLE = 'google',
    GITHUB = 'github',
}

export type ThirdPartyAuthnProvidersToShowMap = {
    [k in ThirdPartyAuthnProviderEnum]: boolean;
}