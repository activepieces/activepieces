import { Static } from '@sinclair/typebox';
import { FilteredPieceBehavior } from './platform.model';
export declare const Base64EncodedFile: import("@sinclair/typebox").TObject<{
    base64: import("@sinclair/typebox").TString;
    mimetype: import("@sinclair/typebox").TString;
}>;
export type Base64EncodedFile = Static<typeof Base64EncodedFile>;
export declare const UpdatePlatformRequestBody: import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    primaryColor: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    logoIcon: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        filename: import("@sinclair/typebox").TString;
        data: import("@sinclair/typebox").TUnknown;
        type: import("@sinclair/typebox").TLiteral<"file">;
        mimetype: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>>;
    fullLogo: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        filename: import("@sinclair/typebox").TString;
        data: import("@sinclair/typebox").TUnknown;
        type: import("@sinclair/typebox").TLiteral<"file">;
        mimetype: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>>;
    favIcon: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        filename: import("@sinclair/typebox").TString;
        data: import("@sinclair/typebox").TUnknown;
        type: import("@sinclair/typebox").TLiteral<"file">;
        mimetype: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>>;
    filteredPieceNames: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    filteredPieceBehavior: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof FilteredPieceBehavior>>;
    federatedAuthProviders: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
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
    }>>;
    cloudAuthEnabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
    emailAuthEnabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
    allowedAuthDomains: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    enforceAllowedAuthDomains: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
    pinnedPieces: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
}>;
export type UpdatePlatformRequestBody = Static<typeof UpdatePlatformRequestBody>;
export declare const AdminRetryRunsRequestBody: import("@sinclair/typebox").TObject<{
    runIds: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    createdAfter: import("@sinclair/typebox").TString;
    createdBefore: import("@sinclair/typebox").TString;
}>;
export type AdminRetryRunsRequestBody = Static<typeof AdminRetryRunsRequestBody>;
export declare const ApplyLicenseKeyByEmailRequestBody: import("@sinclair/typebox").TObject<{
    email: import("@sinclair/typebox").TString;
    licenseKey: import("@sinclair/typebox").TString;
}>;
export type ApplyLicenseKeyByEmailRequestBody = Static<typeof ApplyLicenseKeyByEmailRequestBody>;
