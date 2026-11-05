import { isNil } from '@activepieces/core-utils'
import { z } from 'zod'
import { DatasetItem } from './eval-case'

async function loadItems({ datasetName }: { datasetName: string }): Promise<DatasetItem[]> {
    const datasets = Page(DatasetSummary).parse(await get({ path: '/datasets/', query: { limit: '100' } }))
    const dataset = datasets.results.find((candidate) => candidate.name === datasetName)
    if (isNil(dataset)) {
        throw new Error(`PostHog has no dataset named "${datasetName}"`)
    }
    return collectItems({ datasetId: dataset.id, offset: 0, collected: [] })
}

async function collectItems({ datasetId, offset, collected }: { datasetId: string, offset: number, collected: DatasetItem[] }): Promise<DatasetItem[]> {
    const page = Page(DatasetItem).parse(await get({ path: '/dataset_items/', query: { dataset: datasetId, limit: String(PAGE_SIZE), offset: String(offset) } }))
    const items = [...collected, ...page.results]
    return isNil(page.next) ? items : collectItems({ datasetId, offset: offset + PAGE_SIZE, collected: items })
}

async function get({ path, query }: { path: string, query: Record<string, string> }): Promise<unknown> {
    const apiKey = process.env[API_KEY_ENV]
    if (isNil(apiKey) || apiKey.length === 0) {
        throw new Error(`${API_KEY_ENV} is not set. Add a read-only PostHog personal API key to .env.dev.`)
    }
    const host = process.env[HOST_ENV] ?? DEFAULT_HOST
    const projectId = process.env[PROJECT_ENV] ?? DEFAULT_PROJECT_ID
    const url = `${host}/api/projects/${projectId}${path}?${new URLSearchParams(query).toString()}`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } })
    if (!res.ok) {
        throw new Error(`PostHog ${path} failed: ${res.status} ${await res.text()}`)
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

export const posthogDataset = {
    loadItems,
}
