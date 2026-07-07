import { ApId, BaseModelSchema, DateOrString, Nullable } from '@activepieces/core-utils'
import { z } from 'zod'
import { FederatedAuthnProviderConfig, FederatedAuthnProviderConfigWithoutSensitiveData } from '../../core/federated-authn'
import { SsoDomainVerification } from './sso-domain-verification'

export enum FilteredPieceBehavior {
    ALLOWED = 'ALLOWED',
    BLOCKED = 'BLOCKED',
}

export const PlatformUsage = z.object({
    creditsUsed: z.number(),
    creditsRemaining: Nullable(z.number()),
    creditsNextResetAt: Nullable(z.string()),
    appSumoAiCreditsUsed: Nullable(z.number()),
    appSumoAiCreditsRemaining: Nullable(z.number()),
    activeFlows: z.number(),
    teamProjects: z.number(),
    users: z.number(),
})

export type PlatformUsage = z.infer<typeof PlatformUsage>

export enum PlanName {
    FREE = 'free',
    ENTERPRISE = 'enterprise',
    APPSUMO = 'appsumo',
}

export enum AiCreditsAutoTopUpState {
    ENABLED = 'enabled',
    DISABLED = 'disabled',
}

// The canonical Autumn feature ids. Values MUST equal the matching `platform_plan` column names (camelCase):
// they are projected onto the plan verbatim and forwarded as Autumn `featureId`s. Keep aligned with the
// Autumn dashboard.
export enum AutumnFeatureId {
    AP_CREDITS = 'apCredits',
    APP_SUMO_AI_CREDITS = 'appSumoAiCredits',
    TEAM_PROJECTS_LIMIT = 'teamProjectsLimit',
    USERS_LIMIT = 'usersLimit',
    ACTIVE_FLOWS_LIMIT = 'activeFlowsLimit',
    BILLING_ENFORCED = 'billingEnforced',
    TABLES_ENABLED = 'tablesEnabled',
    EVENT_STREAMING_ENABLED = 'eventStreamingEnabled',
    ENVIRONMENTS_ENABLED = 'environmentsEnabled',
    ANALYTICS_ENABLED = 'analyticsEnabled',
    SHOW_POWERED_BY = 'showPoweredBy',
    AUDIT_LOG_ENABLED = 'auditLogEnabled',
    EMBEDDING_ENABLED = 'embeddingEnabled',
    AI_PROVIDERS_ENABLED = 'aiProvidersEnabled',
    CHAT_ENABLED = 'chatEnabled',
    DATA_MANIPULATION_ENABLED = 'dataManipulationEnabled',
    MANAGE_PIECES_ENABLED = 'managePiecesEnabled',
    MANAGE_TEMPLATES_ENABLED = 'manageTemplatesEnabled',
    CUSTOM_APPEARANCE_ENABLED = 'customAppearanceEnabled',
    PROJECT_ROLES_ENABLED = 'projectRolesEnabled',
    GLOBAL_CONNECTIONS_ENABLED = 'globalConnectionsEnabled',
    CUSTOM_ROLES_ENABLED = 'customRolesEnabled',
    API_KEYS_ENABLED = 'apiKeysEnabled',
    SSO_ENABLED = 'ssoEnabled',
    SECRET_MANAGERS_ENABLED = 'secretManagersEnabled',
    SCIM_ENABLED = 'scimEnabled',
}


