import { mkdirSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { AIProviderName } from '../../packages/core/utils/src/lib/permission'
import { tryCatch } from '../../packages/core/utils/src/lib/try-catch'

const MODELS_DEV_API_URL = 'https://models.dev/api.json'

const PUBLISHED_CATALOG_URL = process.env['AP_MODEL_CATALOG_URL'] ?? 'https://cdn.activepieces.com/ai/model-catalog.json'

const NOTICE = 'Model data from models.dev, MIT licensed — https://github.com/anomalyco/models.dev'

const OUTPUT_PATH = join(__dirname, '../../dist/model-catalog.json')

const MODELS_DEV_PROVIDER: Partial<Record<AIProviderName, string>> = {
    [AIProviderName.OPENAI]: 'openai',
    [AIProviderName.ANTHROPIC]: 'anthropic',
    [AIProviderName.GOOGLE]: 'google',
    [AIProviderName.AZURE]: 'azure',
    [AIProviderName.BEDROCK]: 'amazon-bedrock',
    [AIProviderName.MISTRAL]: 'mistral',
    [AIProviderName.OPENROUTER]: 'openrouter',
    [AIProviderName.XAI]: 'xai',
    [AIProviderName.DEEPSEEK]: 'deepseek',
    [AIProviderName.ZAI]: 'zai',
    [AIProviderName.QWEN]: 'alibaba',
    [AIProviderName.MINIMAX]: 'minimax',
    [AIProviderName.MOONSHOT]: 'moonshotai',
}

const ALIASED_AT_LOOKUP: AIProviderName[] = [AIProviderName.ACTIVEPIECES]

const COST_PRECISION = 1_000

const NOT_FOUND = 404

const MIN_RETAINED_RATIO = 0.8

const MAX_TOLERATED_MODEL_LOSS = 2

async function main(): Promise<void> {
    const published = await fetchPublishedCatalog()
    const upstream = await fetchUpstream()
    const providers = buildCatalog(upstream)

    assertNotTruncated({ previous: published?.providers, catalog: providers })

    const catalog: PublishedCatalog = {
        notice: NOTICE,
        generatedAt: new Date().toISOString(),
        providers,
    }
    mkdirSync(dirname(OUTPUT_PATH), { recursive: true })
    writeFileSync(OUTPUT_PATH, `${JSON.stringify(catalog, null, 2)}\n`)
    printCoverage(providers)
}

async function fetchPublishedCatalog(): Promise<PublishedCatalog | undefined> {
    const { data: response, error } = await tryCatch(() => fetch(PUBLISHED_CATALOG_URL))
    if (error !== null) {
        throw new Error(`refusing to publish: cannot reach ${PUBLISHED_CATALOG_URL} to validate against — ${error instanceof Error ? error.message : String(error)}`)
    }
    if (response.status === NOT_FOUND) {
        process.stdout.write(`nothing published at ${PUBLISHED_CATALOG_URL} yet; publishing the first catalog without a truncation guard\n`)
        return undefined
    }
    if (!response.ok) {
        throw new Error(`refusing to publish: ${PUBLISHED_CATALOG_URL} returned ${response.status} ${response.statusText}, so the current catalog is unknown`)
    }
    const { data: body, error: parseError } = await tryCatch<unknown>(() => response.json())
    if (parseError !== null) {
        throw new Error(`refusing to publish: ${PUBLISHED_CATALOG_URL} is not valid JSON, so the current catalog is unknown`)
    }
    if (!isPublishedCatalog(body)) {
        throw new Error(`refusing to publish: ${PUBLISHED_CATALOG_URL} is not a catalog document — "providers" is missing or malformed, so the current catalog is unknown`)
    }
    return body
}

function isPublishedCatalog(body: unknown): body is PublishedCatalog {
    if (!isPlainObject(body) || !('providers' in body) || !isPlainObject(body.providers)) {
        return false
    }
    return Object.values(body.providers).every(isPlainObject)
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

async function fetchUpstream(): Promise<ModelsDevApi> {
    const response = await fetch(MODELS_DEV_API_URL)
    if (!response.ok) {
        throw new Error(`models.dev returned ${response.status} ${response.statusText}`)
    }
    const upstream: ModelsDevApi = await response.json()
    return upstream
}

function buildCatalog(upstream: ModelsDevApi): ModelCatalogFile {
    return Object.fromEntries(
        sorted(Object.entries(MODELS_DEV_PROVIDER))
            .map(([provider, upstreamId]) => [provider, buildProviderBlock(upstream[upstreamId])] as const)
            .filter(([, models]) => Object.keys(models).length > 0),
    )
}

function buildProviderBlock(upstreamProvider: ModelsDevProvider | undefined): Record<string, ModelMetadata> {
    if (!upstreamProvider) {
        return {}
    }
    return Object.fromEntries(
        sorted(Object.entries(upstreamProvider.models))
            .map(([modelId, model]) => [modelId, toMetadata(model)] as const),
    )
}

function toMetadata(model: ModelsDevModel): ModelMetadata {
    return {
        contextTokens: model.limit?.context,
        maxOutputTokens: model.limit?.output,
        releaseDate: model.release_date,
        inputCostPerMillionTokens: roundCost(model.cost?.input),
        outputCostPerMillionTokens: roundCost(model.cost?.output),
        supportsToolCalling: model.tool_call,
        supportsReasoning: model.reasoning,
        supportsVision: model.modalities?.input?.includes('image'),
    }
}

function assertNotTruncated({ previous, catalog }: { previous: ModelCatalogFile | undefined, catalog: ModelCatalogFile }): void {
    if (!previous) {
        return
    }

    const shrunk = Object.entries(previous)
        .map(([provider, models]) => ({
            provider,
            before: Object.keys(models).length,
            after: Object.keys(catalog[provider] ?? {}).length,
        }))
        .filter(({ before, after }) => hasShrunk({ before, after }))
    if (shrunk.length > 0) {
        const detail = shrunk.map(({ provider, before, after }) => `${provider} ${before} -> ${after}`).join(', ')
        throw new Error(`refusing to write: provider(s) lost models upstream — ${detail}`)
    }

    const before = countModels(previous)
    const after = countModels(catalog)
    if (hasShrunk({ before, after })) {
        throw new Error(`refusing to write: model count fell from ${before} to ${after}, upstream payload looks partial`)
    }
}

function hasShrunk({ before, after }: { before: number, after: number }): boolean {
    return before - after > MAX_TOLERATED_MODEL_LOSS && after < before * MIN_RETAINED_RATIO
}

function printCoverage(catalog: ModelCatalogFile): void {
    const rows = Object.entries(catalog).map(([provider, models]) => {
        const entries = Object.values(models)
        const withCost = entries.filter((model) => model.inputCostPerMillionTokens !== undefined).length
        return `  ${provider.padEnd(16)} ${String(entries.length).padStart(4)} models  ${String(withCost).padStart(4)} priced`
    })
    const unsourced = Object.values(AIProviderName)
        .filter((provider) => !(provider in catalog) && !ALIASED_AT_LOOKUP.includes(provider))
    process.stdout.write([
        `wrote ${OUTPUT_PATH}`,
        `  ${countModels(catalog)} models across ${Object.keys(catalog).length} providers`,
        ...rows,
        `  aliased at lookup: ${ALIASED_AT_LOOKUP.join(', ')}`,
        `  no upstream source: ${unsourced.join(', ')}`,
        '',
    ].join('\n'))
}

function roundCost(cost: number | undefined): number | undefined {
    if (cost === undefined) {
        return undefined
    }
    return Math.round(cost * COST_PRECISION) / COST_PRECISION
}

function countModels(catalog: ModelCatalogFile): number {
    return Object.values(catalog).reduce((total, models) => total + Object.keys(models).length, 0)
}

function sorted<T>(entries: [string, T][]): [string, T][] {
    return [...entries].sort(([a], [b]) => a.localeCompare(b))
}

main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exit(1)
})

type ModelMetadata = {
    contextTokens?: number
    maxOutputTokens?: number
    releaseDate?: string
    inputCostPerMillionTokens?: number
    outputCostPerMillionTokens?: number
    supportsToolCalling?: boolean
    supportsReasoning?: boolean
    supportsVision?: boolean
}

type ModelCatalogFile = Record<string, Record<string, ModelMetadata>>

type PublishedCatalog = {
    notice: string
    generatedAt: string
    providers: ModelCatalogFile
}

type ModelsDevModel = {
    release_date?: string
    tool_call?: boolean
    reasoning?: boolean
    limit?: { context?: number, output?: number }
    cost?: { input?: number, output?: number }
    modalities?: { input?: string[] }
}

type ModelsDevProvider = {
    models: Record<string, ModelsDevModel>
}

type ModelsDevApi = Record<string, ModelsDevProvider>
