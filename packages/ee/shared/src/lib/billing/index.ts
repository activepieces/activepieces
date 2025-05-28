import { PiecesFilterType, PlatformPlanLimits } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'
import { t } from 'i18next'

export type FlowPlanLimits = {
    nickname: string
    tasks: number | null
    pieces: string[]
    aiCredits: number | null
    piecesFilterType: PiecesFilterType
}

export const MAXIMUM_ALLOWED_TASKS = 1000_000

export const PRICE_PER_USER = 10
export const PRICE_PER_FLOW = 5
export const PRICE_PER_100_AI_CREDITS = 10

export enum PaymentTiming {
    IMMEDIATE = 'immediate',
    END_OF_MONTH = 'end_of_month',
}

export enum ProrationBehavior {
    CREATE_PRORATIONS = 'create_prorations',
    NONE = 'none',
}

export enum BilingCycle {
    MONTHLY = 'monthly',
    ANNUAL = 'annual',
}




export enum PlanName {
    FREE = 'free',
    PLUS = 'plus',
    BUSINESS = 'business',
    ENTERPRISE = 'enterprise',
}

export const planData = {
    tabs: [t('Monthly'), t('Annual')],

    plans: [
        {
            name: PlanName.FREE,
            description: t('Explorers & Tinkers'),
            monthlyPrice: '$0',
            yearlyPrice: '$0',
        },
        {
            name: PlanName.PLUS,
            description: t('Standard Users'),
            monthlyPrice: '$25/mo',
            yearlyPrice: '$19/mo',
            yearlyDiscount: '24% off',
        },
        {
            name: PlanName.BUSINESS,
            description: t('Power Users & Small Teams'),
            monthlyPrice: '$150/mo',
            yearlyPrice: '$114/mo',
            yearlyDiscount: '24% off',
        },
        {
            id: PlanName.ENTERPRISE,
            name: t('Enterprise'),
            description: t('Cloud or Self-Hosted'),
            isCustom: true,
            salesPrice: t('Talk to Sales'),
        },
    ],

    features: [
        {
            key: 'tasks',
            label: t('Tasks'),
            values: {
                free: '1,000/mo',
                plus: 'Unlimited',
                business: 'Unlimited',
                enterprise: 'Custom',
            },
        },
        {
            key: 'activeFlows',
            label: t('Active Flows'),
            values: {
                free: '5',
                plus: '10+',
                business: '50+',
                enterprise: 'Custom',
            },
        },
        {
            key: 'tables',
            label: t('Tables'),
            values: {
                free: '1',
                plus: '5',
                business: '20',
                enterprise: 'Custom',
            },
        },
        {
            key: 'projects',
            label: t('Projects'),
            values: {
                free: '1',
                plus: '1',
                business: '15',
                enterprise: 'Custom',
            },
        },
        {
            key: 'mcpServers',
            label: t('MCP Servers'),
            values: {
                free: '1',
                plus: '10',
                business: '25',
                enterprise: 'Custom',
            },
        },
        {
            key: 'aiAgents',
            label: t('AI Agents'),
            values: { free: false, plus: true, business: true, enterprise: true },
        },
        {
            key: 'aiCredits',
            label: t('AI Credits'),
            values: {
                free: '200',
                plus: '500+ Icons (Spend Limit)',
                business: '1,000+ Icons (Spend Limit, BYOK)',
                enterprise: 'Custom',
            },
        },
        {
            key: 'humanInLoop',
            label: t('Human in the Loop'),
            values: { free: false, plus: true, business: true, enterprise: true },
        },
        {
            key: 'users',
            label: t('Users'),
            values: {
                free: '1',
                plus: '1',
                business: '20+',
                enterprise: 'Custom',
            },
        },
    ],
}


export const DEFAULT_FREE_PLAN_LIMIT = {
    nickname: 'free-pay-as-you-go',
    tasks: 1000,
    pieces: [],
    aiCredits: 200,
    piecesFilterType: PiecesFilterType.NONE,
}

