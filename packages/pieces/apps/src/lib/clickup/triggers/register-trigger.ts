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
  description
}: {
  name: string,
  displayName: string,
  eventType: string,
  description: string
}) => createTrigger({
  name: `clickup_trigger_${name}`,
  displayName,
  description,
  props: {
    authentication: clickupCommon.authentication,
    workspace_id: clickupCommon.workspace_id(true),
		space_id: clickupCommon.space_id(false),
		list_id: clickupCommon.list_id(false),
    task_id: clickupCommon.task_id(false),
    folder_id: clickupCommon.folder_id(false)
  },
  sampleData: {
    "id": "4b67ac88-e506-4a29-9d42-26e504e3435e",
    "webhook": {
      "id": "4b67ac88-e506-4a29-9d42-26e504e3435e",
      "userid": 183,
      "team_id": 108,
      "endpoint": "https://yourdomain.com/webhook",
      "client_id": "QVOQP06ZXC6CMGVFKB0ZT7J9Y7APOYGO",
      "events": [],
      "task_id": null,
      "list_id": null,
      "folder_id": null,
      "space_id": null,
      "health": {},
      "secret": "O94IM25S7PXBPYTMNXLLET230SRP0S89COR7B1YOJ2ZIE8WQNK5UUKEF26W0Z5GA"
    }
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const { authentication, workspace_id, folder_id, task_id, space_id, list_id } = context.propsValue

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://api.clickup.com/api/v2/team/${workspace_id}/webhook`,
      body: {
        endpoint: context.webhookUrl,
        events: [eventType],
        space_id,
        folder_id,
        list_id,
        task_id
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: authentication.access_token
      },
      queryParams: {},
    }

    const { body } = await httpClient.sendRequest<WebhookInformation>(request);
    //TODO: use hashes? using same trigger for diff usecases, names might collide;
    await context.store.put<WebhookInformation>(`clickup_${name}_trigger`, body);
  },
  async onDisable(context) {
    const response = await context.store.get<WebhookInformation>(`clickup_${name}_trigger`);
    if (response !== null && response !== undefined) {
      const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url: `https://api.clickup.com/api/v2/webhook/${response.id}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.propsValue['authentication']['access_token'],
        },
      };
      await httpClient.sendRequest(request);
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