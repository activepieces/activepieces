import { FastifyPluginAsyncTypebox, FastifyPluginCallbackTypebox, Type } from '@fastify/type-provider-typebox'
import { projectProxyConfigService } from './project-proxy-config-service'
import { Permission, PrincipalType } from '@activepieces/shared'
import { StatusCodes } from 'http-status-codes'
import axios from 'axios'

export const projectModule: FastifyPluginAsyncTypebox = async (app) => {
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
    }),
    response: {
      [StatusCodes.OK]: Type.Unknown(),
    }
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

      const config = await projectProxyConfigService.get(projectId, request.params.provider)

      if (!config) {
        reply.code(404).send({ error: 'Proxy config not found' });
        return
      }

      const targetUrl = `${config.baseUrl}${request.url.replace('/proxy', '')}`;

      const response = await axios.request({
        method: request.method,
        url: targetUrl,
        headers: {
          ...config.defaultHeaders,
          ...request.headers,
        },
        data: request.body,
        responseType: "json",
        timeout: 5 * 60 * 1000, // 5 minutes since most LLMs are slow
      })

      const data = await response.data
      reply.code(response.status).send(data);
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Proxy error' });
    }
  })

  done()
}