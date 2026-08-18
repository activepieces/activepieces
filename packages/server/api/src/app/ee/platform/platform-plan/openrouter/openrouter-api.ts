import { isNil, tryCatch } from '@activepieces/core-utils'
import { safeHttp } from '@activepieces/server-utils'
import { AxiosError, type Method } from 'axios'
import { system } from '../../../../helper/system/system'
import { AppSystemProp } from '../../../../helper/system/system-props'

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'
const REQUEST_TIMEOUT_MS = 15000

export const openRouterApi = {
    async createKey(request: CreateKeyRequest): Promise<CreateKeyResponse> {
        return openRouterRequest<CreateKeyResponse>({ method: 'POST', path: '/keys', body: request })
    },

    async updateKey({ hash, ...rest }: UpdateKeyRequest): Promise<UpdateKeyResponse> {
        return openRouterRequest<UpdateKeyResponse>({ method: 'PATCH', path: `/keys/${hash}`, body: rest })
    },

    async getKey({ hash }: GetKeyRequest): Promise<GetKeyResponse> {
        return openRouterRequest<GetKeyResponse>({ method: 'GET', path: `/keys/${hash}` })
    },

    async listKeys({ offset, include_disabled }: ListKeysRequest): Promise<ListKeysResponse> {
        return openRouterRequest<ListKeysResponse>({
            method: 'GET',
            path: '/keys',
            query: {
                ...(isNil(offset) ? {} : { offset: offset.toString() }),
                ...(isNil(include_disabled) ? {} : { include_disabled: String(include_disabled) }),
            },
        })
    },
}

async function openRouterRequest<T>({ method, path, body, query }: OpenRouterRequestParams): Promise<T> {
    const apiKey = system.getOrThrow(AppSystemProp.OPENROUTER_PROVISION_KEY)
    const { data: response, error } = await tryCatch(() => safeHttp.axios.request<T>({
        method,
        url: `${OPENROUTER_BASE_URL}${path}`,
        data: body,
        params: query,
        timeout: REQUEST_TIMEOUT_MS,
        headers: { Authorization: `Bearer ${apiKey}` },
    }))
    if (!isNil(error) || isNil(response)) {
        throw new Error(`[OpenRouter] ${method} ${path} error: ${describeFailure(error)}`)
    }
    return response.data
}

function describeFailure(error: unknown): string {
    if (!(error instanceof AxiosError)) {
        return error instanceof Error ? error.message : String(error)
    }
    if (isNil(error.response)) {
        return error.message
    }
    return `${error.response.status} ${JSON.stringify(error.response.data)}`
}

type OpenRouterRequestParams = {
    method: Method
    path: string
    body?: unknown
    query?: Record<string, string>
}

type CreateKeyRequest = {
    name: string
    limit?: number
    limit_reset?: LimitReset
    include_byok_in_limit?: boolean
    expires_at?: Date
}
type CreateKeyResponse = {
    key: string
    data: OpenRouterApikey
}

type UpdateKeyRequest = {
    hash: string
    name?: string
    limit?: number
    limit_reset?: LimitReset | null
    include_byok_in_limit?: boolean
    expires_at?: Date
}
type UpdateKeyResponse = {
    data: OpenRouterApikey
}

type GetKeyRequest = {
    hash: string
}
type GetKeyResponse = {
    data: OpenRouterApikey
}

type ListKeysRequest = {
    offset?: number
    include_disabled?: 'true' | 'false' // default false
}
type ListKeysResponse = {
    data: OpenRouterApikey[]
}

type LimitReset = 'daily' | 'weekly' | 'monthly'

export type OpenRouterApikey = {
    hash: string
    name: string
    label: string
    disabled: boolean

    limit: number | null
    limit_remaining: number | null
    limit_reset: LimitReset | null

    include_byok_in_limit: boolean

    usage: number
    usage_daily: number
    usage_weekly: number
    usage_monthly: number

    byok_usage: number
    byok_usage_daily: number
    byok_usage_weekly: number
    byok_usage_monthly: number

    created_at: string
    updated_at: string | null
    expires_at: string | null
}
