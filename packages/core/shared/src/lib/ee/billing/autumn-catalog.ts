import { isNil } from '@activepieces/core-utils'
import { PlanName, PlatformPlanLimits } from '../../management/platform'

export const AUTUMN_FEATURE = {
    CREDITS: 'credits',
    PROJECTS: 'projects',
    USERS: 'users',
    ACTIVE_FLOWS: 'active_flows',
    BILLING_ENFORCED: 'billing_enforced',
} as const

export const AUTUMN_FLAG_FEATURES = [
    'tablesEnabled',
    'eventStreamingEnabled',
    'environmentsEnabled',
    'analyticsEnabled',
    'showPoweredBy',
    'auditLogEnabled',
    'embeddingEnabled',
    'agentsEnabled',
    'aiProvidersEnabled',
    'chatEnabled',
    'dataManipulationEnabled',
    'managePiecesEnabled',
    'manageTemplatesEnabled',
    'customAppearanceEnabled',
    'projectRolesEnabled',
    'globalConnectionsEnabled',
    'customRolesEnabled',
    'apiKeysEnabled',
    'ssoEnabled',
    'secretManagersEnabled',
    'scimEnabled',
] as const satisfies readonly (keyof PlatformPlanLimits)[]

export const AUTUMN_PLAN_ID = {
    FREE: 'free',
    STANDARD: PlanName.STANDARD,
    ENTERPRISE: PlanName.ENTERPRISE,
    APPSUMO_TIER1: PlanName.APPSUMO_ACTIVEPIECES_TIER1,
    APPSUMO_TIER2: PlanName.APPSUMO_ACTIVEPIECES_TIER2,
    APPSUMO_TIER3: PlanName.APPSUMO_ACTIVEPIECES_TIER3,
    APPSUMO_TIER4: PlanName.APPSUMO_ACTIVEPIECES_TIER4,
    APPSUMO_TIER5: PlanName.APPSUMO_ACTIVEPIECES_TIER5,
    APPSUMO_TIER6: PlanName.APPSUMO_ACTIVEPIECES_TIER6,
} as const

export const AUTUMN_CREDITS_TOPUP_PRODUCT_ID = 'credits_topup'

export const SUPPORTED_PLAN_IDS: readonly string[] = Object.values(AUTUMN_PLAN_ID)

export function autumnPlanIdToPlanName(planId: string | null): PlanName | null {
    if (isNil(planId) || planId === AUTUMN_PLAN_ID.FREE) {
        return null
    }
    return Object.values(PlanName).find((name) => name === planId) ?? null
}

export function isSupportedAutumnPlanId(planId: string): boolean {
    return SUPPORTED_PLAN_IDS.includes(planId)
}

export function projectAutumnEntitlements(entitlements: AutumnEntitlements): Partial<PlatformPlanLimits> {
    const projectedFlags: Partial<PlatformPlanLimits> = {}
    for (const feature of AUTUMN_FLAG_FEATURES) {
        projectedFlags[feature] = entitlements.flags[feature] ?? false
    }

    const projects = entitlements.balances[AUTUMN_FEATURE.PROJECTS]
    const credits = entitlements.balances[AUTUMN_FEATURE.CREDITS]

    return {
        ...projectedFlags,
        plan: autumnPlanIdToPlanName(entitlements.planId),
        projectsLimit: isNil(projects) || projects.unlimited ? null : projects.granted,
        includedAiCredits: credits?.granted ?? 0,
        activeFlowsLimit: undefined,
    }
}

export type AutumnFlagFeature = typeof AUTUMN_FLAG_FEATURES[number]

export type AutumnFeatureBalance = {
    granted: number | null
    usage: number
    remaining: number | null
    unlimited: boolean
    nextResetAt: number | null
}

export type AutumnEntitlements = {
    planId: string | null
    flags: Record<string, boolean>
    balances: Record<string, AutumnFeatureBalance>
}
