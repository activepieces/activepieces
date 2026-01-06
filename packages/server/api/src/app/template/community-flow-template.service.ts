import { AppSystemProp } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    ErrorCode,
    isNil,
    ListTemplatesRequestQuery,
    SeekPage,
    Template,
} from '@activepieces/shared'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { system } from '../helper/system/system'

export const communityTemplates = {
    getOrThrow: async (id: string): Promise<Template> => {
        const templateSource = system.get(AppSystemProp.TEMPLATES_SOURCE_URL)
        if (isNil(templateSource)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'Templates source URL is not set',
                },
            })
        }
        const url = `${templateSource}/${id}`
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
        const templateSource = system.get(AppSystemProp.TEMPLATES_SOURCE_URL)
        if (isNil(templateSource)) {
            return []
        }
        const url = `${templateSource}/categories`
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        const categories = await response.json()
        return categories
    },
    list: async (request: ListTemplatesRequestQuery): Promise<SeekPage<Template>> => {
        const templateSource = system.get(AppSystemProp.TEMPLATES_SOURCE_URL)
        if (isNil(templateSource)) {
            return paginationHelper.createPage([], null)
        }
        const queryString = convertToQueryString(request)
        const url = `${templateSource}?${queryString}`
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        const templates = await response.json()
        return templates
    },
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