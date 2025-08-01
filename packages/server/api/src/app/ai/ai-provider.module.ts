import { Writable } from 'stream'
import { exceptionHandler } from '@activepieces/server-shared'
import { ActivepiecesError, AI_USAGE_AGENT_ID_HEADER, AI_USAGE_FEATURE_HEADER, AI_USAGE_MCP_ID_HEADER, AIUsageFeature, AIUsageMetadata, ErrorCode, isNil, PlatformUsageMetric, PrincipalType, SUPPORTED_AI_PROVIDERS, SupportedAIProvider } from '@activepieces/shared'
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
                return (request as ModifiedFastifyRequest).customUpstream
            },
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onResponse: async (request, reply, response) => {
                request.body = (request as ModifiedFastifyRequest).originalBody
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
                            try {
                                await reply.send(JSON.parse(buffer.toString()))
                            }
                            catch (error) {
                                app.log.error({
                                    projectId,
                                    request,
                                    response: buffer.toString(),
                                }, 'Error response from AI provider')
                                return
                            }
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

                            const metadata = buildAIUsageMetadata(request.headers)
                            await platformUsageService(app.log).increaseAiCreditUsage({ 
                                projectId,
                                platformId: request.principal.platform.id,
                                provider,
                                model: usage.model,
                                cost: usage.cost,
                                metadata,
                            })
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

            validateAIUsageHeaders(request.headers)

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
            if (!model || !aiProviderService.isModelSupported(provider, model, request)) {
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
            const config = await aiProviderService.getConfig(provider, platformId);

            (request as ModifiedFastifyRequest).customUpstream = aiProviderService.getBaseUrl(provider, config)
            request.raw.url = aiProviderService.rewriteUrl(provider, config, request.url)

            const authHeaders = aiProviderService.getAuthHeaders(provider, config)
            Object.entries(authHeaders).forEach(([key, value]) => {
                request.headers[key] = value
            })

            if (providerConfig.auth.headerName !== 'Authorization') {
                delete request.headers['Authorization']
            }

            if (providerConfig.auth.headerName !== 'authorization') {
                delete request.headers['authorization']
            }
        },
        preValidation: (request, _reply, done) => {
            (request as ModifiedFastifyRequest).originalBody = request.body as Record<string, unknown>
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

function validateAIUsageHeaders(headers: Record<string, string | string[] | undefined>): void {
    const feature = headers[AI_USAGE_FEATURE_HEADER] as AIUsageFeature
    const agentId = headers[AI_USAGE_AGENT_ID_HEADER] as string | undefined
    const mcpId = headers[AI_USAGE_MCP_ID_HEADER] as string | undefined

    // Validate feature header
    const supportedFeatures = Object.values(AIUsageFeature).filter(f => f !== AIUsageFeature.UNKNOWN) as AIUsageFeature[]
    if (feature && !supportedFeatures.includes(feature)) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: {
                message: `${AI_USAGE_FEATURE_HEADER} header must be one of the following: ${supportedFeatures.join(', ')}`,
            },
        })
    }

    if (feature === AIUsageFeature.AGENTS && !agentId) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: {
                message: `${AI_USAGE_AGENT_ID_HEADER} header is required when feature is ${AIUsageFeature.AGENTS}`,
            },
        })
    }
    
    if (feature === AIUsageFeature.MCP && !mcpId) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: {
                message: `${AI_USAGE_MCP_ID_HEADER} header is required when feature is ${AIUsageFeature.MCP}`,
            },
        })
    }
}

function buildAIUsageMetadata(headers: Record<string, string | string[] | undefined>): AIUsageMetadata {
    const feature = headers[AI_USAGE_FEATURE_HEADER] as AIUsageFeature
    const agentId = headers[AI_USAGE_AGENT_ID_HEADER] as string | undefined
    const mcpId = headers[AI_USAGE_MCP_ID_HEADER] as string | undefined

    if (!feature) {
        return { feature: AIUsageFeature.UNKNOWN }
    }

    switch (feature) {
        case AIUsageFeature.AGENTS:
            return { feature: AIUsageFeature.AGENTS, agentid: agentId! }
        case AIUsageFeature.MCP:
            return { feature: AIUsageFeature.MCP, mcpid: mcpId! }
        default:
            return { feature }
    }
}

type ModifiedFastifyRequest = FastifyRequest & { customUpstream: string, originalBody: Record<string, unknown> }
