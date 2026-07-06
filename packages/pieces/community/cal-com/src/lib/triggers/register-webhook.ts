import {
  createTrigger,
  Trigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { calcomAuth } from '../..';

export const registerWebhooks = ({
  name,
  description,
  displayName,
  sampleData,
  aiMetadata,
}: {
  name: string;
  description: string;
  displayName: string;
  sampleData: Record<string, unknown>;
  aiMetadata?: { description: string };
}) =>
  createTrigger({
    auth: calcomAuth,
    name,
    description,
    displayName,
    aiMetadata,
    props: {},
    sampleData: sampleData,
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
      const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `https://api.cal.com/v2/webhooks`,
        body: {
          triggers: [name],
          subscriberUrl: context.webhookUrl,
          active: true,
        },
        headers: {
          Authorization: `Bearer ${context.auth.secret_text}`,
          'cal-api-version': '2024-06-14',
        },
      };

      const response = await httpClient.sendRequest<WebhookResponseBody>(
        request
      );

      if (response.status === 200 || response.status === 201) {
        console.debug('trigger.onEnable', response.body.data, context);
        await context.store?.put(
          `cal_com_trigger_${name}`,
          response.body.data
        );
      }
    },
    async onDisable(context) {
      const data = await context.store?.get<WebhookInformation>(
        `cal_com_trigger_${name}`
      );
      if (data != null) {
        const request: HttpRequest = {
          method: HttpMethod.DELETE,
          url: `https://api.cal.com/v2/webhooks/${data.id}`,
          headers: {
            Authorization: `Bearer ${context.auth.secret_text}`,
            'cal-api-version': '2024-06-14',
          },
        };

        try {
          const response = await httpClient.sendRequest(request);
          console.debug('trigger.onDisable', response);
        } catch (e: any) {
          // 404 means the webhook was registered under the old v1 API and no
          // longer exists in v2 — safe to ignore, re-enabling will create a
          // fresh v2 webhook.
          if (e?.response?.status !== 404) throw e;
          console.debug('trigger.onDisable: webhook not found in v2 (was v1), ignoring');
        }
      } else {
        console.debug(`trigger 'cal_com_trigger_${name}' not found`);
      }
    },
    async run(context) {
      console.debug('trigger running', context);
      return [context.payload.body];
    },
  });

interface WebhookInformation {
  id: string;
  userId: number;
  eventTypeId?: null | string;
  payloadTemplate?: null | string;
  triggers: string[];
  appId?: null | string;
  subscriberUrl: string;
}

interface WebhookResponseBody {
  data: WebhookInformation;
  status: string;
}
