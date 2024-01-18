import {
  TriggerStrategy, createTrigger
} from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
  AuthenticationType,
} from "@activepieces/pieces-common";
import { callClickupGetTask, clickupCommon } from '../common';
import { ClickupEventType, ClickupWebhookPayload } from '../common/models';
import { clickupAuth } from "../../";

export const triggerTaskTagUpdated = createTrigger({
  auth: clickupAuth,
  name: 'task_tag_updated',
  displayName: 'Task Tag Updated',
  description: 'Triggered when a tag is added or removed or renamed on a task.',
  sampleData: {
    "event": "taskTagUpdated",
    "history_items": [
      {
        "id": "2800797048554170804",
        "type": 1,
        "date": "1642736652800",
        "field": "tag",
        "parent_id": "162641062",
        "data": {},
        "source": null,
        "user": {
          "id": 183,
          "username": "John",
          "email": "john@company.com",
          "color": "#7b68ee",
          "initials": "J",
          "profilePicture": null
        },
        "before": null,
        "after": [
          {
            "name": "def",
            "tag_fg": "#FF4081",
            "tag_bg": "#FF4081",
            "creator": 2770032
          }
        ]
      }
    ],
    "task_id": "1vj38vv",
    "webhook_id": "7fa3ec74-69a8-4530-a251-8a13730bd204"
  },
  props: {
    workspace_id: clickupCommon.workspace_id(true),
    space_id: clickupCommon.space_id(true),
    list_id: clickupCommon.list_id(false),
    task_id: clickupCommon.task_id(false),
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const { workspace_id } = context.propsValue

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://api.clickup.com/api/v2/team/${workspace_id}/webhook`,
      body: {
        endpoint: context.webhookUrl,
        events: [ClickupEventType.TASK_TAG_UPDATED]
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token
      },
      queryParams: {},
    }

    const response = await httpClient.sendRequest<WebhookInformation>(request);
    console.debug(`clickup.${ClickupEventType.TASK_TAG_UPDATED}.onEnable`, response)

    await context.store.put<WebhookInformation>(`clickup_task_tag_updated_trigger`, response.body);
  },
  async onDisable(context) {
    const webhook = await context.store.get<WebhookInformation>(`clickup_task_tag_updated_trigger`);
    if (webhook != null) {
      const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url: `https://api.clickup.com/api/v2/webhook/${webhook.id}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth['access_token'],
        },
      };
      const response = await httpClient.sendRequest(request);
      console.debug(`clickup.${ClickupEventType.TASK_TAG_UPDATED}.onDisable`, response)
    }
  },
  async run(context) {
    const payload = context.payload.body as ClickupWebhookPayload

    return [{
      ...payload,
      task: await callClickupGetTask(
        context.auth['access_token'],
        payload.task_id
      )
    }];
  }
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
