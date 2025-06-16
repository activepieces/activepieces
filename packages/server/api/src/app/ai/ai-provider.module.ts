import { Writable } from 'stream'
import { ActivepiecesError, ErrorCode, isNil, PlatformUsageMetric, PrincipalType, SUPPORTED_AI_PROVIDERS, SupportedAIProvider } from '@activepieces/shared'
import proxy from '@fastify/http-proxy'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { FastifyRequest } from 'fastify'
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
            rewriteRequestHeaders: (_request, headers) => {
                headers['accept-encoding'] = 'identity'
                return headers
            },
            getUpstream(request, _base) {
                const params = request.params as Record<string, string> | null
                const provider = params?.['provider']
                const providerConfig = getProviderConfig(provider)
                if (isNil(providerConfig)) {
                    throw new ActivepiecesError({
                        code: ErrorCode.PROVIDER_PROXY_CONFIG_NOT_FOUND_FOR_PROVIDER,
                        params: {
                            provider: provider ?? 'unknown',
                        },
                    })
                }
                return providerConfig.baseUrl
            },
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onResponse: async (request, reply, response) => {
                request.body = (request as FastifyRequest & { originalBody: Record<string, unknown> }).originalBody
                const projectId = request.principal.projectId
                const params = request.params as Record<string, string> | null
                const provider = params?.['provider'] as string

                let buffer = Buffer.from('')

                response.pipe(new Writable({
                    write(chunk, encoding, callback) {
                        buffer = Buffer.concat([buffer, chunk])
                        callback()
                    },
                    async final(callback) {
                        try {
                            if (reply.statusCode >= 400) {
                                app.log.error({
                                    response,
                                    body: buffer.toString(),
                                }, 'Error response from AI provider')
                                await reply.send(buffer)
                                return callback()
                            }

                            const completeResponse = JSON.parse(buffer.toString())
                            const { cost, model } = aiProviderService.calculateUsage(provider, request, completeResponse)
                            await aiProviderService.increaseProjectAIUsage({ projectId, provider, model, cost })
                            await reply.send(buffer)
                            callback()
                        }
                        catch (error) {
                            app.log.error({
                                error,
                                provider,
                                projectId,
                                body: buffer.toString(),
                            }, 'Error processing AI provider response')
                            await reply.send(buffer)
                            callback()
                        }
                    },
                }))
            },
        },
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        preHandler: async (request, _reply) => {
            if (![PrincipalType.ENGINE, PrincipalType.USER].includes(request.principal.type)) {
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
                throw new ActivepiecesError({
                    code: ErrorCode.QUOTA_EXCEEDED,
                    params: {
                        metric: PlatformUsageMetric.AI_TOKENS,
                    },
                })
            }

            const userPlatformId = request.principal.platform.id
            const params = request.params as Record<string, string>
            const provider = params['provider'] as string
            const providerConfig = SUPPORTED_AI_PROVIDERS.find((p) => p.provider === provider)
            if (!providerConfig) {
                throw new ActivepiecesError({
                    code: ErrorCode.PROVIDER_PROXY_CONFIG_NOT_FOUND_FOR_PROVIDER,
                    params: {
                        provider: params['provider'],
                    },
                })
            }

            const model = aiProviderService.extractModel(provider, request)
            if (!model || !aiProviderService.isModelSupported(provider, model)) {
                throw new ActivepiecesError({
                    code: ErrorCode.AI_MODEL_NOT_SUPPORTED,
                    params: {
                        provider,
                        model: model ?? 'unknown',
                    },
                })
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
        preValidation: (request, _reply, done) => {
            (request as FastifyRequest & { originalBody: Record<string, unknown> }).originalBody = request.body as Record<string, unknown>
            done()
        },
    })
}

function getProviderConfig(provider: string | undefined): SupportedAIProvider | undefined {
    if (isNil(provider)) {
        return undefined
    }
    return SUPPORTED_AI_PROVIDERS.find((p) => p.provider === provider)
}
