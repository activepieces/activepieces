import {
  createTrigger,
  httpClient,
  HttpRequest,
  HttpMethod,
  AuthenticationType,
  TriggerStrategy,
} from '@activepieces/framework';
import { clickupCommon } from '../common';
import { ClickupEventType } from '../common/models';

export const clickupRegisterTrigger = ({
  name,
  displayName,
  eventType,
  description,
  sampleData
}: {
  name: string,
  displayName: string,
  eventType: string,
  description: string,
  sampleData: unknown
}) => createTrigger({
  name: `clickup_trigger_${name}`,
  displayName,
  description,
  props: {
    authentication: clickupCommon.authentication,
    workspace_id: clickupCommon.workspace_id(true),
		// space_id: clickupCommon.space_id(true),
		// list_id: clickupCommon.list_id(false),
    // task_id: clickupCommon.task_id(false),
    // folder_id: clickupCommon.folder_id(false)
  },
  sampleData,
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const { authentication, workspace_id } = context.propsValue

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://api.clickup.com/api/v2/team/${workspace_id}/webhook`,
      body: {
        endpoint: context.webhookUrl.replace("http://localhost:3000", "https://aad0-154-122-163-57.eu.ngrok.io"),
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
    //TODO: use hashes? using same trigger for diff usecases, names might collide;
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
    console.debug("payload received", context.payload.body)
    return [context.payload.body];
  },
});

interface WebhookInformation {
  id: string
  webhook: {
    id: string
    userid: 183,
    team_id: 108,
    endpoint: string
    client_id: string
    events: ClickupEventType[],
    task_id: null,
    list_id: null,
    folder_id: null,
    space_id: null,
    health: {
      status: string
      fail_count: number
    },
    secret: string
  }
}