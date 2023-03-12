import {
  createTrigger,
  httpClient,
  HttpRequest,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/framework';
import { TriggerStrategy } from '@activepieces/shared';
import { callClickupGetTask, clickupCommon } from '../common';
import { ClickupEventType, ClickupWebhookPayload } from '../common/models';

export const clickupRegisterTrigger = ({
  name,
  displayName,
  eventType,
  description,
  sampleData
}: {
  name: string,
  displayName: string,
  eventType: ClickupEventType,
  description: string,
  sampleData: unknown
}) => createTrigger({
  name: `clickup_trigger_${name}`,
  displayName,
  description,
  props: {
    authentication: clickupCommon.authentication,
    workspace_id: clickupCommon.workspace_id(true)
  },
  sampleData,
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const { authentication, workspace_id } = context.propsValue

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://api.clickup.com/api/v2/team/${workspace_id}/webhook`,
      body: {
        endpoint: context.webhookUrl,
        events: [eventType]
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: authentication.access_token
      },
      queryParams: {},
    }

    const response = await httpClient.sendRequest<WebhookInformation>(request);
    console.debug(`clickup.${eventType}.onEnable`, response)

    await context.store.put<WebhookInformation>(`clickup_${name}_trigger`, response.body);
  },
  async onDisable(context) {
    const webhook = await context.store.get<WebhookInformation>(`clickup_${name}_trigger`);
    if (webhook != null) {
      const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url: `https://api.clickup.com/api/v2/webhook/${webhook.id}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.propsValue['authentication']['access_token'],
        },
      };
      const response = await httpClient.sendRequest(request);
      console.debug(`clickup.${eventType}.onDisable`, response)
    }
  },
  async run(context) {
    const payload = context.payload.body as ClickupWebhookPayload

    if (
      [
        ClickupEventType.TASK_CREATED,
        ClickupEventType.TASK_UPDATED,
        ClickupEventType.TASK_COMMENT_POSTED,
        ClickupEventType.TASK_COMMENT_UPDATED,
      ].includes(eventType)
    ) {
      const enriched = [{
        ...payload,
        task: await callClickupGetTask(
          context.propsValue['authentication']['access_token'],
          payload.task_id
        )
      }]

      console.debug("payload enriched", enriched)
      return enriched
    }

    return [context.payload.body]
  },
});

interface WebhookInformation {
  id: string
  webhook: {
    id: string
    userid: number
    team_id: number
    endpoint: string
    client_id: string
    events: ClickupEventType[]
    task_id: string
    list_id: string
    folder_id: string
    space_id: string
    health: {
      status: string
      fail_count: number
    },
    secret: string
  }
}
