import { AppSystemProp } from '@activepieces/server-shared'
import { ApEdition, isNil, SupportedAIProviders } from '@activepieces/shared'
import proxy from '@fastify/http-proxy'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { system } from '../helper/system/system'
import { aiProviderController } from './ai-provider-controller'
import { aiProviderService } from './ai-provider-service'

// TODO (@amrdb) handle isEnterpriseCustomerOnCloud
const isCloudEdition = system.getEdition() === ApEdition.CLOUD

export const aiProviderModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(aiProviderController, { prefix: '/v1/ai-providers' })

    await app.register(proxy, {
        prefix: '/v1/ai-providers/proxy/:provider',
        upstream: '',
        replyOptions: {
            getUpstream(request, _base) {
                const params = request.params as Record<string, string>
                if (isNil(params) || !params['provider']) {
                    throw new Error('Provider not found')
                }
                const provider = params['provider'] as string
                const providerConfig = SupportedAIProviders.find((p) => p.provider === provider)
                if (!providerConfig) {
                    throw new Error('Provider not found')
                }

                return providerConfig.baseUrl
            },
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onResponse: async (request, reply, response) => {
                // TODO (@amrdb) increaseProjectAndPlatformUsage
                await new Promise((resolve) => setTimeout(resolve, 1000))
                await reply.send(response)
            },
        },
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        preHandler: async (request, _reply) => {
            // TODO (@amrdb) check aiCreditsExceededLimit
            const platformId = request.principal.platform.id
            const params = request.params as Record<string, string>
            const provider = params['provider'] as string
            const providerConfig = SupportedAIProviders.find((p) => p.provider === provider)
            if (!providerConfig) {
                throw new Error('Provider not found')
            }
            const apiKey = await aiProviderService.getApiKey(isCloudEdition ? system.getOrThrow(AppSystemProp.CLOUD_PLATFORM_ID) : platformId, provider)

            if (providerConfig.auth.bearer) {
                request.headers[providerConfig.auth.headerName] = `Bearer ${apiKey}`
            }
            else {
                request.headers[providerConfig.auth.headerName] = apiKey
            }

            if (providerConfig.auth.headerName !== 'Authorization') {
                delete request.headers['authorization']
                delete request.headers['Authorization']
            }
        },
        
    })
}

