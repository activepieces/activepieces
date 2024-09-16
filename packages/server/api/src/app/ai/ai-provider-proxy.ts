import { PrincipalType } from '@activepieces/shared'
import { FastifyPluginCallbackTypebox, Type } from '@fastify/type-provider-typebox'
import { aiTokenLimit } from '../ee/project-plan/ai-token-limit'
import { projectService } from '../project/project-service'
import { projectUsageService } from '../project/usage/project-usage-service'
import { aiProviderService } from './ai-provider.service'


export const proxyController: FastifyPluginCallbackTypebox = (fastify, _opts, done) => {


    fastify.all('/:provider/*', ProxyRequest, async (request, reply) => {
        const { provider } = request.params
        const { projectId } = request.principal

        const platformId = await projectService.getPlatformId(projectId)
        const aiProvider = await aiProviderService.getOrThrow({ platformId, provider })
        await aiTokenLimit.exceededLimit({ projectId, tokensToConsume: 1 })

        const url = buildUrl(aiProvider.baseUrl, request.params['*'])
        try {
            const response = await fetch(url, {
                method: request.method,
                headers: calculateHeaders(request.headers as Record<string, string | string[] | undefined>, aiProvider.config.defaultHeaders),
                body: JSON.stringify(request.body),
            })
            const data = await response.json()
            await projectUsageService.increaseUsage(projectId, 1, 'aiTokens')

            await reply
                .code(response.status)
                .send(data)
        }
        catch (error) {
            if (error instanceof Response) {
                const errorData = await error.json()
                await reply.code(error.status).send(errorData)
            }
            else {
                await reply.code(500).send({ message: 'An unexpected error occurred in the proxy' })
            }
        }
    })
    done()
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
    const cleanedHeaders = Object.entries(requestHeaders).reduce((acc, [key, value]) => {
        if (
            value !== undefined &&
            !['authorization', 'Authorization', 'content-length', 'host'].includes(key) &&
            !key.startsWith('x-')
        ) {
            acc[key as keyof typeof acc] = value
        }
        return acc
    }, {} as Record<string, string | string[] | undefined>)

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