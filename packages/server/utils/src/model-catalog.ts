import { AIProviderName, isNil, tryCatch } from '@activepieces/core-utils'
import { AIProviderModelMetadata } from '@activepieces/shared'
import { z } from 'zod'
import { apLogger } from './ap-logger'
import { safeHttp } from './safe-http'

const logger = apLogger.create()

export const modelCatalog = {
    async load(): Promise<ModelCatalogReader> {
        const catalog = await loadCatalog()
        return {
            lookup({ provider, modelId }: { provider: AIProviderName, modelId: string }): AIProviderModelMetadata | undefined {
                const source = CATALOG_SOURCE_PROVIDER[provider] ?? provider
                const models = catalog?.providers[source]
                if (isNil(models)) {
                    return undefined
                }
                return models[normalizeModelId({ provider: source, modelId })]
            },
        }
    },
}

async function loadCatalog(): Promise<PublishedCatalog | undefined> {
    if (!isNil(cached) && Date.now() - cached.fetchedAt < CATALOG_TTL_MS) {
        return cached.value
    }
    if (!isNil(lastFailureAt) && Date.now() - lastFailureAt < FAILURE_BACKOFF_MS) {
        return cached?.value
    }

    const pending = inFlight ?? startFetch()
    const { data, error } = await tryCatch(() => pending)
    if (!isNil(error)) {
        return cached?.value
    }
    return data ?? undefined
}

function startFetch(): Promise<PublishedCatalog> {
    inFlight = fetchCatalog()
        .then((value) => {
            cached = { value, fetchedAt: Date.now() }
            lastFailureAt = undefined
            return value
        })
        .catch((error) => {
            lastFailureAt = Date.now()
            logger.warn({ error, catalog: { url: catalogUrl() } }, 'Failed to load the AI model catalog; models will be returned without metadata')
            throw error
        })
        .finally(() => {
            inFlight = undefined
        })
    return inFlight
}

async function fetchCatalog(): Promise<PublishedCatalog> {
    const response = await safeHttp.retryingAxios.get(catalogUrl(), {
        timeout: REQUEST_TIMEOUT_MS,
    })
    return PublishedCatalog.parse(response.data)
}

function catalogUrl(): string {
    return process.env['AP_MODEL_CATALOG_URL'] ?? DEFAULT_CATALOG_URL
}

function normalizeModelId({ provider, modelId }: { provider: AIProviderName, modelId: string }): string {
    if (provider !== AIProviderName.BEDROCK) {
        return modelId
    }
    return modelId.replace(BEDROCK_INFERENCE_PROFILE_PREFIX, '')
}

let cached: { value: PublishedCatalog, fetchedAt: number } | undefined
let inFlight: Promise<PublishedCatalog> | undefined
let lastFailureAt: number | undefined

const DEFAULT_CATALOG_URL = 'https://cdn.activepieces.com/ai/model-catalog.json'
const CATALOG_TTL_MS = 24 * 60 * 60 * 1000
const FAILURE_BACKOFF_MS = 5 * 60 * 1000
const REQUEST_TIMEOUT_MS = 10_000

const BEDROCK_INFERENCE_PROFILE_PREFIX = /^(us|eu|apac|global)\./

const CATALOG_SOURCE_PROVIDER: Partial<Record<AIProviderName, AIProviderName>> = {
    [AIProviderName.ACTIVEPIECES]: AIProviderName.OPENROUTER,
}

const PublishedCatalog = z.object({
    providers: z.partialRecord(z.enum(AIProviderName), z.record(z.string(), AIProviderModelMetadata)),
})

type PublishedCatalog = z.infer<typeof PublishedCatalog>

type ModelCatalogReader = {
    lookup(params: { provider: AIProviderName, modelId: string }): AIProviderModelMetadata | undefined
}
