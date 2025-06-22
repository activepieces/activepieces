import { Writable } from 'stream'
import { ActivepiecesError, ErrorCode, isNil, PlatformUsageMetric, PrincipalType, SUPPORTED_AI_PROVIDERS, SupportedAIProvider } from '@activepieces/shared'
import proxy from '@fastify/http-proxy'
import { createParser, EventSourceMessage, type EventSourceParser } from 'eventsource-parser'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
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
                const providerConfig = getProviderConfigOrThrow(provider)
                return providerConfig.baseUrl
            },
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onResponse: async (request, reply, response) => {
                request.body = (request as FastifyRequestWithOriginalBody).originalBody
                const projectId = request.principal.projectId
                const { provider } = request.params as { provider: string }

                const isStream = request.url.includes('openai/v1/responses') && (request.body as { stream?: boolean }).stream
                let buffer = Buffer.from('');
                let parser: EventSourceParser
                const events: EventSourceMessage[] = []

                if (isStream) {
                    parser = createParser({
                        async onEvent(event) {
                            events.push(event)
                            try {
                                if (['response.completed', 'response.incomplete'].includes(event.event ?? '')) {
                                    const completeResponse = JSON.parse(event.data).response
                                    const { cost, model } = aiProviderService.calculateUsage(provider, request, completeResponse)
                                    await aiProviderService.increaseProjectAIUsage({ projectId, provider, model, cost })
                                } else if (['response.error', 'response.failed'].includes(event.event ?? '')) {
                                    app.log.error({
                                        event,
                                        body: request.body,
                                        response: buffer.toString(),
                                    }, 'Error response from stream AI provider')
                                }
                            } catch (error) {
                                app.log.error({
                                    error,
                                    event,
                                    body: request.body,
                                    response: events,
                                }, 'Error parsing response from stream AI provider')
                            }
                        }
                    });
                }

                // Types are not properly defined, pipe does not exist but the stream pipe does
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (response as any).stream.pipe(new Writable({
                    write(chunk, encoding, callback) {
                        if (isStream) {
                            parser.feed(chunk.toString())
                        } else {
                            buffer = Buffer.concat([buffer, chunk]);
                        }

                        (reply.raw as NodeJS.WritableStream).write(chunk, encoding)
                        callback()
                    },
                    async final(callback) {
                        reply.raw.end()
                        if (reply.statusCode >= 400) {
                            app.log.error({
                                provider,
                                projectId,
                                body: request.body,
                                response: buffer.toString(),
                            }, 'Error response from AI provider')
                            return callback();
                        }
                        if (isStream) return callback();

                        try {
                            const completeResponse = JSON.parse(buffer.toString())
                            const { cost, model } = aiProviderService.calculateUsage(provider, request, completeResponse)
                            await aiProviderService.increaseProjectAIUsage({ projectId, provider, model, cost })
                        }
                        catch (error) {
                            app.log.error({
                                error,
                                provider,
                                projectId,
                                body: request.body,
                                response: buffer.toString(),
                            }, 'Error processing AI provider response')
                        }
                        finally {
                            callback()
                        }
                    },
                }))
            },
        },
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        preHandler: async (request, reply) => {
            if (![PrincipalType.ENGINE, PrincipalType.USER].includes(request.principal.type)) {
                throw new ActivepiecesError({
                    code: ErrorCode.AUTHORIZATION,
                    params: {
                        message: 'invalid route for principal type',
                    },
                })
            }

            if ((request.body as { stream?: boolean }).stream && !request.url.includes('openai/v1/responses')) {
                return reply.status(StatusCodes.BAD_REQUEST).send({
                    message: 'stream is only supported for openai/v1/responses API',
                })
            }

            const params = request.params as Record<string, string>
            const provider = params['provider'] as string
            const providerConfig = getProviderConfigOrThrow(provider)

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
            const exceededLimit = await projectLimitsService(request.log).aiCreditsExceededLimit(projectId, 0)
            if (exceededLimit) {
                throw new ActivepiecesError({
                    code: ErrorCode.QUOTA_EXCEEDED,
                    params: {
                        metric: PlatformUsageMetric.AI_TOKENS,
                    },
                })
            }

            const platformId = await aiProviderService.getAIProviderPlatformId(request.principal.platform.id)
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
            (request as FastifyRequestWithOriginalBody).originalBody = request.body as Record<string, unknown>
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

type FastifyRequestWithOriginalBody = FastifyRequest & { originalBody: Record<string, unknown> }
