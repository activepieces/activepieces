import { Static } from '@sinclair/typebox';
import { ThirdPartyAuthnProviderEnum } from './authn-provider-name';
export * from './authn-provider-name';
export declare const federatedAuthnLoginResponse: import("@sinclair/typebox").TObject<{
    loginUrl: import("@sinclair/typebox").TString;
}>;
export type FederatedAuthnLoginResponse = Static<typeof federatedAuthnLoginResponse>;
export declare const ClaimTokenRequest: import("@sinclair/typebox").TObject<{
    providerName: import("@sinclair/typebox").TEnum<typeof ThirdPartyAuthnProviderEnum>;
    code: import("@sinclair/typebox").TString;
}>;
export type ClaimTokenRequest = Static<typeof ClaimTokenRequest>;
export declare const GoogleAuthnProviderConfig: import("@sinclair/typebox").TObject<{
    clientId: import("@sinclair/typebox").TString;
    clientSecret: import("@sinclair/typebox").TString;
}>;
export type GoogleAuthnProviderConfig = Static<typeof GoogleAuthnProviderConfig>;
export declare const GithubAuthnProviderConfig: import("@sinclair/typebox").TObject<{
    clientId: import("@sinclair/typebox").TString;
    clientSecret: import("@sinclair/typebox").TString;
}>;
export type GithubAuthnProviderConfig = Static<typeof GithubAuthnProviderConfig>;
export declare const SAMLAuthnProviderConfig: import("@sinclair/typebox").TObject<{
    idpMetadata: import("@sinclair/typebox").TString;
    idpCertificate: import("@sinclair/typebox").TString;
}>;
export type SAMLAuthnProviderConfig = Static<typeof SAMLAuthnProviderConfig>;
export declare const FederatedAuthnProviderConfig: import("@sinclair/typebox").TObject<{
    google: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
        clientId: string;
        clientSecret: string;
    }>>;
    github: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
        clientId: string;
        clientSecret: string;
    }>>;
    saml: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
        idpMetadata: string;
        idpCertificate: string;
    }>>;
}>;
export type FederatedAuthnProviderConfig = Static<typeof FederatedAuthnProviderConfig>;
export declare const FederatedAuthnProviderConfigWithoutSensitiveData: import("@sinclair/typebox").TObject<{
    google: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
        clientId: string;
    }>>;
    github: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
        clientId: string;
    }>>;
    saml: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{}>>;
}>;
export type FederatedAuthnProviderConfigWithoutSensitiveData = Static<typeof FederatedAuthnProviderConfigWithoutSensitiveData>;
