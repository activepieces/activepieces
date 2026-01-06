import { AppSystemProp } from '@activepieces/server-shared'
import {
    isNil,
    ListTemplatesRequestQuery,
    SeekPage,
    Template,
} from '@activepieces/shared'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { system } from '../helper/system/system'

export const communityTemplates = {
    get: async (id: string): Promise<Template | null> => {
        try {
            const templateSource = system.get(AppSystemProp.TEMPLATES_SOURCE_URL)
            if (isNil(templateSource)) {
                return null
            }
            const url = `${templateSource}/${id}`
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            if (!response.ok) {
                return null
            }
            const template = await response.json()
            return template
        }
        catch (error) {
            return null
        }
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