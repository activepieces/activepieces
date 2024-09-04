import { isNil, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, FastifyPluginCallbackTypebox, Type } from '@fastify/type-provider-typebox'
import { projectLimitsService } from 'packages/server/api/src/app/ee/project-plan/project-plan.service'
import { projectService } from 'packages/server/api/src/app/project/project-service'
import { projectUsageService } from 'packages/server/api/src/app/project/usage/project-usage-service'
import { proxyConfigService } from './proxy-config-service'

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

export const projectProxyController: FastifyPluginCallbackTypebox = (
  fastify,
  _opts,
  done,
) => {
  fastify.all('/:provider/*', ProxyRequest, async (request, reply) => {
    try {
      const projectId = request.principal.projectId

      const projectPlan = await projectLimitsService.getPlanByProjectId(projectId)

      const planTokens = projectPlan?.aiTokens

      const platformId = await projectService.getPlatformId(projectId)

      const provider = request.params.provider

      const config = await proxyConfigService.getOrThrow({ platformId, provider: provider })

      if (!config) {
        reply.code(400).send({ error: `Proxy config not found for provider ${provider} and platform ${platformId}` });
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

      const response = await fetch(targetUrl, req)

      const data = await response.json()

      const usage = projectPlan && tokensUsagePath ? calculateUsage(data, tokensUsagePath) : null

      const totalTokensUsage = usage ? await projectUsageService.increaseAITokens(projectId, usage) : null

      if (isNil(totalTokensUsage)) {
        throw new Error(`Failed to calculate usage from response headers ${tokensUsagePath}`)
      }

      if (!isNil(planTokens) && totalTokensUsage > planTokens) {
        throw new Error(`You have exceeded your plan limit of ${planTokens} tokens`)
      }

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