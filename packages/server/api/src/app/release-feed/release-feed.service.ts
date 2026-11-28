import { isNil, tryCatch } from '@activepieces/core-utils'
import { safeHttp } from '@activepieces/server-utils'
import { GetReleaseFeedResponse, ReleaseFeedEntry } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'

let cached: GetReleaseFeedResponse = { fetchedAt: null, entries: [] }
let nextFetchAt = 0
let inFlight: Promise<void> | undefined

export const releaseFeedService = (log: FastifyBaseLogger) => ({
    async get(): Promise<GetReleaseFeedResponse> {
        if (Date.now() < nextFetchAt) {
            return cached
        }
        inFlight ??= refresh({ log }).finally(() => {
            inFlight = undefined
        })
        await inFlight
        return cached
    },
})

async function refresh({ log }: { log: FastifyBaseLogger }): Promise<void> {
    const url = feedUrl()
    const { data: response, error } = await tryCatch(() => safeHttp.axios.get<unknown>(url, { timeout: REQUEST_TIMEOUT_MS }))
    if (isNil(response)) {
        nextFetchAt = Date.now() + FAILURE_BACKOFF_MS
        log.warn({ error, releaseFeed: { url, fetchedAt: cached.fetchedAt } }, '[releaseFeedService#refresh] Failed to fetch the release feed, keeping the last copy')
        return
    }
    const parsed = PublishedFeed.safeParse(response.data)
    if (!parsed.success) {
        nextFetchAt = Date.now() + FAILURE_BACKOFF_MS
        log.warn({ releaseFeed: { url, fetchedAt: cached.fetchedAt, issues: parsed.error.issues.slice(0, 5) } }, '[releaseFeedService#refresh] The release feed is not a JSON list, keeping the last copy')
        return
    }
    const entries = parsed.data.flatMap((raw) => {
        const entry = ReleaseFeedEntry.safeParse(raw)
        return entry.success ? [entry.data] : []
    })
    if (entries.length < parsed.data.length) {
        log.warn({ releaseFeed: { url, skipped: parsed.data.length - entries.length } }, '[releaseFeedService#refresh] Skipped release feed entries that do not match the schema')
    }
    cached = { fetchedAt: new Date().toISOString(), entries }
    nextFetchAt = Date.now() + CACHE_TTL_MS
}

function feedUrl(): string {
    return system.get(AppSystemProp.RELEASE_FEED_URL) ?? DEFAULT_RELEASE_FEED_URL
}

const PublishedFeed = z.array(z.unknown())

const CACHE_TTL_MS = 60 * 60 * 1000
const FAILURE_BACKOFF_MS = 5 * 60 * 1000
const REQUEST_TIMEOUT_MS = 10_000

export const DEFAULT_RELEASE_FEED_URL = 'https://cdn.activepieces.com/releases/releases.json'
