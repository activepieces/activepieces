import { PlanName, UnconsumableFeatureId } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { autumnUtils } from '../../../../src/app/ee/platform/platform-plan/billing-providers/autumn-utils'

const FREE_FLAGS = ['analyticsEnabled', 'apiKeysEnabled', 'billingEnforced', 'showPoweredBy', 'tablesEnabled']
const APPSUMO_FLAGS = [...FREE_FLAGS, 'aiProvidersEnabled']
const FREE_LEGACY_FLAGS = APPSUMO_FLAGS
const PLUS_FLAGS = APPSUMO_FLAGS
const LICENSE_KEY_ENTERPRISE_FLAGS = [
    'aiProvidersEnabled', 'analyticsEnabled', 'apiKeysEnabled', 'auditLogEnabled',
    'customAppearanceEnabled', 'customRolesEnabled', 'environmentsEnabled', 'eventStreamingEnabled',
    'globalConnectionsEnabled', 'managePiecesEnabled', 'manageTemplatesEnabled', 'projectRolesEnabled',
    'scimEnabled', 'secretManagersEnabled', 'ssoEnabled', 'tablesEnabled',
]

function subscription({ planId, featureIds, status = 'active', addOn = false }: SubscriptionParams): Subscription {
    return { planId, status, plan: { addOn, items: featureIds.map((featureId) => ({ featureId })) } }
}

function purchase({ planId, featureIds, expiresAt = null, addOn = false }: PurchaseParams): Purchase {
    return { planId, expiresAt, plan: { addOn, items: featureIds.map((featureId) => ({ featureId })) } }
}

function grantedFlags(attachments: { subscriptions: Subscription[], purchases: Purchase[] }): string[] {
    return [...autumnUtils.toGrantedFeatureIds(attachments)].sort()
}

