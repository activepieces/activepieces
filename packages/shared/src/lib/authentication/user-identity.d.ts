import { Static } from '@sinclair/typebox';
export declare enum UserIdentityProvider {
    EMAIL = "EMAIL",
    GOOGLE = "GOOGLE",
    SAML = "SAML",
    JWT = "JWT"
}
export declare const UserIdentity: import("@sinclair/typebox").TObject<{
    firstName: import("@sinclair/typebox").TString;
    lastName: import("@sinclair/typebox").TString;
    email: import("@sinclair/typebox").TString;
    password: import("@sinclair/typebox").TString;
    trackEvents: import("@sinclair/typebox").TBoolean;
    newsLetter: import("@sinclair/typebox").TBoolean;
    verified: import("@sinclair/typebox").TBoolean;
    tokenVersion: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    provider: import("@sinclair/typebox").TEnum<typeof UserIdentityProvider>;
    id: import("@sinclair/typebox").TString;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
}>;
export type UserIdentity = Static<typeof UserIdentity>;
