import { exceptionHandler, rejectedPromiseHandler } from '@activepieces/server-shared'
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
        const { provider } = request.params
        const { projectId } = request.principal

        const platformId = await projectService.getPlatformId(projectId)
        const aiProvider = await aiProviderService.getOrThrow({
            platformId,
            provider,
        })
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

        const url = buildUrl(aiProvider.baseUrl, request.params['*'])
        try {
            const cleanHeaders = calculateHeaders(
                request.headers as Record<string, string | string[] | undefined>,
                aiProvider.config.defaultHeaders,
            )
            const response = await fetch(url, {
                method: request.method,
                headers: cleanHeaders,
                body: JSON.stringify(request.body),
            })

            const responseContentType = response.headers.get('content-type')

            const data = await parseResponseData(response, responseContentType)

            await projectUsageService.increaseUsage(projectId, 1, 'aiTokens')

            rejectedPromiseHandler(telemetry.trackProject(projectId, {
                name: TelemetryEventName.AI_PROVIDER_USED,
                payload: {
                    projectId,
                    platformId,
                    provider,
                },
            }))
            await reply.code(response.status).type(responseContentType ?? 'text/plain').send(data)
        }
        catch (error) {
            if (error instanceof Response) {
                const errorData = await error.json()
                await reply.code(error.status).send(errorData)
            }
            else {
                exceptionHandler.handle(error)
                await reply
                    .code(500)
                    .send({ message: 'An unexpected error occurred in the proxy' })
            }
        }
    })
    done()
}

async function parseResponseData(response: Response, responseContentType: string | null) {
    if (responseContentType?.includes('application/json')) {
        return response.json()
    }
    if (responseContentType?.includes('application/octet-stream')) {
        return Buffer.from(await response.arrayBuffer())
    }
    if (responseContentType?.includes('audio/') || responseContentType?.includes('video/') || responseContentType?.includes('image/')) {
        return Buffer.from(await response.arrayBuffer())
    }
    return response.text()
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
    const forbiddenHeaders = [
        'authorization',
        'host',
        'content-length',
        'transfer-encoding',
        'connection',
        'keep-alive',
        'upgrade',
        'expect',
        'user-agent',
    ]
    const cleanedHeaders = Object.entries(requestHeaders).reduce(
        (acc, [key, value]) => {
            if (
                value !== undefined &&
                !forbiddenHeaders.includes(key.toLowerCase()) &&
                !key.toLowerCase().startsWith('x-')
            ) {
                acc[key as keyof typeof acc] = value
            }
            return acc
        },
        {} as Record<string, string | string[]>,
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
        description: 'Proxy a request to a third party service',
        params: Type.Object({
            provider: Type.String(),
            '*': Type.String(),
        }),
    },
}
