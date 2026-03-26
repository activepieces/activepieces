import { HttpMethod, httpClient, HttpRequest } from '@activepieces/pieces-common';

/**
 * Context passed from triggers/actions to the client.
 * Uses the AP project's externalId (= Supabase user ID) for auth.
 * The server resolves company from this user ID.
 */
interface OpplifyContext {
  projectId: string;
  externalId: string;
  baseUrl: string;
}

interface SubscribeParams {
  eventType: string;
  webhookUrl: string;
  flowId: string;
  triggerName: string;
  filters?: Record<string, unknown>;
}

interface UnsubscribeParams {
  subscriptionId?: string;
  flowId?: string;
  eventType?: string;
}

interface TestTriggerParams {
  eventType: string;
  filters?: Record<string, unknown>;
}

function buildRequest(
  ctx: OpplifyContext,
  method: HttpMethod,
  path: string,
  body?: unknown
): HttpRequest {
  const baseUrl = ctx.baseUrl.endsWith('/') ? ctx.baseUrl.slice(0, -1) : ctx.baseUrl;
  return {
    method,
    url: `${baseUrl}/api/${path}`,
    headers: {
      'Content-Type': 'application/json',
      'X-Opplify-Project-Id': ctx.projectId,
      'X-Opplify-External-Id': ctx.externalId,
    },
    body: body ?? undefined,
  };
}

export function opplifyClient(ctx: OpplifyContext) {
  return {
    async subscribe(params: SubscribeParams): Promise<string> {
      const response = await httpClient.sendRequest<{ subscriptionId: string }>(
        buildRequest(ctx, HttpMethod.POST, 'event-bridge/subscribe', {
          eventType: params.eventType,
          webhookUrl: params.webhookUrl,
          flowId: params.flowId,
          triggerName: params.triggerName,
          filters: params.filters || {},
        })
      );
      return response.body.subscriptionId;
    },

    async unsubscribe(params: UnsubscribeParams): Promise<void> {
      await httpClient.sendRequest(
        buildRequest(ctx, HttpMethod.DELETE, 'event-bridge/subscribe', params)
      );
    },

    async testTrigger(params: TestTriggerParams): Promise<unknown> {
      const response = await httpClient.sendRequest(
        buildRequest(ctx, HttpMethod.POST, 'event-bridge/test', {
          eventType: params.eventType,
          filters: params.filters || {},
        })
      );
      return response.body;
    },

    async callAction(path: string, body: Record<string, unknown>): Promise<unknown> {
      const response = await httpClient.sendRequest(
        buildRequest(ctx, HttpMethod.POST, `ap-actions/${path}`, body)
      );
      return response.body;
    },

    async getMeta(resource: string): Promise<unknown> {
      const response = await httpClient.sendRequest(
        buildRequest(ctx, HttpMethod.GET, `ap-actions/meta/${resource}`)
      );
      return response.body;
    },
  };
}
