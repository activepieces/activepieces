import { AuthenticationType, httpClient, HttpMethod } from "@activepieces/pieces-common";
import { Property, PropertyContext } from "@activepieces/pieces-framework";
import { FlowWebhook } from "@activepieces/shared";

export const createWebhooks = async (ctx: PropertyContext, targetFlowId: string, triggerFlowIds: string[]): Promise<FlowWebhook> => {
  const response = await httpClient.sendRequest<FlowWebhook>({
    method: HttpMethod.POST,
    url: `${ctx.server.apiUrl}v1/flow-webhook`,
    body: {
      targetFlowId,
      triggerFlowIds,
    },
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: ctx.server.token,
    },
  });
  return response.body
}

export const deleteWebhook = async (ctx: PropertyContext, webhookId: string): Promise<void> => {
  await httpClient.sendRequest({
    method: HttpMethod.DELETE,
    url: `${ctx.server.apiUrl}v1/flow-webhook/${webhookId}`,
    body: {},
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: ctx.server.token,
    },
  })
}

export const flowIdsDropdown = Property.MultiSelectDropdown({
  displayName: "Flows",
  description: "Select flows that triggers this action when failed",
  required: true,
  refreshers: [],
  options: async (propsValue, ctx) => {
    const { data: flows } = await ctx.flows.list();

    return {
      options: [
        ...flows.map((flow) => ({
            label: flow.version.displayName,
            value: flow.externalId,
        })),
      ],
    }
  }
})