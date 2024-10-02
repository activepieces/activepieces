import { exceptionHandler, logger, sentry } from '@activepieces/server-shared'
import { PrincipalType, TelemetryEventName } from '@activepieces/shared'
import {
    FastifyPluginCallbackTypebox,
    Type,
} from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { aiTokenLimit } from '../ee/project-plan/ai-token-limit'
import { telemetry } from '../helper/telemetry.utils'
import { projectService } from '../project/project-service'
import { projectUsageService } from '../project/usage/project-usage-service'
import { aiProviderService } from './ai-provider.service'

export const proxyController: FastifyPluginCallbackTypebox = (
    fastify,
    _opts,
    done,
) => {
    fastify.all('/:provider/*', ProxyRequest, async (request, reply) => {
        const trace = sentry?.startTransaction({ name: 'ai-provider-proxy' })
        const { provider } = request.params
        const { projectId } = request.principal

        const platformIdTrace = trace?.startChild({ name: 'ai-provider-proxy.get-platform-id' })
        const platformId = await projectService.getPlatformId(projectId)
        platformIdTrace?.finish()

        const aiProviderTrace = trace?.startChild({ name: 'ai-provider-proxy.get-ai-provider' })
        const aiProvider = await aiProviderService.getOrThrow({
            platformId,
            provider,
        })
        aiProviderTrace?.finish()

        const limitResponseTrace = trace?.startChild({ name: 'ai-provider-proxy.check-ai-tokens-limit' })
        const limitResponse = await aiTokenLimit.exceededLimit({
            projectId,
            tokensToConsume: 0,
        })
        if (limitResponse.exceeded) {
            return reply.code(StatusCodes.PAYMENT_REQUIRED).send(
                makeOpenAiResponse(
                    'You have exceeded your AI tokens limit for this project.',
                    'ai_tokens_limit_exceeded',
                    {
                        usage: limitResponse.usage,
                        limit: limitResponse.limit,
                    },
                ),
            )
        }
        limitResponseTrace?.finish()

        const urlTrace = trace?.startChild({ name: 'ai-provider-proxy.build-url' })
        const url = buildUrl(aiProvider.baseUrl, request.params['*'])
        urlTrace?.finish()

        const fetchTrace = trace?.startChild({ name: 'ai-provider-proxy.fetch' })
        try {
            const headers = calculateHeaders(
                request.headers as Record<string, string | string[] | undefined>,
                aiProvider.config.defaultHeaders,
            )
            fetchTrace?.setData('outbound.req.url', url)
            fetchTrace?.setData('outbound.req.method', request.method)
            fetchTrace?.setData('outbound.req.headers', headers)
            fetchTrace?.setData('outbound.req.body', JSON.stringify(request.body))
            const response = await fetch(url, {
                method: request.method,
                headers,
                body: JSON.stringify(request.body),
            })
            const data = await response.json()
            fetchTrace?.setData('outbound.res.status', response.status)
            fetchTrace?.setData('outbound.res.headers', response.headers)
            fetchTrace?.setData('outbound.res.body', JSON.stringify(data))

            const increaseUsageTrace = fetchTrace?.startChild({ name: 'ai-provider-proxy.increase-usage' })
            await projectUsageService.increaseUsage(projectId, 1, 'aiTokens')
            increaseUsageTrace?.finish()

            const telemetryTrace = fetchTrace?.startChild({ name: 'ai-provider-proxy.telemetry' })
            telemetry
                .trackProject(projectId, {
                    name: TelemetryEventName.AI_PROVIDER_USED,
                    payload: {
                        projectId,
                        platformId,
                        provider,
                    },
                })
                .catch((e) =>
                    logger.error(e, '[AIProviderProxy#telemetry] telemetry.trackProject'),
                )
            telemetryTrace?.finish()

            await reply.code(response.status).send(data)
        }
        catch (error) {
            if (error instanceof Response) {
                const errorData = await error.json()
                await reply.code(error.status).send(errorData)
            }
            else {
                exceptionHandler.handle(error, fetchTrace?.toContext())
                await reply
                    .code(500)
                    .send({ message: 'An unexpected error occurred in the proxy' })
            }
        }
        fetchTrace?.finish()
        trace?.finish()
    })
    done()
}

function makeOpenAiResponse(
    message: string,
    code: string,
    params: Record<string, unknown>,
) {
    return {
        error: {
            message,
            type: 'invalid_request_error',
            param: params,
            code,
        },
    }
}

function buildUrl(baseUrl: string, path: string): string {
    const url = new URL(path, baseUrl)
    if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Invalid protocol. Only HTTP and HTTPS are allowed.')
    }
    return url.toString()
}

const calculateHeaders = (
    requestHeaders: Record<string, string | string[] | undefined>,
    aiProviderDefaultHeaders: Record<string, string>,
): [string, string][] => {
    const cleanedHeaders = Object.entries(requestHeaders).reduce(
        (acc, [key, value]) => {
            if (
                value !== undefined &&
                !['authorization', 'content-length', 'host'].includes(
                    key.toLocaleLowerCase(),
                ) &&
                !key.startsWith('x-')
            ) {
                acc[key as keyof typeof acc] = value
            }
            return acc
        },
        {} as Record<string, string | string[] | undefined>,
    )

    return Object.entries({
        ...cleanedHeaders,
        ...aiProviderDefaultHeaders,
    })
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [
            key,
            Array.isArray(value) ? value.join(',') : value!.toString(),
        ])
}

const ProxyRequest = {
    config: {
        allowedPrincipals: [PrincipalType.ENGINE],
    },
    schema: {
        tags: ['ai-providers'],
        description: 'Proxy a request to a third party service',
        params: Type.Object({
            provider: Type.String(),
            '*': Type.String(),
        }),
    },
}
