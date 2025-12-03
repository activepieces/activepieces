import { system } from '../../../helper/system/system'
import { AppSystemProp } from '@activepieces/server-shared'
import { OpenRouter } from '@openrouter/sdk'
import { OpenRouterApiKeyEntity, OpenRouterApiKeySchema } from './openrouter-api-key-entity'
import { repoFactory } from '../../../core/db/repo-factory'
import { isNil, PlatformId } from '@activepieces/shared'


const openRouterApiKeyRepo = repoFactory<OpenRouterApiKeySchema>(OpenRouterApiKeyEntity)
let _provisioningClient: OpenRouter | undefined

export const openRouter = {
    getProvisioningClient(): OpenRouter {
        if (_provisioningClient) return _provisioningClient

        _provisioningClient = new OpenRouter({
            apiKey: system.getOrThrow(AppSystemProp.OPENROUTER_API_KEY),
        })

        return _provisioningClient
    },

    async getPlatformClient(platformId: PlatformId): Promise<OpenRouter> {
        let key: string

        const savedKey = await openRouterApiKeyRepo().findOneBy({ platformId })
        if (isNil(savedKey)) {
            key = await this._createApiKey(platformId)
        } else {
            key = savedKey.apiKey
        }

        return new OpenRouter({ apiKey: key })
    },

    // TODO: handle the race condition here, the keys can be created more than once per platform
    async _createApiKey(platformId: PlatformId): Promise<string> {
        const creditLimit: number | undefined = undefined
        const { key } = await this.getProvisioningClient().apiKeys.create({
            name: platformId,
            limit: creditLimit,
        })
        
        await openRouterApiKeyRepo().insert({
            apiKey: key,
            platformId,
            creditLimit,
        })

        return key
    }
}