import { isNil, tryCatch } from '@activepieces/core-utils'
import { ACTIVEPIECES_CHAT_TIERS, DEFAULT_CHAT_TIER_ID, DEFAULT_MANAGED_MODEL_WEIGHT, MANAGED_MODEL_WEIGHTS } from '@activepieces/shared'
import { z } from 'zod'
import { apLogger } from './ap-logger'
import { safeHttp } from './safe-http'

const logger = apLogger.create()

export const aiPricingCatalog = {
    async load(): Promise<AiPricingReader> {
        return buildReader(await loadPricing())
    },

    // Sync callers (tier lookups on the chat hot path) cannot await a fetch, so they read the last
    // value we loaded and kick off a refresh in the background. Prices propagate in ~65 minutes
    // anyway, so a snapshot that lags one request is not a correctness problem.
    current(): AiPricingReader {
        if (isNil(cached) || Date.now() - cached.fetchedAt >= PRICING_TTL_MS) {
            void tryCatch(() => loadPricing())
        }
        return buildReader(cached?.value ?? bundledPricing())
    },
}

function buildReader(pricing: PublishedPricing): AiPricingReader {
    const tiersById = new Map(pricing.tiers.map((tier) => [tier.id, tier]))
    const tiersByModelId = new Map(pricing.tiers.map((tier) => [tier.modelId, tier]))
    return {
        tiers: pricing.tiers,
        defaultTierId: pricing.defaultTierId,
        findTierById(tierId: string) {
            return tiersById.get(tierId)
        },
        findTierByModelId(modelId: string) {
            return tiersByModelId.get(modelId)
        },
        resolveTier(tierId: string | undefined) {
            const requested = isNil(tierId) ? undefined : tiersById.get(tierId)
            return requested ?? tiersById.get(pricing.defaultTierId) ?? pricing.tiers[0]
        },
        creditWeightForModel(modelId: string) {
            const tierWeight = tiersByModelId.get(modelId)?.creditWeight
            if (!isNil(tierWeight)) {
                return tierWeight
            }
            return pricing.modelWeights[modelId] ?? pricing.unpricedModelCreditWeight
        },
    }
}

async function loadPricing(): Promise<PublishedPricing> {
    if (!isNil(cached) && Date.now() - cached.fetchedAt < PRICING_TTL_MS) {
        return cached.value
    }
    if (!isNil(lastFailureAt) && Date.now() - lastFailureAt < FAILURE_BACKOFF_MS) {
        return cached?.value ?? bundledPricing()
    }

    const pending = inFlight ?? startFetch()
    const { data, error } = await tryCatch(() => pending)
    if (!isNil(error)) {
        return cached?.value ?? bundledPricing()
    }
    return data ?? bundledPricing()
}

function startFetch(): Promise<PublishedPricing> {
    inFlight = fetchPricing()
        .then((value) => {
            cached = { value, fetchedAt: Date.now() }
            lastFailureAt = undefined
            return value
        })
        .catch((error) => {
            lastFailureAt = Date.now()
            logger.warn({ error, pricing: { url: pricingUrl() } }, 'Failed to load the AI pricing file; keeping the last known good prices')
            throw error
        })
        .finally(() => {
            inFlight = undefined
        })
    return inFlight
}

async function fetchPricing(): Promise<PublishedPricing> {
    const response = await safeHttp.retryingAxios.get(pricingUrl(), {
        timeout: REQUEST_TIMEOUT_MS,
    })
    const parsed = PublishedPricing.parse(response.data)
    assertNotTruncated(parsed)
    return parsed
}

function assertNotTruncated(pricing: PublishedPricing): void {
    const bundledCount = Object.keys(MANAGED_MODEL_WEIGHTS).length
    const publishedCount = Object.keys(pricing.modelWeights).length
    if (publishedCount < bundledCount * MIN_RETAINED_RATIO) {
        throw new Error(
            `The published pricing lists ${publishedCount} models, below ${MIN_RETAINED_RATIO * 100}% of the ${bundledCount} shipped with this release`,
        )
    }
}

function pricingUrl(): string {
    return process.env['AP_AI_PRICING_URL'] ?? DEFAULT_PRICING_URL
}

function bundledPricing(): PublishedPricing {
    return {
        version: 0,
        publishedAt: BUNDLED_PUBLISHED_AT,
        publishedBy: 'bundled-with-release',
        tiers: ACTIVEPIECES_CHAT_TIERS.map((tier) => ({ ...tier })),
        defaultTierId: DEFAULT_CHAT_TIER_ID,
        modelWeights: MANAGED_MODEL_WEIGHTS,
        unpricedModelCreditWeight: DEFAULT_MANAGED_MODEL_WEIGHT,
    }
}

let cached: { value: PublishedPricing, fetchedAt: number } | undefined
let inFlight: Promise<PublishedPricing> | undefined
let lastFailureAt: number | undefined

const DEFAULT_PRICING_URL = 'https://cdn.activepieces.com/ai/pricing.json'
const PRICING_TTL_MS = 60 * 60 * 1000
const FAILURE_BACKOFF_MS = 5 * 60 * 1000
const REQUEST_TIMEOUT_MS = 10_000
const MIN_RETAINED_RATIO = 0.8
const BUNDLED_PUBLISHED_AT = '1970-01-01T00:00:00.000Z'
const CREDIT_WEIGHT_MIN = 1
const CREDIT_WEIGHT_MAX = 10_000

const CreditWeight = z.number().int().min(CREDIT_WEIGHT_MIN).max(CREDIT_WEIGHT_MAX)

const PricingTier = z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    modelId: z.string().min(1),
    nativeModelId: z.string().min(1).optional(),
    thinkingBudget: z.number().int().positive(),
    creditWeight: CreditWeight,
})

const PublishedPricing = z
    .object({
        version: z.number().int().min(0),
        publishedAt: z.string().min(1),
        publishedBy: z.string().min(1),
        tiers: z.array(PricingTier).min(1),
        defaultTierId: z.string().min(1),
        modelWeights: z.record(z.string(), CreditWeight),
        unpricedModelCreditWeight: CreditWeight,
    })
    .refine((value) => value.tiers.some((tier) => tier.id === value.defaultTierId), {
        message: 'The default tier must be one of the tiers',
        path: ['defaultTierId'],
    })

type PublishedPricing = z.infer<typeof PublishedPricing>

export type AiPricingTier = z.infer<typeof PricingTier>

export type AiPricingReader = {
    tiers: AiPricingTier[]
    defaultTierId: string
    findTierById(tierId: string): AiPricingTier | undefined
    findTierByModelId(modelId: string): AiPricingTier | undefined
    resolveTier(tierId: string | undefined): AiPricingTier
    creditWeightForModel(modelId: string): number
}