export const FREE_CLOUD_PLAN: PlatformPlanLimits = {
    tasksLimit: 1000,
    aiCreditsLimit: 200,
    embeddingEnabled: false,
    tablesEnabled: true,
    todosEnabled: true,
    globalConnectionsEnabled: false,
    customRolesEnabled: false,
    includedTasks: 1000,
    includedAiCredits: 200,
    environmentsEnabled: false,
    analyticsEnabled: false,
    showPoweredBy: false,
    auditLogEnabled: false,
    managePiecesEnabled: false,
    manageTemplatesEnabled: false,
    customAppearanceEnabled: false,
    manageProjectsEnabled: false,
    projectRolesEnabled: false,
    customDomainsEnabled: false,
    apiKeysEnabled: false,
    alertsEnabled: false,
    ssoEnabled: false,
}

export const FREE_PLAN: PlatformPlanLimits = {
    tasksLimit: 1000,
    includedTasks: 1000,
    aiCreditsLimit: 200,
    includedAiCredits: 200,
    activeFlowsLimit: 5,
    projectsLimit: 1,
    tablesLimit: 1,
    mcpLimit: 1,
    tablesEnabled: true,
    embeddingEnabled: false,
    todosEnabled: false,
    globalConnectionsEnabled: false,
    customRolesEnabled: false,
    environmentsEnabled: false,
    analyticsEnabled: false,
    managePiecesEnabled: false,
    manageTemplatesEnabled: false,
    customAppearanceEnabled: false,
    manageProjectsEnabled: false,
    projectRolesEnabled: false,
    customDomainsEnabled: false,
    apiKeysEnabled: false,
    alertsEnabled: false,
    ssoEnabled: false,
    showPoweredBy: false,
    auditLogEnabled: false,
}


export const PLUS_CLOUD_PLAN: PlatformPlanLimits = {
    includedTasks: 1000000,
    aiCreditsLimit: 500,
    includedAiCredits: 500,
    activeFlowsLimit: 10,
    projectsLimit: 1,
    tablesLimit: 5,
    mcpLimit: 5,
    tablesEnabled: true,
    embeddingEnabled: false,
    todosEnabled: true,
    globalConnectionsEnabled: false,
    customRolesEnabled: false,
    environmentsEnabled: false,
    analyticsEnabled: false,
    managePiecesEnabled: false,
    manageTemplatesEnabled: false,
    customAppearanceEnabled: false,
    manageProjectsEnabled: false,
    projectRolesEnabled: false,
    customDomainsEnabled: false,
    apiKeysEnabled: false,
    alertsEnabled: false,
    ssoEnabled: false,
    showPoweredBy: false,
    auditLogEnabled: false,
}


export const BUSINESS_CLOUD_PLAN: PlatformPlanLimits = {
    includedTasks: 1000000,
    aiCreditsLimit: 1000,
    includedAiCredits: 1000,
    activeFlowsLimit: 50,
    projectsLimit: 15,
    tablesLimit: 20,
    mcpLimit: 5,
    tablesEnabled: true,
    embeddingEnabled: false,
    todosEnabled: true,
    globalConnectionsEnabled: false,
    customRolesEnabled: false,
    environmentsEnabled: false,
    analyticsEnabled: false,
    managePiecesEnabled: false,
    manageTemplatesEnabled: false,
    customAppearanceEnabled: false,
    manageProjectsEnabled: false,
    projectRolesEnabled: false,
    customDomainsEnabled: false,
    apiKeysEnabled: false,
    alertsEnabled: false,
    ssoEnabled: false,
    showPoweredBy: false,
    auditLogEnabled: false,

}

