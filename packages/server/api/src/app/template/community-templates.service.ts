import {
    ActivepiecesError,
    ErrorCode,
    isNil,
    ListTemplatesRequestQuery,
    SeekPage,
    Template,
} from '@activepieces/shared'

const TEMPLATES_SOURCE_URL = 'https://cloud.activepieces.com/api/v1/templates'
const TEMPLATES_MANAGER_SOURCE_URL = 'https://cloud.activepieces.com/api/v1/templates-manager'

export const communityTemplates = {
    getOrThrow: async (id: string): Promise<Template> => {
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
        return categories
    },
    list: async (request: ListTemplatesRequestQuery): Promise<SeekPage<Template>> => {
        const queryString = convertToQueryString(request)
        const url = `${TEMPLATES_SOURCE_URL}?${queryString}`
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        const templates = await response.json()
        return templates
    },
    view: async (id: string): Promise<Template> => {
        const url = `${TEMPLATES_MANAGER_SOURCE_URL}/${id}/view`
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        const template = await response.json()
        return template
    },
    install: async ({ id, userId }: InstallParams): Promise<Template> => {
        const url = `${TEMPLATES_MANAGER_SOURCE_URL}/${id}/install`
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
            }),
        })
        const template = await response.json()
        return template
    },
    setStatus: async ({ id, flowId, status }: SetStatusParams): Promise<Template> => {
        const url = `${TEMPLATES_MANAGER_SOURCE_URL}/${id}/status`
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                flowId,
                status,
            }),
        })
        const template = await response.json()
        return template
    },
    clickExploreButton: async ({ userId }: ClickExploreButtonParams): Promise<Template> => {
        const url = `${TEMPLATES_MANAGER_SOURCE_URL}/click-explore-button`
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
            }),
        })
        const template = await response.json()
        return template
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

type SetStatusParams = {
    id: string
    flowId: string
    status: boolean
}

type ClickExploreButtonParams = {
    userId: string
}

type InstallParams = {
    id: string
    userId: string
}