describe('toGrantedFeatureIds', () => {
    it('uses the free plan when it is the only attachment', () => {
        const granted = grantedFlags({
            subscriptions: [subscription({ planId: 'free', featureIds: FREE_FLAGS })],
            purchases: [],
        })
        expect(granted).toEqual([...FREE_FLAGS].sort())
    })

    it('keeps free alongside an appsumo purchase, since both are baseline', () => {
        const granted = grantedFlags({
            subscriptions: [subscription({ planId: 'free', featureIds: FREE_FLAGS })],
            purchases: [purchase({ planId: 'appsumo', featureIds: APPSUMO_FLAGS })],
        })
        expect(granted).toEqual([...APPSUMO_FLAGS].sort())
    })

    it('keeps free alongside a free_legacy purchase, since both are baseline', () => {
        const granted = grantedFlags({
            subscriptions: [subscription({ planId: 'free', featureIds: FREE_FLAGS })],
            purchases: [purchase({ planId: 'free_legacy', featureIds: FREE_LEGACY_FLAGS })],
        })
        expect(granted).toEqual([...FREE_LEGACY_FLAGS].sort())
    })

    it('uses the paid subscription that replaced free', () => {
        const granted = grantedFlags({
            subscriptions: [subscription({ planId: 'plus', featureIds: PLUS_FLAGS })],
            purchases: [],
        })
        expect(granted).toEqual([...PLUS_FLAGS].sort())
    })

    it('grants an enterprise plan neither showPoweredBy nor billingEnforced', () => {
        const granted = grantedFlags({
            subscriptions: [subscription({ planId: 'old_enterprise', featureIds: LICENSE_KEY_ENTERPRISE_FLAGS })],
            purchases: [],
        })
        expect(granted).toEqual([...LICENSE_KEY_ENTERPRISE_FLAGS].sort())
        expect(granted).not.toContain('showPoweredBy')
        expect(granted).not.toContain('billingEnforced')
    })

    it('drops both a baseline subscription and a baseline purchase once a real plan is attached', () => {
        const granted = grantedFlags({
            subscriptions: [
                subscription({ planId: 'free', featureIds: FREE_FLAGS }),
                subscription({ planId: 'old_enterprise', featureIds: LICENSE_KEY_ENTERPRISE_FLAGS }),
            ],
            purchases: [purchase({ planId: 'appsumo', featureIds: APPSUMO_FLAGS })],
        })
        expect(granted).toEqual([...LICENSE_KEY_ENTERPRISE_FLAGS].sort())
        expect(granted).not.toContain('showPoweredBy')
        expect(granted).not.toContain('billingEnforced')
    })

    it('does not let an add-on strip a free platform of its flags', () => {
        const granted = grantedFlags({
            subscriptions: [subscription({ planId: 'free', featureIds: FREE_FLAGS })],
            purchases: [purchase({ planId: 'credit_topup', featureIds: [], addOn: true })],
        })
        expect(granted).toEqual([...FREE_FLAGS].sort())
    })

    it('includes flags an add-on grants without dropping the baseline plan', () => {
        const granted = grantedFlags({
            subscriptions: [subscription({ planId: 'free', featureIds: FREE_FLAGS })],
            purchases: [purchase({ planId: 'future_addon', featureIds: ['chatEnabled'], addOn: true })],
        })
        expect(granted).toEqual([...FREE_FLAGS, 'chatEnabled'].sort())
    })

    it('ignores an expired purchase', () => {
        const granted = grantedFlags({
            subscriptions: [subscription({ planId: 'free', featureIds: FREE_FLAGS })],
            purchases: [purchase({ planId: 'appsumo', featureIds: APPSUMO_FLAGS, expiresAt: Date.now() - 1000 })],
        })
        expect(granted).toEqual([...FREE_FLAGS].sort())
    })

    it('honours a purchase that has not expired yet', () => {
        const granted = grantedFlags({
            subscriptions: [subscription({ planId: 'free', featureIds: FREE_FLAGS })],
            purchases: [purchase({ planId: 'appsumo', featureIds: APPSUMO_FLAGS, expiresAt: Date.now() + 60_000 })],
        })
        expect(granted).toEqual([...APPSUMO_FLAGS].sort())
    })

    it('ignores a scheduled subscription', () => {
        const granted = grantedFlags({
            subscriptions: [
                subscription({ planId: 'plus', featureIds: PLUS_FLAGS }),
                subscription({ planId: 'old_enterprise', featureIds: LICENSE_KEY_ENTERPRISE_FLAGS, status: 'scheduled' }),
            ],
            purchases: [],
        })
        expect(granted).toEqual([...PLUS_FLAGS].sort())
    })

    it('grants nothing when the customer has no attachment at all', () => {
        expect(grantedFlags({ subscriptions: [], purchases: [] })).toEqual([])
    })
})

describe('billingEnforcedFromGrantedFeatureIds', () => {
    it('enforces billing for a free platform', () => {
        const grantedFeatureIds = autumnUtils.toGrantedFeatureIds({
            subscriptions: [subscription({ planId: 'free', featureIds: FREE_FLAGS })],
            purchases: [],
        })
        expect(autumnUtils.billingEnforcedFromGrantedFeatureIds(grantedFeatureIds)).toBe(true)
    })

    it('does not leak enforcement from free onto a purchase-shaped enterprise plan', () => {
        const grantedFeatureIds = autumnUtils.toGrantedFeatureIds({
            subscriptions: [subscription({ planId: 'free', featureIds: FREE_FLAGS })],
            purchases: [purchase({ planId: 'enterprise_lifetime', featureIds: LICENSE_KEY_ENTERPRISE_FLAGS })],
        })
        expect(autumnUtils.billingEnforcedFromGrantedFeatureIds(grantedFeatureIds)).toBe(false)
    })

    it('does not leak enforcement from free onto a subscription-shaped enterprise plan', () => {
        const grantedFeatureIds = autumnUtils.toGrantedFeatureIds({
            subscriptions: [
                subscription({ planId: 'free', featureIds: FREE_FLAGS }),
                subscription({ planId: 'old_enterprise', featureIds: LICENSE_KEY_ENTERPRISE_FLAGS }),
            ],
            purchases: [],
        })
        expect(autumnUtils.billingEnforcedFromGrantedFeatureIds(grantedFeatureIds)).toBe(false)
    })

    it('keeps enforcement for an appsumo platform, whose own plan grants it', () => {
        const grantedFeatureIds = autumnUtils.toGrantedFeatureIds({
            subscriptions: [subscription({ planId: 'free', featureIds: FREE_FLAGS })],
            purchases: [purchase({ planId: 'appsumo', featureIds: APPSUMO_FLAGS })],
        })
        expect(autumnUtils.billingEnforcedFromGrantedFeatureIds(grantedFeatureIds)).toBe(true)
    })

    it('does not let a credit top-up add-on drop enforcement', () => {
        const grantedFeatureIds = autumnUtils.toGrantedFeatureIds({
            subscriptions: [subscription({ planId: 'free', featureIds: FREE_FLAGS })],
            purchases: [purchase({ planId: 'credit_topup', featureIds: [], addOn: true })],
        })
        expect(autumnUtils.billingEnforcedFromGrantedFeatureIds(grantedFeatureIds)).toBe(true)
    })
})

