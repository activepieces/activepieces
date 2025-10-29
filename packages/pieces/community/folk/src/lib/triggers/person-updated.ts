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
    eventType: 'person.updated',
    eventId: 'evt_123e4567-e89b-12d3-a456-426614174000',
    timestamp: '2025-10-28T12:00:00.000Z',
    data: {
      id: 'per_183ed5cc-3182-45de-84d1-d520f2604810',
      firstName: 'John',
      lastName: 'Doe',
      fullName: 'John Doe',
      description: 'John Doe is a software engineer at Tech Corp.',
      birthday: '1980-06-15',
      jobTitle: 'Software Engineer',
      createdAt: '2021-01-01T00:00:00.000Z',
      createdBy: {
        id: 'usr_bc984b3f-0386-434d-82d7-a91eb6badd71',
        fullName: 'John Doe',
        email: 'john.doe@example.com',
      },
      groups: [
        {
          id: 'grp_5fa60242-0756-4e31-8cca-30c2c5ff1ac2',
          name: 'Engineering',
        },
      ],
      companies: [
        {
          id: 'com_92346499-30bf-4278-ae8e-4aa3ae2ace2c',
          name: 'Tech Corp',
        },
      ],
      addresses: ['123 Main St, Springfield, USA'],
      emails: ['john@example.com'],
      phones: ['+1234567890'],
      urls: ['https://example.com'],
      customFieldValues: {},
      interactionMetadata: {
        user: {
          approximateCount: 21,
          lastInteractedAt: '2025-05-01T00:00:00Z',
        },
        workspace: {
          approximateCount: 21,
          lastInteractedAt: '2025-05-01T00:00:00Z',
          lastInteractedBy: [
            {
              id: 'usr_bc984b3f-0386-434d-82d7-a91eb6badd71',
              fullName: 'John Doe',
              email: 'john.doe@example.com',
            },
          ],
        },
      },
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
    return [payloadBody];
  },
});