export const PlatformPlan = z.object({
    ...BaseModelSchema,
    // TODO: We have to use the enum when we finalize the plan names
    plan: Nullable(z.string()),
    platformId: z.string(),
    includedCredits: z.number(),

    tablesEnabled: z.boolean(),
    eventStreamingEnabled: z.boolean(),

    environmentsEnabled: z.boolean(),
    analyticsEnabled: z.boolean(),
    showPoweredBy: z.boolean(),
    auditLogEnabled: z.boolean(),
    embeddingEnabled: z.boolean(),
    aiProvidersEnabled: z.boolean(),
    chatEnabled: z.boolean(),
    dataManipulationEnabled: z.boolean(),
    managePiecesEnabled: z.boolean(),
    manageTemplatesEnabled: z.boolean(),
    customAppearanceEnabled: z.boolean(),
    teamProjectsLimit: Nullable(z.number()),
    usersLimit: Nullable(z.number()),
    projectRolesEnabled: z.boolean(),
    globalConnectionsEnabled: z.boolean(),
    customRolesEnabled: z.boolean(),
    apiKeysEnabled: z.boolean(),
    ssoEnabled: z.boolean(),
    secretManagersEnabled: z.boolean(),
    scimEnabled: z.boolean(),
    licenseKey: Nullable(z.string()),
    licenseExpiresAt: Nullable(DateOrString),

    projectsLimit: Nullable(z.number()),
    activeFlowsLimit: Nullable(z.number()),

    /** @deprecated use workerGroupId instead — will be removed in 0.83.0 */
    dedicatedWorkers: Nullable(z.object({
        trustedEnvironment: z.boolean(),
    })),
    /** @deprecated use workerGroupId instead — will be removed in 0.83.0 */
    canary: z.boolean(),
    /** @deprecated custom domains have been removed; column kept for backwards compatibility with existing DBs */
    customDomainsEnabled: z.boolean(),
    workerGroupId: Nullable(z.string()),
})
export type PlatformPlan = z.infer<typeof PlatformPlan>

export const PlatformPlanLimits = PlatformPlan.omit({ id: true, platformId: true, created: true, updated: true })
export type PlatformPlanLimits = z.infer<typeof PlatformPlanLimits>
export type PlatformPlanWithOnlyLimits = PlatformPlanLimits

export const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

const hexColor = z.string().regex(HEX_COLOR_PATTERN, 'invalidHexColor')

export const PlatformThemeColors = z.object({
    avatar: hexColor.optional(),
    'blue-link': hexColor.optional(),
    danger: hexColor.optional(),
    selection: hexColor.optional(),
    primary: z.object({
        dark: hexColor.optional(),
        light: hexColor.optional(),
        medium: hexColor.optional(),
    }).optional(),
    warn: z.object({
        default: hexColor.optional(),
        light: hexColor.optional(),
        dark: hexColor.optional(),
    }).optional(),
    success: z.object({
        default: hexColor.optional(),
        light: hexColor.optional(),
    }).optional(),
})
export type PlatformThemeColors = z.infer<typeof PlatformThemeColors>

export const PIECE_SELECTOR_BUILTIN_TABS = ['EXPLORE', 'APPS', 'UTILITY', 'AI_AND_AGENTS', 'APPROVALS'] as const

export const PieceSelectorTabSection = z.object({
    id: z.string(),
    title: z.string().min(1).max(40),
    pieceNames: z.array(z.string()),
})
export type PieceSelectorTabSection = z.infer<typeof PieceSelectorTabSection>

export const PieceSelectorTabConfig = z.object({
    id: z.string(),
    kind: z.enum(['BUILTIN', 'CUSTOM']),
    builtinTab: z.enum(PIECE_SELECTOR_BUILTIN_TABS).optional(),
    title: z.string().max(40).optional(),
    icon: z.string().optional(),
    hidden: z.boolean(),
    pieceNames: z.array(z.string()).optional(),
    sections: z.array(PieceSelectorTabSection).optional(),
}).refine(
    (tab) => tab.kind !== 'CUSTOM' || (tab.title?.trim().length ?? 0) > 0,
    { message: 'Custom tabs must have a name', path: ['title'] },
)
export type PieceSelectorTabConfig = z.infer<typeof PieceSelectorTabConfig>

export const PieceSelectorConfig = z.object({
    tabs: z.array(PieceSelectorTabConfig),
})
export type PieceSelectorConfig = z.infer<typeof PieceSelectorConfig>