describe('mapAutumnFeaturesToPlatformPlan', () => {
    it('projects every platform plan flag column for an appsumo customer', () => {
        const grantedFeatureIds = autumnUtils.toGrantedFeatureIds({
            subscriptions: [subscription({ planId: 'free', featureIds: FREE_FLAGS })],
            purchases: [purchase({ planId: 'appsumo', featureIds: APPSUMO_FLAGS })],
        })
        const projection = autumnUtils.mapAutumnFeaturesToPlatformPlan({
            planId: 'appsumo',
            grantedFeatureIds,
            balances: {},
            scheduledUsersLimit: null,
        })
        expect(projection).toMatchObject({
            plan: 'appsumo',
            tablesEnabled: true,
            analyticsEnabled: true,
            apiKeysEnabled: true,
            aiProvidersEnabled: true,
            showPoweredBy: true,
            agentsEnabled: false,
            eventStreamingEnabled: false,
            environmentsEnabled: false,
            auditLogEnabled: false,
            embeddingEnabled: false,
            chatEnabled: false,
            workerGroupsEnabled: false,
            managePiecesEnabled: false,
            manageTemplatesEnabled: false,
            customAppearanceEnabled: false,
            projectRolesEnabled: false,
            globalConnectionsEnabled: false,
            customRolesEnabled: false,
            ssoEnabled: false,
            secretManagersEnabled: false,
            scimEnabled: false,
        })
    })

    it('never projects billingEnforced, which has no platform plan column', () => {
        const projection = autumnUtils.mapAutumnFeaturesToPlatformPlan({
            planId: 'free',
            grantedFeatureIds: new Set(FREE_FLAGS),
            balances: {},
            scheduledUsersLimit: null,
        })
        expect(projection).not.toHaveProperty('billingEnforced')
        expect(projection.showPoweredBy).toBe(true)
    })

    it.each([
        { name: 'drops', enterpriseTrial: { startedAt: 1, endsAt: 2 }, expected: null },
        { name: 'keeps', enterpriseTrial: null, expected: 5 },
    ])('$name a scheduled seat reduction depending on whether an Enterprise trial runs', ({ enterpriseTrial, expected }) => {
        const projection = autumnUtils.mapAutumnFeaturesToPlatformPlan({
            planId: 'team',
            grantedFeatureIds: new Set(FREE_FLAGS),
            balances: {},
            scheduledUsersLimit: 5,
            enterpriseTrial,
            embeddingOutsideEnterpriseTrial: false,
        })
        expect(projection.scheduledUsersLimit).toBe(expected)
    })
})

