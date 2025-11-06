import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { folkAuth } from '../common/auth';
import { folkClient } from '../common/client';
import { folkProps } from '../common/props';

export const personUpdated = createTrigger({
  auth: folkAuth,
  name: 'person_updated',
  displayName: 'Person Updated',
  description: 'Fires when a person is updated in your Folk workspace.',
  props: {
    groupId: folkProps.group_id(false, 'Group ID'),
  },
  sampleData: {
    id: 'evt_6004f2ef-dcc3-4c56-a704-9326730ad100',
    type: 'person.updated',
    createdAt: '2025-09-30T09:55:52.715Z',
    source:
      'https://api.folk.app/v1/webhooks/wbk_2f15ec4f-0f70-4884-a43d-1f88ef7a6665',
    data: {
      id: 'per_05837e2d-9bf7-4f17-8729-e95f1be4de67',
      url: 'https://api.folk.app/v1/people/per_05837e2d-9bf7-4f17-8729-e95f1be4de67',
      changes: [
        {
          path: ['firstName'],
          type: 'set',
          value: 'John',
        },
        {
          path: ['description'],
          type: 'set',
        },
        {
          path: ['companies'],
          type: 'add',
          value: [{ id: 'com_3b7d7b65-4c2d-4b65-822a-6bc759e1e951' }],
        },
        {
          path: [
            'customFieldValues',
            'grp_bc984b3f-0386-434d-82d7-a91eb6badd71',
            'Status',
          ],
          type: 'set',
          value: 'In Progress',
        },
        {
          path: [
            'customFieldValues',
            'grp_bc984b3f-0386-434d-82d7-a91eb6badd71',
            'Tags',
          ],
          type: 'remove',
          value: ['VIP'],
        },
        {
          path: [
            'customFieldValues',
            'grp_bc984b3f-0386-434d-82d7-a91eb6badd71',
            'Assigned to',
          ],
          type: 'add',
          value: [{ id: 'usr_3b7d7b65-4c2d-4b65-822a-6bc759e1e951' }],
        },
      ],
    },
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    const eventConfig: any = {
      eventType: 'person.updated',
    };

    if (context.propsValue?.groupId) {
      eventConfig.filter = {
        groupId: context.propsValue.groupId,
      };
    }

    const subscribedEvents = [eventConfig];

    const webhook = await folkClient.createWebhook({
      apiKey: context.auth,
      name: `Activepieces Person Updated - ${Date.now()}`,
      targetUrl: context.webhookUrl,
      subscribedEvents,
    });

    await context.store?.put('_webhookId', webhook.data.id);
    // await context.store?.put('_signingSecret', webhook.data.signingSecret);
  },

  async onDisable(context) {
    const webhookId = (await context.store?.get('_webhookId')) as string;
    if (webhookId) {
      try {
        await folkClient.deleteWebhook({
          apiKey: context.auth,
          webhookId,
        });
      } catch (error) {
        console.warn('Failed to delete webhook:', error);
      }
    }
  },

  async run(context) {
    const payloadBody = context.payload.body as any;
    if (payloadBody.type !== 'person.updated') {
      return [];
    }
    return [payloadBody];
  },
});
