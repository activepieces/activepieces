export enum ThirdPartyAuthnProviderEnum {
    GOOGLE = 'GOOGLE',
    GITHUB = 'GITHUB',
}

export type ThirdPartyAuthnProvidersToShowMap = {
    [k in ThirdPartyAuthnProviderEnum]: boolean;
  };