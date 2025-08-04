import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';

import { respondIoAuth } from '../common/auth';
import { respondIoApiCall } from '../common/client';

const TRIGGER_KEY = 'respond-io-contact-created';

export const newContactTrigger = createTrigger({
  auth: respondIoAuth,
  name: 'new_contact',
  displayName: 'New Contact',
  description: 'Triggers when a new contact is created in Respond.io.',
  type: TriggerStrategy.WEBHOOK,
  props: {},

  async onEnable(context) {
    try {
      const response = await respondIoApiCall<{
        data: { id: string; url: string };
      }>({
        method: HttpMethod.POST,
        url: '/webhooks',
        auth: context.auth,
        body: {
          url: context.webhookUrl,
          event_types: ['contact.created'],
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
    };

    if (payload.event_type !== 'contact.created') return [];

    return [payload];
  },

  async test() {
    return [
      {
        event_type: 'contact.created',
        event_id: 'a96bbd0e-7463-4bdc-a49e-24ca9f183bfb',
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
          blood_group: null,
          employee_type: null,
          bool: null,
          number: null,
          phone_number_02: null,
          new_1_text: null,
          new_2_text: null,
          new_2: null,
          test_field: null,
          test: null,
          rgwgrwrwg: null,
          alfqrat_fy_alsfgrw: null,
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
