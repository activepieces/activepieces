import { Static } from '@sinclair/typebox';
import { ApId } from '../common/id-generator';
export type PlatformId = ApId;
export declare enum FilteredPieceBehavior {
    ALLOWED = "ALLOWED",
    BLOCKED = "BLOCKED"
}
export declare enum PlatformUsageMetric {
    AI_CREDITS = "ai-credits",
    ACTIVE_FLOWS = "active-flows"
}
export declare const PlatformUsage: import("@sinclair/typebox").TObject<{
    aiCredits: import("@sinclair/typebox").TNumber;
    activeFlows: import("@sinclair/typebox").TNumber;
}>;
export type PlatformUsage = Static<typeof PlatformUsage>;
export declare enum AiOverageState {
    NOT_ALLOWED = "not_allowed",
    ALLOWED_BUT_OFF = "allowed_but_off",
    ALLOWED_AND_ON = "allowed_and_on"
}
export declare enum PlanName {
    STANDARD = "standard",
    ENTERPRISE = "enterprise",
    APPSUMO_ACTIVEPIECES_TIER1 = "appsumo_activepieces_tier1",
    APPSUMO_ACTIVEPIECES_TIER2 = "appsumo_activepieces_tier2",
    APPSUMO_ACTIVEPIECES_TIER3 = "appsumo_activepieces_tier3",
    APPSUMO_ACTIVEPIECES_TIER4 = "appsumo_activepieces_tier4",
    APPSUMO_ACTIVEPIECES_TIER5 = "appsumo_activepieces_tier5",
    APPSUMO_ACTIVEPIECES_TIER6 = "appsumo_activepieces_tier6"
}
export declare enum TeamProjectsLimit {
    NONE = "NONE",
    ONE = "ONE",
    UNLIMITED = "UNLIMITED"
}
export declare const PlatformPlan: import("@sinclair/typebox").TObject<{
    plan: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    openRouterApiKeyHash: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    openRouterApiKey: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    platformId: import("@sinclair/typebox").TString;
    includedAiCredits: import("@sinclair/typebox").TNumber;
    aiCreditsOverageLimit: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    aiCreditsOverageState: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    environmentsEnabled: import("@sinclair/typebox").TBoolean;
    analyticsEnabled: import("@sinclair/typebox").TBoolean;
    showPoweredBy: import("@sinclair/typebox").TBoolean;
    agentsEnabled: import("@sinclair/typebox").TBoolean;
    mcpsEnabled: import("@sinclair/typebox").TBoolean;
    tablesEnabled: import("@sinclair/typebox").TBoolean;
    todosEnabled: import("@sinclair/typebox").TBoolean;
    auditLogEnabled: import("@sinclair/typebox").TBoolean;
    embeddingEnabled: import("@sinclair/typebox").TBoolean;
    managePiecesEnabled: import("@sinclair/typebox").TBoolean;
    manageTemplatesEnabled: import("@sinclair/typebox").TBoolean;
    customAppearanceEnabled: import("@sinclair/typebox").TBoolean;
    teamProjectsLimit: import("@sinclair/typebox").TEnum<typeof TeamProjectsLimit>;
    projectRolesEnabled: import("@sinclair/typebox").TBoolean;
    customDomainsEnabled: import("@sinclair/typebox").TBoolean;
    globalConnectionsEnabled: import("@sinclair/typebox").TBoolean;
    customRolesEnabled: import("@sinclair/typebox").TBoolean;
    apiKeysEnabled: import("@sinclair/typebox").TBoolean;
    ssoEnabled: import("@sinclair/typebox").TBoolean;
    licenseKey: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    licenseExpiresAt: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    stripeCustomerId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    stripeSubscriptionId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    stripeSubscriptionStatus: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    stripeSubscriptionStartDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    stripeSubscriptionEndDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    stripeSubscriptionCancelDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    projectsLimit: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<number>>;
    activeFlowsLimit: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<number>>;
    dedicatedWorkers: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
        trustedEnvironment: boolean;
    }>>;
    id: import("@sinclair/typebox").TString;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
}>;
export type PlatformPlan = Static<typeof PlatformPlan>;
export declare const PlatformPlanLimits: import("@sinclair/typebox").TObject<{
    plan: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    openRouterApiKeyHash: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    openRouterApiKey: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    includedAiCredits: import("@sinclair/typebox").TNumber;
    aiCreditsOverageLimit: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    aiCreditsOverageState: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    environmentsEnabled: import("@sinclair/typebox").TBoolean;
    analyticsEnabled: import("@sinclair/typebox").TBoolean;
    showPoweredBy: import("@sinclair/typebox").TBoolean;
    agentsEnabled: import("@sinclair/typebox").TBoolean;
    mcpsEnabled: import("@sinclair/typebox").TBoolean;
    tablesEnabled: import("@sinclair/typebox").TBoolean;
    todosEnabled: import("@sinclair/typebox").TBoolean;
    auditLogEnabled: import("@sinclair/typebox").TBoolean;
    embeddingEnabled: import("@sinclair/typebox").TBoolean;
    managePiecesEnabled: import("@sinclair/typebox").TBoolean;
    manageTemplatesEnabled: import("@sinclair/typebox").TBoolean;
    customAppearanceEnabled: import("@sinclair/typebox").TBoolean;
    teamProjectsLimit: import("@sinclair/typebox").TEnum<typeof TeamProjectsLimit>;
    projectRolesEnabled: import("@sinclair/typebox").TBoolean;
    customDomainsEnabled: import("@sinclair/typebox").TBoolean;
    globalConnectionsEnabled: import("@sinclair/typebox").TBoolean;
    customRolesEnabled: import("@sinclair/typebox").TBoolean;
    apiKeysEnabled: import("@sinclair/typebox").TBoolean;
    ssoEnabled: import("@sinclair/typebox").TBoolean;
    licenseKey: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    licenseExpiresAt: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    stripeCustomerId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    stripeSubscriptionId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    stripeSubscriptionStatus: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    stripeSubscriptionStartDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    stripeSubscriptionEndDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    stripeSubscriptionCancelDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    projectsLimit: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<number>>;
    activeFlowsLimit: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<number>>;
    dedicatedWorkers: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
        trustedEnvironment: boolean;
    }>>;
}>;
export type PlatformPlanLimits = Static<typeof PlatformPlanLimits>;
export type PlatformPlanWithOnlyLimits = Omit<PlatformPlanLimits, 'stripeSubscriptionStartDate' | 'stripeSubscriptionEndDate' | 'stripeBillingCycle'>;
export declare const Platform: import("@sinclair/typebox").TObject<{
    ownerId: import("@sinclair/typebox").TString;
    name: import("@sinclair/typebox").TString;
    primaryColor: import("@sinclair/typebox").TString;
    logoIconUrl: import("@sinclair/typebox").TString;
    fullLogoUrl: import("@sinclair/typebox").TString;
    favIconUrl: import("@sinclair/typebox").TString;
    /**
    * @deprecated Use projects filter instead.
    */
    filteredPieceNames: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
    /**
    * @deprecated Use projects filter instead.
    */
    filteredPieceBehavior: import("@sinclair/typebox").TEnum<typeof FilteredPieceBehavior>;
    cloudAuthEnabled: import("@sinclair/typebox").TBoolean;
    enforceAllowedAuthDomains: import("@sinclair/typebox").TBoolean;
    allowedAuthDomains: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
    federatedAuthProviders: import("@sinclair/typebox").TObject<{
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
    emailAuthEnabled: import("@sinclair/typebox").TBoolean;
    pinnedPieces: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
    id: import("@sinclair/typebox").TString;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
}>;
export type Platform = Static<typeof Platform>;
export declare const PlatformWithoutSensitiveData: import("@sinclair/typebox").TObject<{
    plan: import("@sinclair/typebox").TObject<{
        plan: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        openRouterApiKeyHash: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        openRouterApiKey: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        includedAiCredits: import("@sinclair/typebox").TNumber;
        aiCreditsOverageLimit: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
        aiCreditsOverageState: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        environmentsEnabled: import("@sinclair/typebox").TBoolean;
        analyticsEnabled: import("@sinclair/typebox").TBoolean;
        showPoweredBy: import("@sinclair/typebox").TBoolean;
        agentsEnabled: import("@sinclair/typebox").TBoolean;
        mcpsEnabled: import("@sinclair/typebox").TBoolean;
        tablesEnabled: import("@sinclair/typebox").TBoolean;
        todosEnabled: import("@sinclair/typebox").TBoolean;
        auditLogEnabled: import("@sinclair/typebox").TBoolean;
        embeddingEnabled: import("@sinclair/typebox").TBoolean;
        managePiecesEnabled: import("@sinclair/typebox").TBoolean;
        manageTemplatesEnabled: import("@sinclair/typebox").TBoolean;
        customAppearanceEnabled: import("@sinclair/typebox").TBoolean;
        teamProjectsLimit: import("@sinclair/typebox").TEnum<typeof TeamProjectsLimit>;
        projectRolesEnabled: import("@sinclair/typebox").TBoolean;
        customDomainsEnabled: import("@sinclair/typebox").TBoolean;
        globalConnectionsEnabled: import("@sinclair/typebox").TBoolean;
        customRolesEnabled: import("@sinclair/typebox").TBoolean;
        apiKeysEnabled: import("@sinclair/typebox").TBoolean;
        ssoEnabled: import("@sinclair/typebox").TBoolean;
        licenseKey: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        licenseExpiresAt: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        stripeCustomerId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        stripeSubscriptionId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        stripeSubscriptionStatus: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        stripeSubscriptionStartDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
        stripeSubscriptionEndDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
        stripeSubscriptionCancelDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
        projectsLimit: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<number>>;
        activeFlowsLimit: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<number>>;
        dedicatedWorkers: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
            trustedEnvironment: boolean;
        }>>;
    }>;
    federatedAuthProviders: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
        google?: {
            clientId: string;
        };
        saml?: {};
        github?: {
            clientId: string;
        };
    }>>;
    usage: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        aiCredits: import("@sinclair/typebox").TNumber;
        activeFlows: import("@sinclair/typebox").TNumber;
    }>>;
    name: import("@sinclair/typebox").TString;
    id: import("@sinclair/typebox").TString;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
    ownerId: import("@sinclair/typebox").TString;
    primaryColor: import("@sinclair/typebox").TString;
    logoIconUrl: import("@sinclair/typebox").TString;
    fullLogoUrl: import("@sinclair/typebox").TString;
    favIconUrl: import("@sinclair/typebox").TString;
    filteredPieceNames: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
    filteredPieceBehavior: import("@sinclair/typebox").TEnum<typeof FilteredPieceBehavior>;
    cloudAuthEnabled: import("@sinclair/typebox").TBoolean;
    enforceAllowedAuthDomains: import("@sinclair/typebox").TBoolean;
    allowedAuthDomains: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
    emailAuthEnabled: import("@sinclair/typebox").TBoolean;
    pinnedPieces: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
}>;
export type PlatformWithoutSensitiveData = Static<typeof PlatformWithoutSensitiveData>;
export declare const PlatformBillingInformation: import("@sinclair/typebox").TObject<{
    plan: import("@sinclair/typebox").TObject<{
        plan: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        openRouterApiKeyHash: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        openRouterApiKey: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        platformId: import("@sinclair/typebox").TString;
        includedAiCredits: import("@sinclair/typebox").TNumber;
        aiCreditsOverageLimit: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
        aiCreditsOverageState: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        environmentsEnabled: import("@sinclair/typebox").TBoolean;
        analyticsEnabled: import("@sinclair/typebox").TBoolean;
        showPoweredBy: import("@sinclair/typebox").TBoolean;
        agentsEnabled: import("@sinclair/typebox").TBoolean;
        mcpsEnabled: import("@sinclair/typebox").TBoolean;
        tablesEnabled: import("@sinclair/typebox").TBoolean;
        todosEnabled: import("@sinclair/typebox").TBoolean;
        auditLogEnabled: import("@sinclair/typebox").TBoolean;
        embeddingEnabled: import("@sinclair/typebox").TBoolean;
        managePiecesEnabled: import("@sinclair/typebox").TBoolean;
        manageTemplatesEnabled: import("@sinclair/typebox").TBoolean;
        customAppearanceEnabled: import("@sinclair/typebox").TBoolean;
        teamProjectsLimit: import("@sinclair/typebox").TEnum<typeof TeamProjectsLimit>;
        projectRolesEnabled: import("@sinclair/typebox").TBoolean;
        customDomainsEnabled: import("@sinclair/typebox").TBoolean;
        globalConnectionsEnabled: import("@sinclair/typebox").TBoolean;
        customRolesEnabled: import("@sinclair/typebox").TBoolean;
        apiKeysEnabled: import("@sinclair/typebox").TBoolean;
        ssoEnabled: import("@sinclair/typebox").TBoolean;
        licenseKey: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        licenseExpiresAt: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        stripeCustomerId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        stripeSubscriptionId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        stripeSubscriptionStatus: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        stripeSubscriptionStartDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
        stripeSubscriptionEndDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
        stripeSubscriptionCancelDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
        projectsLimit: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<number>>;
        activeFlowsLimit: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<number>>;
        dedicatedWorkers: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
            trustedEnvironment: boolean;
        }>>;
        id: import("@sinclair/typebox").TString;
        created: import("@sinclair/typebox").TString;
        updated: import("@sinclair/typebox").TString;
    }>;
    usage: import("@sinclair/typebox").TObject<{
        aiCredits: import("@sinclair/typebox").TNumber;
        activeFlows: import("@sinclair/typebox").TNumber;
    }>;
    nextBillingDate: import("@sinclair/typebox").TNumber;
    nextBillingAmount: import("@sinclair/typebox").TNumber;
    cancelAt: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
}>;
export type PlatformBillingInformation = Static<typeof PlatformBillingInformation>;
