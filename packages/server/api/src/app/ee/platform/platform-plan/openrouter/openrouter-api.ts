import { httpClient, HttpMethod } from '@activepieces/pieces-common'
import { AppSystemProp } from '@activepieces/server-shared'
import { system } from '../../../../helper/system/system'

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

export const openRouterApi = {
    async createKey(request: CreateKeyRequest): Promise<CreateKeyResponse> {
        const apiKey = system.getOrThrow(AppSystemProp.OPENROUTER_PROVISION_KEY)

        const res = await httpClient.sendRequest<CreateKeyResponse>({
            url: `${OPENROUTER_BASE_URL}/keys`,
            method: HttpMethod.POST,
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        })

        return res.body
    },

    async updateKey(request: UpdateKeyRequest): Promise<UpdateKeyResponse> {
        const apiKey = system.getOrThrow(AppSystemProp.OPENROUTER_PROVISION_KEY)

        const { hash, ...rest } = request

        const res = await httpClient.sendRequest<UpdateKeyResponse>({
            url: `${OPENROUTER_BASE_URL}/keys/${hash}`,
            method: HttpMethod.PATCH,
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(rest),
        })

        return res.body
    },

    async getKey(request: GetKeyRequest): Promise<GetKeyResponse> {
        const apiKey = system.getOrThrow(AppSystemProp.OPENROUTER_PROVISION_KEY)

        const res = await httpClient.sendRequest<GetKeyResponse>({
            url: `${OPENROUTER_BASE_URL}/keys/${request.hash}`,
            method: HttpMethod.GET,
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        })

        return res.body
    },

    async listKeys(request: ListKeysRequest): Promise<ListKeysResponse> {
        const apiKey = system.getOrThrow(AppSystemProp.OPENROUTER_PROVISION_KEY)

        const params = new URLSearchParams()

        if (request.offset !== undefined) {
            params.set('offset', request.offset.toString())
        }
        if (request.include_disabled !== undefined) {
            params.set('include_disabled', String(request.include_disabled))
        }

        const res = await httpClient.sendRequest<ListKeysResponse>({
            url: `${OPENROUTER_BASE_URL}/keys?${params.toString()}`,
            method: HttpMethod.GET,
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
        })

        return res.body
    },
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
