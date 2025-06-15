import { Static, Type } from '@sinclair/typebox'
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


export enum PlatformUsageMetric {
    TASKS = 'tasks',
    AI_TOKENS = 'ai-tokens',
    ACTIVE_FLOWS = 'active-flows',
    USER_SEATS = 'user-seats',
    PROJECTS = 'projects',
    TABLES = 'tables',
}


export const PlatformUsage = Type.Object({
    tasks: Type.Number(),
    aiCredits: Type.Number(),
    activeFlows: Type.Number(),
    tables: Type.Number(),
    mcp: Type.Number(),
    seats: Type.Number(),
    projects: Type.Number(),
})

export type PlatformUsage = Static<typeof PlatformUsage>


export const PlatformPlan = Type.Object({
    ...BaseModelSchema,
    platformId: Type.String(),
    includedTasks: Type.Number(),
    includedAiCredits: Type.Number(),
    tasksLimit: Type.Optional(Type.Number()),
    aiCreditsLimit: Type.Optional(Type.Number()),

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

    tablesEnabled: Type.Boolean(),
    todosEnabled: Type.Boolean(),

    alertsEnabled: Type.Boolean(),
    ssoEnabled: Type.Boolean(),
    
    licenseKey: Type.Optional(Type.String()),

    stripeCustomerId: Type.Optional(Type.String()),
    stripeSubscriptionId: Type.Optional(Type.String()),
    stripeSubscriptionStatus: Type.Optional(Type.String()),

    userSeatsLimit: Type.Optional(Type.Number()),
    projectsLimit: Type.Optional(Type.Number()),
    tablesLimit: Type.Optional(Type.Number()),
    mcpLimit: Type.Optional(Type.Number()),
    activeFlowsLimit: Type.Optional(Type.Number()),
    agentsLimit: Type.Optional(Type.Number()),
})
  
export type PlatformPlan = Static<typeof PlatformPlan>

export const PlatformPlanLimits = Type.Omit(PlatformPlan, ['id', 'platformId', 'created', 'updated'])
export type PlatformPlanLimits = Static<typeof PlatformPlanLimits>

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
    smtp: Nullable(SMTPInformation),
    cloudAuthEnabled: Type.Boolean(),
    enforceAllowedAuthDomains: Type.Boolean(),
    allowedAuthDomains: Type.Array(Type.String()),
    federatedAuthProviders: FederatedAuthnProviderConfig,
    emailAuthEnabled: Type.Boolean(),
    pinnedPieces: Type.Array(Type.String()),
    copilotSettings: Type.Optional(CopilotSettings),
})

export type Platform = Static<typeof Platform>


export const PlatformWithoutSensitiveData = Type.Composite([Type.Object({
    federatedAuthProviders: Nullable(FederatedAuthnProviderConfigWithoutSensitiveData),
    copilotSettings: Type.Optional(CopilotSettingsWithoutSensitiveData),
    smtp: Nullable(Type.Object({})),
    plan: PlatformPlanLimits,
    hasLicenseKey: Type.Optional(Type.Boolean()),
    licenseExpiresAt: Type.Optional(Type.String()),
}), Type.Pick(Platform, [
    'id',
    'created',
    'updated',
    'ownerId',
    'name',
    'plan',
    'primaryColor',
    'logoIconUrl',
    'fullLogoUrl',
    'favIconUrl',
    'filteredPieceNames',
    'filteredPieceBehavior',
    'cloudAuthEnabled',
    'enforceAllowedAuthDomains',
    'allowedAuthDomains',
    'emailAuthEnabled',
    'pinnedPieces',
])])

export type PlatformWithoutSensitiveData = Static<typeof PlatformWithoutSensitiveData>


export const PlatformBillingInformation = Type.Object({
    plan: PlatformPlan,
    usage: PlatformUsage,
    nextBillingDate: Type.String(),
})

export type PlatformBillingInformation = Static<typeof PlatformBillingInformation>

