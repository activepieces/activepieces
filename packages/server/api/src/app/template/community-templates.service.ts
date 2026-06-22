import { ActivepiecesError, ErrorCode, isNil, SeekPage } from '@activepieces/core-utils'
import { ListTemplatesRequestQuery, Template } from '@activepieces/shared'
import { curatedN8nWorkflowTemplateService } from './curated-n8n-workflow-templates'

const TEMPLATES_SOURCE_URL = 'https://cloud.activepieces.com/api/v1/templates'

export const communityTemplates = {
    getOrThrow: async (id: string): Promise<Template> => {
        const curatedTemplate = curatedN8nWorkflowTemplateService.get({ id })
        if (curatedTemplate !== undefined) {
            return curatedTemplate
        }

        const url = `${TEMPLATES_SOURCE_URL}/${id}`
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        if (!response.ok) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'template',
                    entityId: id,
                    message: `Template ${id} not found`,
                },
            })
        }
        const template = await response.json()
        return template
    },
    getCategories: async (): Promise<string[]> => {
        const url = `${TEMPLATES_SOURCE_URL}/categories`
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        const categories = await response.json()
        return Array.from(
            new Set([...categories, ...curatedN8nWorkflowTemplateService.categories]),
        ).sort()
    },
    list: async (
        request: ListTemplatesRequestQuery,
    ): Promise<SeekPage<Template>> => {
        const queryString = convertToQueryString(request)
        const url = `${TEMPLATES_SOURCE_URL}?${queryString}`
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        const templates = await response.json()
        return {
            ...templates,
            data: [
                ...templates.data,
                ...curatedN8nWorkflowTemplateService.list(request),
            ],
        }
    },
}

function convertToQueryString(params: ListTemplatesRequestQuery): string {
    const searchParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            value.forEach((val) => {
                if (!isNil(val)) {
                    searchParams.append(
                        key,
                        typeof val === 'string' ? val : JSON.stringify(val),
                    )
                }
            })
        }
        else if (!isNil(value)) {
            searchParams.set(key, value.toString())
        }
    })

    return searchParams.toString()
}
