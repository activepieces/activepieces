import { isNil, SeekPage, tryCatch } from '@activepieces/core-utils'
import { safeHttp } from '@activepieces/server-utils'
import { Flag, ListTemplatesRequestQuery, Template } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'

const TEMPLATES_SOURCE_URL = 'https://cloud.activepieces.com/api/v1/templates'
const TEMPLATES_SOURCE_TIMEOUT_MS = 10_000

export const communityTemplates = (log: FastifyBaseLogger) => ({
    getOne: (id: string): Promise<Template | null> => fetchFromCloud({ url: `${TEMPLATES_SOURCE_URL}/${encodeURIComponent(id)}`, log }),
    getCategories: (): Promise<Flag | null> => fetchFromCloud({ url: `${TEMPLATES_SOURCE_URL}/categories`, log }),
    list: async (request: ListTemplatesRequestQuery): Promise<Template[]> => {
        const templates = await fetchFromCloud<SeekPage<Template>>({ url: `${TEMPLATES_SOURCE_URL}?${convertToQueryString(request)}`, log })
        return templates?.data ?? []
    },
})

async function fetchFromCloud<T>({ url, log }: { url: string, log: FastifyBaseLogger }): Promise<T | null> {
    const { data: response, error } = await tryCatch(() => safeHttp.axios.get<T>(url, { timeout: TEMPLATES_SOURCE_TIMEOUT_MS }))
    if (error) {
        log.warn({ error, url }, 'Failed to fetch templates from cloud')
        return null
    }
    return response.data
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
