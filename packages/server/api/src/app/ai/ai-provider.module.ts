import { Writable } from 'stream'
import { exceptionHandler } from '@activepieces/server-shared'
import { ActivepiecesError, ErrorCode, isNil, PlatformUsageMetric, PrincipalType, SUPPORTED_AI_PROVIDERS, SupportedAIProvider } from '@activepieces/shared'
import proxy from '@fastify/http-proxy'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { FastifyRequest } from 'fastify'
import { platformUsageService } from '../ee/platform/platform-usage-service'
import { projectLimitsService } from '../ee/projects/project-plan/project-plan.service'
import { aiProviderController } from './ai-provider-controller'
import { aiProviderService } from './ai-provider-service'
import { StreamingParser, Usage } from './providers/types'

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
                const providerConfig = getProviderConfigOrThrow(provider)
                return providerConfig.baseUrl
            },
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onResponse: async (request, reply, response) => {
                request.body = (request as FastifyRequest & { originalBody: Record<string, unknown> }).originalBody
                const projectId = request.principal.projectId
                const { provider } = request.params as { provider: string }
                const isStreaming = aiProviderService.isStreaming(provider, request)
                let streamingParser: StreamingParser
                if (isStreaming) {
                    streamingParser = aiProviderService.streamingParser(provider)
                }

                let buffer = Buffer.from('');

                // Types are not properly defined, pipe does not exist but the stream pipe does
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (response as any).stream.pipe(new Writable({
                    write(chunk, encoding, callback) {
                        buffer = Buffer.concat([buffer, chunk])
                        if (isStreaming) {
                            (reply.raw as NodeJS.WritableStream).write(chunk, encoding)
                            streamingParser.onChunk(chunk.toString())
                        }
                        callback()
                    },
                    async final(callback) {
                        if (isStreaming) {
                            reply.raw.end()
                        }
                        else {
                            await reply.send(JSON.parse(buffer.toString()))
                        }

                        try {
                            if (reply.statusCode >= 400) {
                                app.log.error({
                                    projectId,
                                    request,
                                    response: buffer.toString(),
                                }, 'Error response from AI provider')
                                return
                            }

                            let usage: Usage
                            if (isStreaming) {
                                const finalResponse = streamingParser.onEnd()
                                if (!finalResponse) {
                                    throw new Error('No final response from AI provider')
                                }
                                usage = aiProviderService.calculateUsage(provider, request, finalResponse)
                            }
                            else {
                                const completeResponse = JSON.parse(buffer.toString())
                                usage = aiProviderService.calculateUsage(provider, request, completeResponse)
                            }
                            await platformUsageService(app.log).increaseAiCreditUsage({ projectId, platformId: request.principal.platform.id, provider, model: usage.model, cost: usage.cost })
                        }
                        catch (error) {
                            exceptionHandler.handle({
                                error,
                                projectId,
                                request,
                                response: buffer.toString(),
                                message: 'Error processing AI provider response',
                            }, app.log)
                        }
                        finally {
                            callback()
                        }
                    },
                }))
            },
        },
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        preHandler: async (request) => {
            if (![PrincipalType.ENGINE, PrincipalType.USER].includes(request.principal.type)) {
                throw new ActivepiecesError({
                    code: ErrorCode.AUTHORIZATION,
                    params: {
                        message: 'invalid route for principal type',
                    },
                })
            }

            const provider = (request.params as { provider: string }).provider
            if (aiProviderService.isStreaming(provider, request) && !aiProviderService.providerSupportsStreaming(provider)) {
                throw new ActivepiecesError({
                    code: ErrorCode.AI_REQUEST_NOT_SUPPORTED,
                    params: {
                        message: 'Streaming is not supported for this provider',
                    },
                })
            }

            const model = aiProviderService.extractModelId(provider, request)
            if (!model || !aiProviderService.isModelSupported(provider, model)) {
                throw new ActivepiecesError({
                    code: ErrorCode.AI_MODEL_NOT_SUPPORTED,
                    params: {
                        provider,
                        model: model ?? 'unknown',
                    },
                })
            }

            const projectId = request.principal.projectId
            const exceededLimit = await projectLimitsService(request.log).checkAICreditsExceededLimit(projectId)
            if (exceededLimit) {
                throw new ActivepiecesError({
                    code: ErrorCode.QUOTA_EXCEEDED,
                    params: {
                        metric: PlatformUsageMetric.AI_CREDITS,
                    },
                })
            }

            const userPlatformId = request.principal.platform.id
            const providerConfig = getProviderConfigOrThrow(provider)

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

function getProviderConfigOrThrow(provider: string | undefined): SupportedAIProvider {
    const providerConfig = !isNil(provider) ? SUPPORTED_AI_PROVIDERS.find((p) => p.provider === provider) : undefined
    if (isNil(providerConfig)) {
        throw new ActivepiecesError({
            code: ErrorCode.PROVIDER_PROXY_CONFIG_NOT_FOUND_FOR_PROVIDER,
            params: {
                provider: provider ?? 'unknown',
            },
        })
    }
    return providerConfig
}
