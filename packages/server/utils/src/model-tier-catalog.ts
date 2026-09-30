import { isNil, tryCatch } from '@activepieces/core-utils'
import { ACTIVEPIECES_CHAT_TIERS, DEFAULT_CHAT_TIER_ID } from '@activepieces/shared'
import { z } from 'zod'
import { apLogger } from './ap-logger'
import { safeHttp } from './safe-http'

const logger = apLogger.create()

export const modelTierCatalog = {
    async warmUp(): Promise<void> {
        await Promise.race([
            loadTiers(),
            new Promise<void>((resolve) => setTimeout(resolve, WARM_UP_TIMEOUT_MS).unref()),
        ])
    },

    current(surface: ModelTierSurface): ModelTierReader {
        if (isNil(cached) || Date.now() - cached.fetchedAt >= TIERS_TTL_MS) {
            loadTiers().catch(() => undefined)
        }
        return (cached?.readers ?? bundledReaders())[surface]
    },
}

async function loadTiers(): Promise<void> {
    if (!isNil(cached) && Date.now() - cached.fetchedAt < TIERS_TTL_MS) {
        return
    }
    if (!isNil(lastFailureAt) && Date.now() - lastFailureAt < FAILURE_BACKOFF_MS) {
        return
    }
    await tryCatch(() => inFlight ?? startFetch())
}

function startFetch(): Promise<void> {
    inFlight = fetchTiers()
        .then((published) => {
            cached = { fetchedAt: Date.now(), readers: buildReaders(published) }
            lastFailureAt = undefined
        })
        .catch((error: unknown) => {
            lastFailureAt = Date.now()
            logger.warn({ error, tiers: { url: tiersUrl() } }, isNil(cached)
                ? 'Failed to load the AI model tiers file; serving the tiers shipped with the release'
                : 'Failed to refresh the AI model tiers file; keeping the last published copy')
            throw error
        })
        .finally(() => {
            inFlight = undefined
        })
    return inFlight
}

async function fetchTiers(): Promise<PublishedTiers> {
    const response = await safeHttp.retryingAxios.get(tiersUrl(), {
        timeout: REQUEST_TIMEOUT_MS,
    })
    return PublishedTiers.parse(response.data)
}

function tiersUrl(): string {
    return process.env['AP_MODEL_TIERS_URL'] ?? DEFAULT_TIERS_URL
}

function buildReaders(published: PublishedTiers): Record<ModelTierSurface, ModelTierReader> {
    const flow = buildReader(flowListOf(published))
    const chatList = chatListOf(published)
    return {
        flow,
        chat: isNil(chatList) ? flow : buildReader(chatList),
    }
}

function buildReader({ tiers, defaultTierId, fastTierId }: TierList): ModelTierReader {
    const tiersById = new Map(tiers.map((tier) => [tier.id, tier]))
    const defaultTier = tiersById.get(defaultTierId) ?? tiers[0]
    return {
        tiers,
        defaultTierId: defaultTier.id,
        fastTierId: fastTierId ?? DEFAULT_FAST_TIER_ID,
        findTier({ tierId }) {
            return tiersById.get(tierId)
        },
        resolveTier({ tierId }) {
            return (isNil(tierId) ? undefined : tiersById.get(tierId)) ?? defaultTier
        },
    }
}

function flowListOf({ tiers, defaultTierId, fastTierId }: PublishedTiers): TierList {
    return { tiers, defaultTierId, fastTierId }
}

function chatListOf({ chatTiers, chatDefaultTierId, chatFastTierId }: PublishedTiers): TierList | undefined {
    if (isNil(chatTiers) || isNil(chatDefaultTierId)) {
        return undefined
    }
    return { tiers: chatTiers, defaultTierId: chatDefaultTierId, fastTierId: chatFastTierId }
}

function tierListProblems({ tiers, defaultTierId, fastTierId }: TierList): string[] {
    const ids = tiers.map((tier) => tier.id)
    return [
        ...(new Set(ids).size === ids.length ? [] : ['tier ids must be unique within a list']),
        ...(ids.includes(defaultTierId) ? [] : ['the default tier must be one of the tiers']),
        ...(ids.includes(fastTierId ?? DEFAULT_FAST_TIER_ID) ? [] : ['the fast tier must be one of the tiers']),
    ]
}

function bundledReaders(): Record<ModelTierSurface, ModelTierReader> {
    bundled ??= buildReaders({
        version: 0,
        publishedAt: BUNDLED_PUBLISHED_AT,
        publishedBy: 'bundled-with-release',
        tiers: ACTIVEPIECES_CHAT_TIERS.map((tier) => ({ ...tier })),
        defaultTierId: DEFAULT_CHAT_TIER_ID,
    })
    return bundled
}

let cached: { fetchedAt: number, readers: Record<ModelTierSurface, ModelTierReader> } | undefined
let bundled: Record<ModelTierSurface, ModelTierReader> | undefined
let inFlight: Promise<void> | undefined
let lastFailureAt: number | undefined

const DEFAULT_TIERS_URL = 'https://cdn.activepieces.com/ai/pricing.json'
const DEFAULT_FAST_TIER_ID = 'fast'
const TIERS_TTL_MS = 15 * 60 * 1000
const FAILURE_BACKOFF_MS = 5 * 60 * 1000
const REQUEST_TIMEOUT_MS = 10_000
const WARM_UP_TIMEOUT_MS = 2_000
const BUNDLED_PUBLISHED_AT = '1970-01-01T00:00:00.000Z'

const PublishedTier = z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    modelId: z.string().min(1),
    nativeModelId: z.string().min(1).optional(),
    thinkingBudget: z.int().positive(),
})

const PublishedTiers = z
    .object({
        version: z.int().min(0),
        publishedAt: z.string().min(1),
        publishedBy: z.string().min(1),
        tiers: z.array(PublishedTier).min(1),
        defaultTierId: z.string().min(1),
        fastTierId: z.string().min(1).optional(),
        chatTiers: z.array(PublishedTier).min(1).optional(),
        chatDefaultTierId: z.string().min(1).optional(),
        chatFastTierId: z.string().min(1).optional(),
    })
    .superRefine((value, ctx) => {
        for (const message of tierListProblems(flowListOf(value))) {
            ctx.addIssue({ code: 'custom', message, path: ['tiers'] })
        }
        if (isNil(value.chatTiers) !== isNil(value.chatDefaultTierId)) {
            ctx.addIssue({ code: 'custom', message: 'chatTiers and chatDefaultTierId must be published together', path: ['chatTiers'] })
        }
        const chatList = chatListOf(value)
        for (const message of isNil(chatList) ? [] : tierListProblems(chatList)) {
            ctx.addIssue({ code: 'custom', message, path: ['chatTiers'] })
        }
    })

type PublishedTiers = z.infer<typeof PublishedTiers>

type TierList = {
    tiers: ModelTier[]
    defaultTierId: string
    fastTierId?: string
}

export type ModelTierSurface = 'chat' | 'flow'

export type ModelTier = z.infer<typeof PublishedTier>

export type ModelTierReader = {
    tiers: ModelTier[]
    defaultTierId: string
    fastTierId: string
    findTier(params: { tierId: string }): ModelTier | undefined
    resolveTier(params: { tierId: string | null | undefined }): ModelTier
}
