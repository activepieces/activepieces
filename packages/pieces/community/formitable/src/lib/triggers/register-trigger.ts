import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { formitableAuth } from '../..';
import {
  formitableCommon,
  createWebhook,
  deleteWebhook,
  WebhookResponse,
} from '../common';

export const formitableRegisterTrigger = ({
  name,
  displayName,
  description,
  event,
  sampleData,
}: {
  name: string;
  displayName: string;
  description: string;
  event: string;
  sampleData: unknown;
}) =>
  createTrigger({
    auth: formitableAuth,
    name: `formitable_${name}`,
    displayName,
    description,
    props: {
      restaurant: formitableCommon.restaurant,
    },
    sampleData,
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
      const { restaurant } = context.propsValue;
      const apiKey = context.auth.secret_text;

      const webhook = await createWebhook({
        apiKey,
        restaurantUid: restaurant,
        webhookUrl: context.webhookUrl,
        events: [event],
        secretKey: `ap_${context.webhookUrl.split('/').pop()}`,
      });

      await context.store.put<WebhookResponse>(`formitable_${name}_webhook`, webhook);
    },
    async onDisable(context) {
      const { restaurant } = context.propsValue;
      const apiKey = context.auth.secret_text;

      const webhook = await context.store.get<WebhookResponse>(`formitable_${name}_webhook`);
      if (webhook) {
        await deleteWebhook({
          apiKey,
          restaurantUid: restaurant,
          webhookUid: webhook.uid,
        });
      }
    },
    async run(context) {
      return [context.payload.body];
    },
  });
