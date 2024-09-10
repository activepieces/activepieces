import { logger } from '@activepieces/server-shared'
import { AiProviderConfig, isNil, PrincipalType, SeekPage } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, FastifyPluginCallbackTypebox, Type } from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { platformMustBeOwnedByCurrentUser } from '../ee/authentication/ee-authorization'
import { projectLimitsService } from '../ee/project-plan/project-plan.service'
import { projectService } from '../project/project-service'
import { projectUsageService } from '../project/usage/project-usage-service'
import { aiProviderService } from './ai-provider.service'

export const aiProviderModule: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preHandler', platformMustBeOwnedByCurrentUser)
    await app.register(aiProviderController, { prefix: '/v1/ai-providers' })
}

const aiProviderController: FastifyPluginCallbackTypebox = (
    fastify,
    _opts,
    done,
) => {
    fastify.post('/:provider', CreateProxyConfigRequest, async (request) => {
        return aiProviderService.upsert(request.principal.platform.id, {
            config: request.body.config,
            baseUrl: request.body.baseUrl,
            provider: request.body.provider,
        })
    })

    fastify.delete('/:provider', DeleteProxyConfigRequest, async (request, reply) => {
        await aiProviderService.delete({
            platformId: request.principal.platform.id,
            provider: request.params.provider,
        })
        await reply.status(StatusCodes.NO_CONTENT).send()
    })

    fastify.get('/', ListProxyConfigRequest, async (request) => {
        return aiProviderService.list(request.principal.platform.id)
    })

    fastify.all('/proxy/:provider/*', ProxyRequest, async (request, reply) => {
        try {
            const projectId = request.principal.projectId

            const projectPlan = await projectLimitsService.getPlanByProjectId(projectId)

            const planTokens = projectPlan?.aiTokens

            const platformId = await projectService.getPlatformId(projectId)

            const provider = request.params.provider

            const aiProvider = await aiProviderService.getOrThrow({ platformId, provider })

            const tokensUsage = await projectUsageService.getAITokensUsage(projectId)

            if (!isNil(planTokens) && tokensUsage > planTokens) {
                reply.code(StatusCodes.TOO_MANY_REQUESTS).send({ error: 'YOU_HAVE_EXCEEDED_YOUR_AI_TOKENS_PLAN_LIMIT' })
                return
            }

            if (!aiProvider) {
                reply.code(StatusCodes.NOT_IMPLEMENTED).send({ error: 'PROVIDER_PROXY_CONFIG_NOT_FOUND' })
                return
            }

            const targetUrl = new URL(`${aiProvider.baseUrl}/${request.params['*']}`)

            const requestHeaders = structuredClone({ ...request.headers })

            const tokensUsagePath = requestHeaders['x-ap-total-usage-body-path']

            console.log('XXXXXXXXXX Request Headers', requestHeaders)

            delete requestHeaders.authorization
            delete requestHeaders.Authorization
            delete requestHeaders['content-length']
            delete requestHeaders.host

            for (const [key, value] of Object.entries(requestHeaders)) {
                if (value === undefined || key.startsWith('x-')) {
                    delete requestHeaders[key]
                }
            }

            const headers = Object.entries({
                ...requestHeaders,
                ...aiProvider.config.defaultHeaders,
            }).flatMap(([key, value]) => value ? [[key, Array.isArray(value) ? value.join(',') : value.toString()]] as [string, string][] : [])

            const req: RequestInit = {
                method: request.method,
                headers,
                body: JSON.stringify(request.body),
            }

            logger.debug({ req }, '[PROXY] Request')

            const response = await fetch(targetUrl, req)

            const data = await response.json()

            logger.debug({ data }, '[PROXY] Response')

            if (isNil(tokensUsagePath)) {
                reply.code(StatusCodes.BAD_REQUEST).send({ error: 'FAILED_TO_CALCULATE_USAGE' })
                return
            }

            await projectUsageService.increaseAITokens(projectId, calculateUsage(data, tokensUsagePath))

            await reply
                .code(response.status)
                .send(data)
        }
        catch (error) {
            fastify.log.error(error)
            await reply.code(500).send({ error: 'Proxy error' })
        }
    })

    done()
}

const calculateUsage = (body: any, usagePath: string | string[]): number => {
    const fields = typeof usagePath === 'string' ? usagePath.split('+').map(field => field.trim()) : usagePath

    return fields.reduce((acc, field) => {
        const fieldPath = field.split('.')
        const value = fieldPath.reduce((acc, field) => acc[field], body)
        if (typeof value !== 'number') {
            return acc
        }
        return acc + value
    }, 0)
}

const ProxyRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE, PrincipalType.ENGINE],
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

const ListProxyConfigRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        tags: ['ai-providers'],
        description: 'List ai provider configs',
        response: {
            [StatusCodes.OK]: SeekPage(AiProviderConfig),
        },
    },
}

const CreateProxyConfigRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        tags: ['ai-providers'],
        description: 'Create ai provider config',
        body: Type.Omit(AiProviderConfig, ['id', 'created', 'updated', 'platformId']),
    },
}

const DeleteProxyConfigRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
    schema: {
        params: Type.Object({
            provider: Type.String(),
        }),
        tags: ['ai-providers'],
        description: 'Delete ai provider config',
    },
}
