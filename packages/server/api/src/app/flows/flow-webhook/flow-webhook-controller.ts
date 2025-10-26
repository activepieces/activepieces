import { CreateFlowsWebhooksRequestBody, Permission, PrincipalType, SERVICE_KEY_SECURITY_OPENAPI } from "@activepieces/shared"
import { FastifyPluginAsyncTypebox, Type } from "@fastify/type-provider-typebox"
import { flowWebhookService } from "./flow-webhook-service"

export const flowWebhookController: FastifyPluginAsyncTypebox = async (app) => {
  app.post('/', CreateWebhooksRequestOptions, async (request) => {
    return flowWebhookService(request.log).createWebhook({
      projectId: request.principal.projectId,
      targetFlowId: request.body.targetFlowId,
      triggerFlowIds: request.body.triggerFlowIds,
    })
  })
  app.delete('/:id', DeleteWebhooksRequestOptions, async (request) => {
    return flowWebhookService(request.log).deleteWebhook({
      projectId: request.principal.projectId,
      id: request.params.id,
    })
  })
}


const CreateWebhooksRequestOptions = {
  config: {
      allowedPrincipals: [PrincipalType.ENGINE, PrincipalType.USER],
      permission: Permission.WRITE_FLOW,
  },
  schema: {
      tags: ['flows'],
      security: [SERVICE_KEY_SECURITY_OPENAPI],
      description: 'Bulk Create of webhooks for many flows',
      body: CreateFlowsWebhooksRequestBody,
  },
}

const DeleteWebhooksRequestOptions = {
  config: {
      allowedPrincipals: [PrincipalType.ENGINE, PrincipalType.USER],
      permission: Permission.WRITE_FLOW,
  },
  schema: {
      tags: ['flows'],
      security: [SERVICE_KEY_SECURITY_OPENAPI],
      description: 'Delete a webhook',
      params: Type.Object({
        id: Type.String(),
      }),
  },
}