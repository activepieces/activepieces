import { Static, Type } from '@sinclair/typebox'
import { LocalesEnum } from '../common'
import { BaseModelSchema, Nullable } from '../common/base-model'
import { ApId } from '../common/id-generator'
import { FederatedAuthnProviderConfig, FederatedAuthnProviderConfigWithoutSensitiveData } from '../federated-authn'

export type PlatformId = ApId

export enum FilteredPieceBehavior {
    ALLOWED = 'ALLOWED',
    BLOCKED = 'BLOCKED',
}

export const SMTPInformation = Type.Object({
    user: Type.String(),
    senderEmail: Type.String(),
    senderName: Type.String(),
    password: Type.String(),
    host: Type.String(),
    port: Type.Number(),
})

export type SMTPInformation = Static<typeof SMTPInformation>

export const Platform = Type.Object({
    ...BaseModelSchema,
    ownerId: ApId,
    name: Type.String(),
    primaryColor: Type.String(),
    logoIconUrl: Type.String(),
    fullLogoUrl: Type.String(),
    favIconUrl: Type.String(),
    /**
    * @deprecated Use projects filter instead.
    */
    filteredPieceNames: Type.Array(Type.String()),
    /**
    * @deprecated Use projects filter instead.
    */
    filteredPieceBehavior: Type.Enum(FilteredPieceBehavior),
    smtp: Type.Optional(SMTPInformation),
    cloudAuthEnabled: Type.Boolean(),
    gitSyncEnabled: Type.Boolean(),
    analyticsEnabled: Type.Boolean(),
    showPoweredBy: Type.Boolean(),
    auditLogEnabled: Type.Boolean(),
    embeddingEnabled: Type.Boolean(),
    managePiecesEnabled: Type.Boolean(),
    manageTemplatesEnabled: Type.Boolean(),
    customAppearanceEnabled: Type.Boolean(),
    manageProjectsEnabled: Type.Boolean(),
    projectRolesEnabled: Type.Boolean(),
    customDomainsEnabled: Type.Boolean(),
    globalConnectionsEnabled: Type.Boolean(),
    customRolesEnabled: Type.Boolean(),
    apiKeysEnabled: Type.Boolean(),
    flowIssuesEnabled: Type.Boolean(),
    alertsEnabled: Type.Boolean(),
    defaultLocale: Type.Optional(Type.Enum(LocalesEnum)),
    ssoEnabled: Type.Boolean(),
    enforceAllowedAuthDomains: Type.Boolean(),
    allowedAuthDomains: Type.Array(Type.String()),
    federatedAuthProviders: FederatedAuthnProviderConfig,
    emailAuthEnabled: Type.Boolean(),
    licenseKey: Type.Optional(Type.String()),
    pinnedPieces: Type.Array(Type.String()),
})

export type Platform = Static<typeof Platform>

export const PlatformWithoutSensitiveData = Type.Composite([Type.Object({
    federatedAuthProviders: FederatedAuthnProviderConfigWithoutSensitiveData,
    defaultLocale: Nullable(Type.String()),
    smtp: Type.Optional(Type.Object({})),
}), Type.Omit(Platform, ['smtp', 'federatedAuthProviders', 'defaultLocale'])])

export type PlatformWithoutSensitiveData = Static<typeof PlatformWithoutSensitiveData>
