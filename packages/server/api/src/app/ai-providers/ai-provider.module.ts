import { ActivepiecesError, ErrorCode, isNil, PrincipalType, SUPPORTED_AI_PROVIDERS } from '@activepieces/shared'
import proxy from '@fastify/http-proxy'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { BillingUsageType, platformUsageService } from '../ee/platform/platform-usage-service'
import { projectLimitsService } from '../ee/projects/project-plan/project-plan.service'
import { aiProviderController } from './ai-provider-controller'
import { aiProviderService } from './ai-provider-service'

export const aiProviderModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(aiProviderController, { prefix: '/v1/ai-providers' })

    await app.register(proxy, {
        prefix: '/v1/ai-providers/proxy/:provider',
        upstream: '',
        disableRequestLogging: false,
        replyOptions: {
            getUpstream(request, _base) {
                const params = request.params as Record<string, string>
                if (isNil(params) || !params['provider']) {
                    throw new Error('Provider not found')
                }
                const provider = params['provider'] as string
                const providerConfig = SUPPORTED_AI_PROVIDERS.find((p) => p.provider === provider)
                if (!providerConfig) {
                    throw new Error('Provider not found')
                }

                return providerConfig.baseUrl
            },
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onResponse: async (request, reply, response) => {
                const projectId = request.principal.projectId
                await platformUsageService(request.log).increaseProjectAndPlatformUsage({ projectId, incrementBy: 1, usageType: BillingUsageType.AI_CREDITS })
                await reply.send(response)
            },
        },
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        preHandler: async (request, reply) => {
            if (![PrincipalType.ENGINE].includes(request.principal.type)) {
                throw new ActivepiecesError({
                    code: ErrorCode.AUTHORIZATION,
                    params: {
                        message: 'invalid route for principal type',
                    },
                })
            }

            const projectId = request.principal.projectId
            const exceededLimit = await projectLimitsService(request.log).aiCreditsExceededLimit(projectId, 0)
            if (exceededLimit) {
                return reply.code(StatusCodes.PAYMENT_REQUIRED).send({
                    error: {
                        message: 'You have exceeded your AI tokens limit for this project.',
                        code: 'ai_tokens_limit_exceeded',
                    },
                })
            }

            const userPlatformId = request.principal.platform.id
            const params = request.params as Record<string, string>
            const provider = params['provider'] as string
            const providerConfig = SUPPORTED_AI_PROVIDERS.find((p) => p.provider === provider)
            if (!providerConfig) {
                throw new Error('Provider not found')
            }

            const platformId = await aiProviderService.getAIProviderPlatformId(userPlatformId)
            const apiKey = await aiProviderService.getApiKey(provider, platformId)

            if (providerConfig.auth.bearer) {
                request.headers[providerConfig.auth.headerName] = `Bearer ${apiKey}`
            }
            else {
                request.headers[providerConfig.auth.headerName] = apiKey
            }

            if (providerConfig.auth.headerName !== 'Authorization') {
                delete request.headers['Authorization']
            }

            if (providerConfig.auth.headerName !== 'authorization') {
                delete request.headers['authorization']
            }
        },
        
    })
}

