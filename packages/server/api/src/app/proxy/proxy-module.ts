import { isNil, PrincipalType, ProxyConfig, SeekPage } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, FastifyPluginCallbackTypebox, Type } from '@fastify/type-provider-typebox'
import { projectLimitsService } from 'packages/server/api/src/app/ee/project-plan/project-plan.service'
import { projectService } from 'packages/server/api/src/app/project/project-service'
import { projectUsageService } from 'packages/server/api/src/app/project/usage/project-usage-service'
import { proxyConfigService } from './proxy-config-service'
import { StatusCodes } from 'http-status-codes'
import { logger } from '@activepieces/server-shared'

export const proxyModule: FastifyPluginAsyncTypebox = async (app) => {
  await app.register(projectProxyController, { prefix: '/v1/proxy' })
}

const ProxyRequest = {
  config: {
    allowedPrincipals: [PrincipalType.USER, PrincipalType.SERVICE, PrincipalType.ENGINE],
  },
  schema: {
    tags: ['proxy'],
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
    tags: ['proxy'],
    description: 'List proxy configs',
    response: {
      [StatusCodes.OK]: SeekPage(ProxyConfig),
    },
  },
}

const UpdateProxyConfigRequest = {
  config: {
    allowedPrincipals: [PrincipalType.USER],
  },
  schema: {
    params: Type.Object({
      id: Type.String(),
    }),
    tags: ['proxy'],
    description: 'Upsert proxy config',
    body: Type.Partial(ProxyConfig),
  },
}

const CreateProxyConfigRequest = {
  config: {
    allowedPrincipals: [PrincipalType.USER],
  },
  schema: {
    tags: ['proxy'],
    description: 'Create proxy config',
    body: Type.Omit(ProxyConfig, ['id', 'created', 'updated', 'platformId']),
  },
}

const DeleteProxyConfigRequest = {
  config: {
    allowedPrincipals: [PrincipalType.USER],
  },
  schema: {
    params: Type.Object({
      id: Type.String(),
    }),
    tags: ['proxy'],
    description: 'Delete proxy config',
  },
}

export const projectProxyController: FastifyPluginCallbackTypebox = (
  fastify,
  _opts,
  done,
) => {

  fastify.post('/config', CreateProxyConfigRequest, async (request, reply) => {
    let platformId = request.principal.platform.id
    if (isNil(platformId)) {
      platformId = await projectService.getPlatformId(request.principal.projectId)
    }
    const proxyConfig = await proxyConfigService.create({ ...request.body, platformId })
    await reply.status(StatusCodes.OK).send(proxyConfig)
  })

  fastify.delete('/config/:id', DeleteProxyConfigRequest, async (request, reply) => {
    await proxyConfigService.delete(request.params.id)
    await reply.status(StatusCodes.OK).send()
  })

  fastify.patch('/config/:id', UpdateProxyConfigRequest, async (request, reply) => {
    await proxyConfigService.update(request.params.id, request.body)
    await reply.status(StatusCodes.OK).send()
  })

  fastify.get('/config', ListProxyConfigRequest, async (request, reply) => {
    let platformId = request.principal.platform.id
    if (isNil(platformId)) {
      platformId = await projectService.getPlatformId(request.principal.projectId)
    }
    const page = await proxyConfigService.list(platformId)
    await reply.status(StatusCodes.OK).send(page)
  })

  fastify.all('/:provider/*', ProxyRequest, async (request, reply) => {
    try {
      const projectId = request.principal.projectId

      const projectPlan = await projectLimitsService.getPlanByProjectId(projectId)

      const planTokens = projectPlan?.aiTokens

      const platformId = await projectService.getPlatformId(projectId)

      const provider = request.params.provider

      const config = await proxyConfigService.getOrThrow({ platformId, provider: provider })

      const tokensUsage = await projectUsageService.getAITokensUsage(projectId)

      if (!isNil(planTokens) && tokensUsage > planTokens) {
        reply.code(StatusCodes.TOO_MANY_REQUESTS).send({ error: "YOU_HAVE_EXCEEDED_YOUR_AI_TOKENS_PLAN_LIMIT" });
        return
      }

      if (!config) {
        reply.code(StatusCodes.NOT_IMPLEMENTED).send({ error: "PROVIDER_PROXY_CONFIG_NOT_FOUND" });
        return
      }

      const targetUrl = new URL(`${config.baseUrl}/${request.params['*']}`);

      const requestHeaders = structuredClone({ ...request.headers })

      const tokensUsagePath = requestHeaders['x-ap-total-usage-body-path']

      console.log('XXXXXXXXXX Request Headers', requestHeaders)

      delete requestHeaders['authorization']
      delete requestHeaders['Authorization']
      delete requestHeaders['content-length']
      delete requestHeaders['host']

      for (const [key, value] of Object.entries(requestHeaders)) {
        if (value === undefined || key.startsWith('x-')) {
          delete requestHeaders[key]
        }
      }

      const headers = Object.entries({
        ...requestHeaders,
        ...config.defaultHeaders,
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
        reply.code(StatusCodes.BAD_REQUEST).send({ error: "FAILED_TO_CALCULATE_USAGE" });
        return
      }

      await projectUsageService.increaseAITokens(projectId, calculateUsage(data, tokensUsagePath))

      await reply
        .code(response.status)
        .send(data);
    } catch (error) {
      fastify.log.error(error);
      await reply.code(500).send({ error: 'Proxy error' });
    }
  })

  done()
}

const calculateUsage = (body: any, usagePath: string | string[]): number => {
  const fields = typeof usagePath === "string" ? usagePath.split('+').map(field => field.trim()) : usagePath

  return fields.reduce((acc, field) => {
    const fieldPath = field.split('.')
    const value = fieldPath.reduce((acc, field) => acc[field], body)
    if (typeof value !== 'number') {
      return acc
    }
    return acc + value
  }, 0)
}