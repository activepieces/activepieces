import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { callClickupGetTask, clickupCommon } from '../common';
import { ClickupEventType, ClickupWebhookPayload } from '../common/models';
import { clickupAuth } from '../../';

export const clickupRegisterTrigger = ({
  name,
  displayName,
  eventType,
  description,
  sampleData,
}: {
  name: string;
  displayName: string;
  eventType: ClickupEventType;
  description: string;
  sampleData: unknown;
}) =>
  createTrigger({
    auth: clickupAuth,
    name: `clickup_trigger_${name}`,
    displayName,
    description,
    props: {
      workspace_id: clickupCommon.workspace_id(true),
      space_id: clickupCommon.space_id(false), // Optional, depends on workspace
      folder_id: clickupCommon.folder_id(false), // Optional, depends on space
      list_id: clickupCommon.list_id(false), // Optional, depends on folder or space
      task_id: clickupCommon.task_id(false), // Optional, depends on list
    },
    sampleData,
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
      const { workspace_id, space_id, folder_id, list_id, task_id } =
        context.propsValue;

      const requestBody: Record<string, unknown> = {
        endpoint: context.webhookUrl,
        events: [eventType],
      };

      // Add scope narrowing properties to the webhook request body
      if (space_id) requestBody.space_id = space_id;
      if (folder_id) requestBody.folder_id = folder_id;
      if (list_id) requestBody.list_id = list_id;
      if (task_id) requestBody.task_id = task_id;

      const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `https://api.clickup.com/api/v2/team/${workspace_id}/webhook`,
        body: requestBody,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.access_token,
        },
        queryParams: {},
      };

      const response = await httpClient.sendRequest<WebhookInformation>(
        request
      );
      console.debug(`clickup.${eventType}.onEnable`, response);

      await context.store.put<WebhookInformation>(
        `clickup_${name}_trigger`,
        response.body
      );
    },
    async onDisable(context) {
      const webhook = await context.store.get<WebhookInformation>(
        `clickup_${name}_trigger`
      );
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
        console.debug(`clickup.${eventType}.onDisable`, response);
      }
    },
    async run(context) {
      const payload = context.payload.body as ClickupWebhookPayload;

      if (
        [
          ClickupEventType.TASK_CREATED,
          ClickupEventType.TASK_UPDATED,
          ClickupEventType.TASK_COMMENT_POSTED,
          ClickupEventType.TASK_COMMENT_UPDATED,
        ].includes(eventType)
      ) {
        const enriched = [
          {
            ...payload,
            task: await callClickupGetTask(
              context.auth['access_token'],
              payload.task_id
            ),
          },
        ];

        console.debug('payload enriched', enriched);
        return enriched;
      }

      return [context.payload.body];
    },
  });

interface WebhookInformation {
  id: string;
  webhook: {
    id: string;
    userid: number;
    team_id: number;
    endpoint: string;
    client_id: string;
    events: ClickupEventType[];
    task_id?: string;
    list_id?: string;
    folder_id?: string;
    space_id?: string;
    health: {
      status: string;
      fail_count: number;
    };
    secret: string;
  };
}
