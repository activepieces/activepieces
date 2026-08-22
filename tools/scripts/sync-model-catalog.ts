import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { AIProviderName } from '../../packages/core/utils/src/lib/permission'

const MODELS_DEV_API_URL = 'https://models.dev/api.json'

const OUTPUT_PATH = join(__dirname, '../../packages/server/utils/src/model-catalog.generated.json')

const MODELS_DEV_PROVIDER: Partial<Record<AIProviderName, string>> = {
    [AIProviderName.OPENAI]: 'openai',
    [AIProviderName.ANTHROPIC]: 'anthropic',
    [AIProviderName.GOOGLE]: 'google',
    [AIProviderName.AZURE]: 'azure',
    [AIProviderName.BEDROCK]: 'amazon-bedrock',
    [AIProviderName.MISTRAL]: 'mistral',
    [AIProviderName.OPENROUTER]: 'openrouter',
}

const ALIASED_AT_LOOKUP: AIProviderName[] = [AIProviderName.ACTIVEPIECES]

const COST_PRECISION = 1_000

const MIN_RETAINED_RATIO = 0.8

async function main(): Promise<void> {
    const previous = readPreviousCatalog()
    const upstream = await fetchUpstream()
    const catalog = buildCatalog(upstream)

    assertNotTruncated({ previous, catalog })

    writeFileSync(OUTPUT_PATH, `${JSON.stringify(catalog, null, 2)}\n`)
    printCoverage(catalog)
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
    const missingProviders = Object.keys(previous).filter((provider) => !(provider in catalog))
    if (missingProviders.length > 0) {
        throw new Error(`refusing to write: provider(s) disappeared upstream — ${missingProviders.join(', ')}`)
    }
    const before = countModels(previous)
    const after = countModels(catalog)
    if (after < before * MIN_RETAINED_RATIO) {
        throw new Error(`refusing to write: model count fell from ${before} to ${after}, upstream payload looks partial`)
    }
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

function readPreviousCatalog(): ModelCatalogFile | undefined {
    try {
        const previous: ModelCatalogFile = JSON.parse(readFileSync(OUTPUT_PATH, 'utf-8'))
        return previous
    }
    catch {
        return undefined
    }
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
