import { isNil, SeekPage, tryCatch } from '@activepieces/core-utils'
import { Flag, ListTemplatesRequestQuery, Template } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'

const TEMPLATES_SOURCE_URL = 'https://cloud.activepieces.com/api/v1/templates'
const TEMPLATES_SOURCE_TIMEOUT_MS = 15_000

export const communityTemplates = (log: FastifyBaseLogger) => ({
    getOne: (id: string): Promise<Template | null> => fetchFromCloud<Template>({ url: `${TEMPLATES_SOURCE_URL}/${encodeURIComponent(id)}`, log }),
    getCategories: (): Promise<Flag | null> => fetchFromCloud<Flag>({ url: `${TEMPLATES_SOURCE_URL}/categories`, log }),
    list: async (request: ListTemplatesRequestQuery): Promise<Template[]> => {
        const templates = await fetchFromCloud<SeekPage<Template>>({ url: `${TEMPLATES_SOURCE_URL}?${convertToQueryString(request)}`, log })
        return templates?.data ?? []
    },
})

async function fetchFromCloud<T>({ url, log }: { url: string, log: FastifyBaseLogger }): Promise<T | null> {
    const { data, error } = await tryCatch(async (): Promise<T> => {
        const response = await fetch(url, { signal: AbortSignal.timeout(TEMPLATES_SOURCE_TIMEOUT_MS) })
        if (!response.ok) {
            await response.body?.cancel()
            throw new Error(`Templates source responded with status ${response.status}`)
        }
        return response.json()
    })
    if (error) {
        log.warn({ error, url, cause: error.cause instanceof Error ? error.cause.message : undefined }, 'Failed to fetch templates from cloud.activepieces.com')
        return null
    }
    return data
}

function convertToQueryString(params: ListTemplatesRequestQuery): string {
    const searchParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            value.forEach((val) => {
                if (!isNil(val)) {
                    searchParams.append(key, typeof val === 'string' ? val : JSON.stringify(val))
                }
            })
        }
        else if (!isNil(value)) {
            searchParams.set(key, value.toString())
        }
    })

    return searchParams.toString()
}