export const OPENSOURCE_PLAN: PlatformPlanLimits = {
    embeddingEnabled: false,
    tablesEnabled: true,
    todosEnabled: true,
    globalConnectionsEnabled: false,
    customRolesEnabled: false,
    includedTasks: 0,
    includedAiCredits: 0,
    environmentsEnabled: false,
    analyticsEnabled: false,
    showPoweredBy: false,
    auditLogEnabled: false,
    managePiecesEnabled: false,
    manageTemplatesEnabled: false,
    customAppearanceEnabled: false,
    tasksLimit: undefined,
    manageProjectsEnabled: false,
    projectRolesEnabled: false,
    customDomainsEnabled: false,
    apiKeysEnabled: false,
    alertsEnabled: false,
    ssoEnabled: false,
    stripeCustomerId: undefined,
    stripeSubscriptionId: undefined,
    stripeSubscriptionStatus: undefined,
}


const AddonsSchema = Type.Object({
    extraUsers: Type.Optional(Type.Number()),
    extraFlows: Type.Optional(Type.Number()),
    extraAiCredits: Type.Optional(Type.Number()),
})
export type Addons = Static<typeof AddonsSchema>

export const UpgradeSubscriptionParamsSchema = Type.Object({
    plan: Type.Union([Type.Literal(PlanName.PLUS), Type.Literal(PlanName.BUSINESS)]),
    billing: Type.Union([Type.Literal(BilingCycle.MONTHLY), Type.Literal(BilingCycle.ANNUAL)]),
    addons: AddonsSchema,
    paymentTiming: Type.Union([Type.Literal(PaymentTiming.IMMEDIATE), Type.Literal(PaymentTiming.END_OF_MONTH)]),
    prorationBehavior: Type.Union([Type.Literal(ProrationBehavior.CREATE_PRORATIONS), Type.Literal(ProrationBehavior.NONE)]),
})

export type UpgradeSubscriptionParams = Static<typeof UpgradeSubscriptionParamsSchema>

export function getTasksPriceId(stripeKey: string | undefined) {
    const testMode = stripeKey?.startsWith('sk_test')
    return testMode
        ? 'price_1OnWqKKZ0dZRqLEKkcYBso8K'
        : 'price_1Qf7RiKZ0dZRqLEKAgP38l7w'
}

export function getPriceId(stripeKey: string | undefined) {
    return (
        {
            [PlanName.PLUS]: {
                [BilingCycle.MONTHLY]: stripeKey?.startsWith('sk_test') ? 'price_1RTRd4QN93Aoq4f8E22qF5JU' : 'price_live_plus_monthly',
                [BilingCycle.ANNUAL]: stripeKey?.startsWith('sk_test') ? 'price_1RTRdmQN93Aoq4f8vjoImL62' : 'price_live_plus_annual',
            },
            [PlanName.BUSINESS]: {
                [BilingCycle.MONTHLY]: stripeKey?.startsWith('sk_test') ? 'price_1RTReBQN93Aoq4f8v9CnMTFT' : 'price_live_business_monthly',
                [BilingCycle.ANNUAL]: stripeKey?.startsWith('sk_test') ? 'price_1RTRfEQN93Aoq4f8rawDRCTX' : 'price_live_business_annual',
            },
            ADDONS: {
                EXTRA_USERS: stripeKey?.startsWith('sk_test') ? 'price_1RTRicQN93Aoq4f8S5dBx6TA' : 'price_live_users',
                EXTRA_FLOWS: stripeKey?.startsWith('sk_test') ? 'price_1RTRgSQN93Aoq4f8b4LSm1hR' : 'price_live_flows',
                EXTRA_AI_CREDITS: stripeKey?.startsWith('sk_test') ? 'price_1RTRhOQN93Aoq4f8F6wt47v3' : 'price_live_ai_credits',
            },
        }
    )
}

export const PRICE_PER_1000_TASKS = 1

export enum ApSubscriptionStatus {
    ACTIVE = 'active',
    INCOMPLETE = 'incomplete',
    INCOMPLETE_EXPIRED = 'incomplete_expired',
    PAST_DUE = 'past_due',
    CANCELED = 'canceled',
    UNAPID = 'unpaid',
}
