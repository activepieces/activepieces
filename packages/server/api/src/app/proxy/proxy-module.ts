import { PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, FastifyPluginCallbackTypebox, Type } from '@fastify/type-provider-typebox'
import axios, { AxiosRequestConfig } from 'axios'
import { StatusCodes } from 'http-status-codes'
import { projectService } from 'packages/server/api/src/app/project/project-service'
import { proxyConfigService } from './proxy-config-service'
import https from 'https'

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

      const platformId = await projectService.getPlatformId(projectId)

      const provider = request.params.provider

      const config = await proxyConfigService.getOrThrow({ platformId, provider: provider })

      if (!config) {
        reply.code(400).send({ error: `Proxy config not found for provider ${provider} and platform ${platformId}` });
        return
      }

      const targetUrl = new URL(`${config.baseUrl}/${request.params['*']}`);

      const requestHeaders = structuredClone({ ...request.headers })

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