describe('grantsEmbeddingOutsideEnterpriseTrial', () => {
    const TRIAL = subscription({ planId: PlanName.ENTERPRISE_TRIAL, featureIds: ['embeddingEnabled', 'ssoEnabled'], addOn: true })
    const EMBED_DEAL = subscription({ planId: 'custom_embed', featureIds: [...FREE_FLAGS, 'embeddingEnabled'] })

    it('is false when only the Enterprise trial grants Embedding', () => {
        const free = subscription({ planId: PlanName.FREE, featureIds: FREE_FLAGS })

        expect(autumnUtils.grantsEmbeddingOutsideEnterpriseTrial({ subscriptions: [free, TRIAL], purchases: [] })).toBe(false)
        expect(autumnUtils.grantsEmbeddingOutsideEnterpriseTrial({ subscriptions: [free], purchases: [] })).toBe(false)
    })

    it('is true when the customer\'s own plan grants Embedding, with or without a trial', () => {
        expect(autumnUtils.grantsEmbeddingOutsideEnterpriseTrial({ subscriptions: [EMBED_DEAL], purchases: [] })).toBe(true)
        expect(autumnUtils.grantsEmbeddingOutsideEnterpriseTrial({ subscriptions: [EMBED_DEAL, TRIAL], purchases: [] })).toBe(true)
    })
})

describe('withoutExpiredEnterpriseTrial', () => {
    const TRIAL_FLAGS = ['auditLogEnabled', 'ssoEnabled']
    const HOUR_MS = 60 * 60 * 1000

    function customerOnFreeWithTrial({ trialEndsAt }: { trialEndsAt: number }) {
        return {
            subscriptions: [
                { ...subscription({ planId: PlanName.FREE, featureIds: FREE_FLAGS }), trialEndsAt: null },
                { ...subscription({ planId: PlanName.ENTERPRISE_TRIAL, featureIds: TRIAL_FLAGS, addOn: true }), trialEndsAt },
            ],
            purchases: [],
            balances: {
                [UnconsumableFeatureId.USERS_LIMIT]: balance([
                    grant({ planId: PlanName.FREE, includedGrant: 1 }),
                    grant({ planId: PlanName.ENTERPRISE_TRIAL, unlimited: true }),
                ]),
                [UnconsumableFeatureId.TEAM_PROJECTS_LIMIT]: balance([
                    grant({ planId: PlanName.ENTERPRISE_TRIAL, unlimited: true }),
                ]),
            },
        }
    }

    it('drops a trial that Autumn still shows as active after its end date', () => {
        const customer = customerOnFreeWithTrial({ trialEndsAt: Date.now() - HOUR_MS })

        const trimmed = autumnUtils.withoutExpiredEnterpriseTrial(customer as never)

        expect([...autumnUtils.toGrantedFeatureIds(trimmed)].sort()).toEqual([...FREE_FLAGS].sort())
        expect(trimmed.balances[UnconsumableFeatureId.USERS_LIMIT]).toMatchObject({ granted: 1, unlimited: false })
        expect(trimmed.balances).not.toHaveProperty(UnconsumableFeatureId.TEAM_PROJECTS_LIMIT)
    })

    it('keeps a trial that is still running', () => {
        const customer = customerOnFreeWithTrial({ trialEndsAt: Date.now() + HOUR_MS })

        expect(autumnUtils.withoutExpiredEnterpriseTrial(customer as never)).toBe(customer)
    })
})

function balance(breakdown: Grant[]) {
    return {
        granted: breakdown.reduce((sum, entry) => sum + entry.includedGrant, 0),
        remaining: 0,
        usage: 0,
        unlimited: breakdown.some((entry) => entry.unlimited),
        breakdown,
    }
}

function grant({ planId, includedGrant = 0, unlimited = false }: GrantParams): Grant {
    return { planId, includedGrant, prepaidGrant: 0, remaining: includedGrant, usage: 0, unlimited }
}

type Grant = {
    planId: string
    includedGrant: number
    prepaidGrant: number
    remaining: number
    usage: number
    unlimited: boolean
}

type GrantParams = {
    planId: string
    includedGrant?: number
    unlimited?: boolean
}

type PlanItems = {
    addOn: boolean
    items: { featureId: string }[]
}

type Subscription = {
    planId: string
    status: string
    plan: PlanItems
}

type Purchase = {
    planId: string
    expiresAt: number | null
    plan: PlanItems
}

type SubscriptionParams = {
    planId: string
    featureIds: string[]
    status?: string
    addOn?: boolean
}

type PurchaseParams = {
    planId: string
    featureIds: string[]
    expiresAt?: number | null
    addOn?: boolean
}
