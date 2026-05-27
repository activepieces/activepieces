import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { oroAuth, oroApiCall } from '../common';
import { OroAuth, OroJsonApiCollection, OroJsonApiItem } from '../common/types';
import { HttpMethod } from '@activepieces/pieces-common';

export const oroWebhookTopicTrigger = createTrigger({
  auth: oroAuth,
  name: 'oro-webhook-event',
  displayName: 'Oro Webhook Event',
  description: 'Trigger when a selected webhook event is raised',
  props: {
    topic: Property.Dropdown({
      auth: oroAuth,
      displayName: 'Topic',
      description: 'Only topics accessible by your connection are shown',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return { disabled: true, placeholder: 'Connect your account first', options: [] };
        }

        const response = await oroApiCall({
          method: HttpMethod.GET,
          resourceUri: 'webhooktopics',
          auth: auth as OroAuth,
        });
        const body = response.body as OroJsonApiCollection;

        return {
          options: (body.data ?? []).map((item: OroJsonApiItem) => ({
            label: String(
              item.attributes['label']
                ? item.attributes['label'] + ' (' + item.id + ')'
                : item.id
            ),
            value: item.id,
          })),
        };
      },
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {},

  async onEnable(context) {
    const response = await oroApiCall({
      method: HttpMethod.POST,
      resourceUri: 'webhooks',
      auth: context.auth,
      body: {
        data: {
          type: 'webhooks',
          attributes: {
            enabled: true,
            notificationUrl: context.webhookUrl,
          },
          relationships: {
            topic: {
              data: {
                type: 'webhooktopics',
                id: context.propsValue.topic,
              },
            },
            format: {
              data: {
                type: 'webhookformats',
                id: 'default',
              },
            },
          },
        },
      },
    });

    const webhookId = (response.body as { data?: { id?: string } })?.data?.id;
    if (!webhookId) {
      throw new Error('OroCommerce webhook registration failed: no webhook ID returned. Check your connection and permissions.');
    }

    await context.store.put<WebhookInformation>('webhookInfo', {
      webhookId,
      topic: context.propsValue.topic,
    });
  },

  async onDisable(context) {
    const webhookInfo = await context.store.get<WebhookInformation>('webhookInfo');

    if (webhookInfo !== null && webhookInfo !== undefined) {
      await oroApiCall({
        method: HttpMethod.DELETE,
        resourceUri: `webhooks/${webhookInfo.webhookId}`,
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
}
