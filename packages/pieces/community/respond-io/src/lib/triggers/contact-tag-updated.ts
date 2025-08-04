import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';

import { respondIoAuth } from '../common/auth';
import { respondIoApiCall } from '../common/client';

const TRIGGER_KEY = 'respond-io-contact-tag-updated';

export const contactTagUpdatedTrigger = createTrigger({
  auth: respondIoAuth,
  name: 'contact_tag_updated',
  displayName: 'Contact Tag Updated',
  description: 'Triggers when a tag is added or removed from a contact in Respond.io.',
  type: TriggerStrategy.WEBHOOK,
  props: {},

  async onEnable(context) {
    try {
      const response = await respondIoApiCall<{
        data: { id: string };
      }>({
        method: HttpMethod.POST,
        url: '/webhooks',
        auth: context.auth,
        body: {
          url: context.webhookUrl,
          event_types: ['contact.tag.updated'],
        },
      });

      await context.store.put<string>(TRIGGER_KEY, response.data.id);
    } catch (error) {
      throw new Error(`Failed to register webhook: ${(error as Error).message}`);
    }
  },

  async onDisable(context) {
    const webhookId = await context.store.get<string>(TRIGGER_KEY);

    if (!isNil(webhookId)) {
      try {
        await respondIoApiCall({
          method: HttpMethod.DELETE,
          url: `/webhooks/${webhookId}`,
          auth: context.auth,
        });
      } catch (error) {
        console.warn(`Warning: Failed to delete webhook ${webhookId}:`, (error as Error).message);
      } finally {
        await context.store.delete(TRIGGER_KEY);
      }
    }
  },

  async run(context) {
    const payload = context.payload.body as {
      event_type: string;
      contact: Record<string, unknown>;
      tag: string;
      action: 'add' | 'remove';
    };

    if (payload.event_type !== 'contact.tag.updated') return [];

    return [payload];
  },

  async test() {
    return [
      {
        event_type: 'contact.tag.updated',
        event_id: '51f4244b-266d-49d9-9477-74dfeea7dae4',
        tag: 'sampleTag2',
        action: 'add',
        contact: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          phone: '+60123456789',
          email: 'johndoe@sample.com',
          language: 'en',
          profilePic: 'https://cdn.chatapi.net/johndoe.png',
          countryCode: 'MY',
          status: 'open',
          tags: ['sampleTag1', 'sampleTag2'],
          assignee: {
            id: 2,
            firstName: 'John',
            lastName: 'Doe',
            email: 'johndoe@sample.com',
          },
          created_at: 1663274081,
        },
      },
    ];
  },

  sampleData: {},
});
