import {
  createTrigger,
  Trigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { oroAuth } from './auth';
import { oroApiCall } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createOroWebhookTrigger = ({
  name,
  description,
  displayName,
  topic,
  event,
  sampleData,
}: {
  name: string;
  description: string;
  displayName: string;
  topic: string;
  event: string;
  sampleData: Record<string, unknown>;
}): Trigger =>
  createTrigger({
    auth: oroAuth,
    name,
    description,
    displayName,
    props: {},
    sampleData,
    type: TriggerStrategy.WEBHOOK,

    async onEnable(context) {
      const response = await oroApiCall({
        method: HttpMethod.POST,
        resourceUri: '/remotewebhooks',
        auth: context.auth,
        body: {
          data: {
            type: 'remotewebhooks',
            attributes: {
              channel: topic,
              event,
              enabled: true,
              notificationUrl: context.webhookUrl,
            },
          },
        },
      });

      await context.store.put<WebhookInformation>(
        `_orocommerce_${name}_trigger`,
        {
          webhookId: response.body.data.id,
          topic,
          event,
        }
      );
    },

    async onDisable(context) {
      const webhookInfo = await context.store.get<WebhookInformation>(
        `_orocommerce_${name}_trigger`
      );

      if (webhookInfo !== null && webhookInfo !== undefined) {
        await oroApiCall({
          method: HttpMethod.DELETE,
          resourceUri: `/remotewebhooks/${webhookInfo.webhookId}`,
          auth: context.auth,
        });
      }
    },

    async run(context) {
      return [context.payload.body];
    },
  });

interface WebhookInformation {
  webhookId: string;
  topic: string;
  event: string;
}