export const Platform = z.object({
    ...BaseModelSchema,
    ownerId: ApId,
    name: z.string(),
    primaryColor: z.string(),
    themeColors: Nullable(PlatformThemeColors),
    logoIconUrl: z.string(),
    fullLogoUrl: z.string(),
    favIconUrl: z.string(),
    /**
    * @deprecated Use projects filter instead.
    */
    filteredPieceNames: z.array(z.string()),
    /**
    * @deprecated Use projects filter instead.
    */
    filteredPieceBehavior: z.nativeEnum(FilteredPieceBehavior),
    cloudAuthEnabled: z.boolean(),
    googleAuthEnabled: z.boolean(),
    enforceAllowedAuthDomains: z.boolean(),
    allowedAuthDomains: z.array(z.string()),
    allowedEmbedOrigins: z.array(z.string()),
    ssoDomain: Nullable(z.string()),
    ssoDomainVerification: Nullable(SsoDomainVerification),
    federatedAuthProviders: FederatedAuthnProviderConfig,
    emailAuthEnabled: z.boolean(),
    pinnedPieces: z.array(z.string()),
    pieceSelectorConfig: Nullable(PieceSelectorConfig),
})
export type Platform = z.infer<typeof Platform>
export type PlatformWithoutFederatedAuth = Omit<Platform, 'federatedAuthProviders'>

export const PlatformWithoutSensitiveData = z.object({
    federatedAuthProviders: Nullable(FederatedAuthnProviderConfigWithoutSensitiveData),
    plan: PlatformPlanLimits,
    usage: PlatformUsage.optional(),
    id: z.string(),
    created: DateOrString,
    updated: DateOrString,
    ownerId: ApId,
    name: z.string(),
    primaryColor: z.string(),
    themeColors: Nullable(PlatformThemeColors),
    logoIconUrl: z.string(),
    fullLogoUrl: z.string(),
    favIconUrl: z.string(),
    filteredPieceNames: z.array(z.string()),
    filteredPieceBehavior: z.nativeEnum(FilteredPieceBehavior),
    cloudAuthEnabled: z.boolean(),
    googleAuthEnabled: z.boolean(),
    enforceAllowedAuthDomains: z.boolean(),
    allowedAuthDomains: z.array(z.string()),
    allowedEmbedOrigins: z.array(z.string()),
    ssoDomain: Nullable(z.string()),
    ssoDomainVerification: Nullable(SsoDomainVerification),
    emailAuthEnabled: z.boolean(),
    pinnedPieces: z.array(z.string()),
    pieceSelectorConfig: Nullable(PieceSelectorConfig),
})
export type PlatformWithoutSensitiveData = z.infer<typeof PlatformWithoutSensitiveData>

export const AutoTopUpConfig = z.object({
    featureId: z.enum(AutumnFeatureId),
    enabled: z.boolean(),
    threshold: z.number(),
    quantity: z.number(),
    maxMonthlyTopUps: Nullable(z.number()),
})
export type AutoTopUpConfig = z.infer<typeof AutoTopUpConfig>

export const ToppableFeature = z.object({
    featureId: z.enum(AutumnFeatureId),
    pricePerUnit: z.number(),
    billingUnits: z.number(),
})
export type ToppableFeature = z.infer<typeof ToppableFeature>

export const ProjectCreditUsage = z.object({
    projectId: z.string(),
    projectName: z.string(),
    creditsUsed: z.number(),
})
export type ProjectCreditUsage = z.infer<typeof ProjectCreditUsage>

export const PlatformBillingInformation = z.object({
    plan: PlatformPlan,
    usage: PlatformUsage,
    autumnPlanName: Nullable(z.string()),
    scheduledPlanName: Nullable(z.string()),
    nextBillingDate: z.string(),
    nextBillingAmount: z.number(),
    cancelAt: Nullable(z.string()),
    trialEndsAt: Nullable(z.string()),
    autoTopUps: z.array(AutoTopUpConfig),
    topUpFeatures: z.array(ToppableFeature),
    billingPortalAvailable: z.boolean(),
})
export type PlatformBillingInformation = z.infer<typeof PlatformBillingInformation>
