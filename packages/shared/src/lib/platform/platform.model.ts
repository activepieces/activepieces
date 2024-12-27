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

export enum CopilotProviderType {
    OPENAI = 'openai',
    AZURE_OPENAI = 'azureOpenai',
}
  
export const OpenAiProvider = Type.Object({
    baseUrl: Type.String(),
    apiKey: Type.String(),
})

export type OpenAiProvider = Static<typeof OpenAiProvider>

export const AzureOpenAiProvider = Type.Object({
    resourceName: Type.String(),
    deploymentName: Type.String(),
    apiKey: Type.String(),
})

export type AzureOpenAiProvider = Static<typeof AzureOpenAiProvider>

export const CopilotSettings = Type.Object({
    providers: Type.Object({
        [CopilotProviderType.OPENAI]: Type.Optional(OpenAiProvider),
        [CopilotProviderType.AZURE_OPENAI]: Type.Optional(AzureOpenAiProvider),
    }),
})

export type CopilotSettings = Static<typeof CopilotSettings>

export const CopilotSettingsWithoutSensitiveData = Type.Object({
    providers: Type.Object({
        [CopilotProviderType.OPENAI]: Type.Optional(Type.Object({})),
        [CopilotProviderType.AZURE_OPENAI]: Type.Optional(Type.Object({})),
    }),
})
export type CopilotSettingsWithoutSensitiveData = Static<typeof CopilotSettingsWithoutSensitiveData>

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
    environmentsEnabled: Type.Boolean(),
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
    copilotSettings: Type.Optional(CopilotSettings),
})

export type Platform = Static<typeof Platform>


export const PlatformWithoutSensitiveData = Type.Composite([Type.Object({
    federatedAuthProviders: FederatedAuthnProviderConfigWithoutSensitiveData,
    defaultLocale: Nullable(Type.String()),
    copilotSettings: Type.Optional(CopilotSettingsWithoutSensitiveData),
    smtp: Type.Optional(Type.Object({})),
}), Type.Pick(Platform, [
    'id',
    'created',
    'updated',
    'ownerId',
    'name',
    'primaryColor',
    'logoIconUrl',
    'fullLogoUrl',
    'favIconUrl',
    'filteredPieceNames',
    'filteredPieceBehavior',
    'cloudAuthEnabled',
    'gitSyncEnabled',
    'analyticsEnabled',
    'showPoweredBy',
    'environmentsEnabled',
    'auditLogEnabled',
    'embeddingEnabled',
    'managePiecesEnabled',
    'manageTemplatesEnabled',
    'customAppearanceEnabled',
    'manageProjectsEnabled',
    'projectRolesEnabled',
    'customDomainsEnabled',
    'globalConnectionsEnabled',
    'customRolesEnabled',
    'apiKeysEnabled',
    'flowIssuesEnabled',
    'alertsEnabled',
    'ssoEnabled',
    'enforceAllowedAuthDomains',
    'allowedAuthDomains',
    'emailAuthEnabled',
    'pinnedPieces',
])])

export type PlatformWithoutSensitiveData = Static<typeof PlatformWithoutSensitiveData>
