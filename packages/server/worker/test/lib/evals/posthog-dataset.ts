import { isNil } from '@activepieces/core-utils'
import { z } from 'zod'
import { DatasetItem, RecordedToolCall, ToolFixture } from './eval-case'

async function loadItems({ datasetName }: { datasetName: string }): Promise<DatasetItem[]> {
    const datasets = Page(DatasetSummary).parse(await request({ path: '/datasets/', query: { limit: '100' } }))
    const dataset = datasets.results.find((candidate) => candidate.name === datasetName)
    if (isNil(dataset)) {
        throw new Error(`PostHog has no dataset named "${datasetName}"`)
    }
    return collectItems({ datasetId: dataset.id, offset: 0, collected: [] })
}

async function addFixtures({ itemId, fixtures }: { itemId: string, fixtures: RecordedToolCall[] }): Promise<{ added: number, total: number }> {
    const item = StoredItem.parse(await request({ path: `/dataset_items/${itemId}/` }))
    const existing = item.metadata.toolFixtures ?? []
    const seen = new Set(existing.map(fixtureKey))
    const fresh = fixtures.filter((fixture) => {
        const key = fixtureKey(fixture)
        const isNew = !seen.has(key)
        seen.add(key)
        return isNew
    })
    if (fresh.length > 0) {
        await request({ path: `/dataset_items/${itemId}/`, method: 'PATCH', body: { base_version: item.version, metadata: { ...item.metadata, toolFixtures: [...existing, ...fresh] } } })
    }
    return { added: fresh.length, total: existing.length + fresh.length }
}

async function setMetadataField({ itemId, field, value }: { itemId: string, field: string, value: unknown }): Promise<void> {
    const item = StoredItem.parse(await request({ path: `/dataset_items/${itemId}/` }))
    await request({ path: `/dataset_items/${itemId}/`, method: 'PATCH', body: { base_version: item.version, metadata: { ...item.metadata, [field]: value } } })
}

function fixtureKey(fixture: RecordedToolCall): string {
    return JSON.stringify({ toolName: fixture.toolName, input: fixture.input })
}

async function collectItems({ datasetId, offset, collected }: { datasetId: string, offset: number, collected: DatasetItem[] }): Promise<DatasetItem[]> {
    const page = Page(DatasetItem).parse(await request({ path: '/dataset_items/', query: { dataset: datasetId, limit: String(PAGE_SIZE), offset: String(offset) } }))
    const items = [...collected, ...page.results]
    return isNil(page.next) ? items : collectItems({ datasetId, offset: offset + PAGE_SIZE, collected: items })
}

async function request({ path, query = {}, method = 'GET', body }: { path: string, query?: Record<string, string>, method?: 'GET' | 'PATCH', body?: unknown }): Promise<unknown> {
    const apiKey = process.env[API_KEY_ENV]
    if (isNil(apiKey) || apiKey.length === 0) {
        throw new Error(`${API_KEY_ENV} is not set. Add a PostHog personal API key to .env.dev.`)
    }
    const host = process.env[HOST_ENV] ?? DEFAULT_HOST
    const projectId = process.env[PROJECT_ENV] ?? DEFAULT_PROJECT_ID
    const search = new URLSearchParams(query).toString()
    const url = `${host}/api/projects/${projectId}${path}${search.length > 0 ? `?${search}` : ''}`
    const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        ...(isNil(body) ? {} : { body: JSON.stringify(body) }),
    })
    if (!res.ok) {
        throw new Error(`PostHog ${method} ${path} failed: ${res.status} ${await res.text()}`)
    }
    return res.json()
}

function Page<T extends z.ZodType>(item: T) {
    return z.object({ next: z.string().nullable(), results: z.array(item) })
}

const API_KEY_ENV = 'AP_POSTHOG_API_KEY'
const HOST_ENV = 'AP_POSTHOG_HOST'
const PROJECT_ENV = 'AP_POSTHOG_PROJECT_ID'
const DEFAULT_HOST = 'https://us.posthog.com'
const DEFAULT_PROJECT_ID = '18070'
const PAGE_SIZE = 100

const DatasetSummary = z.object({ id: z.string(), name: z.string() })

const StoredItem = z.object({
    version: z.number(),
    metadata: z.looseObject({ toolFixtures: z.array(ToolFixture).optional() }),
})

export const posthogDataset = {
    loadItems,
    addFixtures,
    setMetadataField,
}
