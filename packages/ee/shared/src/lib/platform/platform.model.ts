import { ApId, BaseModelSchema, LocalesEnum } from "@activepieces/shared";
import { Static, Type } from "@sinclair/typebox";
import { FederatedAuthnProviderConfig, FederatedAuthnProviderConfigWithoutSensitiveData } from "../authn";

export type PlatformId = ApId;

export enum FilteredPieceBehavior {
    ALLOWED = 'ALLOWED',
    BLOCKED = 'BLOCKED',
}

export const Platform = Type.Object({
    ...BaseModelSchema,
    ownerId: ApId,
    name: Type.String(),
    primaryColor: Type.String(),
    logoIconUrl: Type.String(),
    fullLogoUrl: Type.String(),
    favIconUrl: Type.String(),
    filteredPieceNames: Type.Array(Type.String()),
    filteredPieceBehavior: Type.Enum(FilteredPieceBehavior),
    smtpHost: Type.Optional(Type.String()),
    smtpPort: Type.Optional(Type.Number()),
    smtpUser: Type.Optional(Type.String()),
    smtpPassword: Type.Optional(Type.String()),
    smtpSenderEmail: Type.Optional(Type.String()),
    smtpUseSSL: Type.Optional(Type.Boolean()),
    privacyPolicyUrl: Type.Optional(Type.String()),
    termsOfServiceUrl: Type.Optional(Type.String()),
    cloudAuthEnabled: Type.Boolean(),
    gitSyncEnabled: Type.Boolean(),
    showPoweredBy: Type.Boolean(),
    embeddingEnabled: Type.Boolean(),
    defaultLocale: Type.Optional(Type.Enum(LocalesEnum)),
    ssoEnabled: Type.Boolean(),
    enforceAllowedAuthDomains: Type.Boolean(),
    allowedAuthDomains: Type.Array(Type.String()),
    federatedAuthProviders: FederatedAuthnProviderConfig,
    emailAuthEnabled: Type.Boolean()
})

export type Platform = Static<typeof Platform>

export const PlatformWithoutSensitiveData = Type.Composite([Type.Object({
    federatedAuthProviders: FederatedAuthnProviderConfigWithoutSensitiveData,
}), Type.Omit(Platform, ['smtpPassword', 'federatedAuthProviders'])] )

export type PlatformWithoutSensitiveData = Static<typeof PlatformWithoutSensitiveData>