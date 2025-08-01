import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';

import { respondIoAuth } from '../common/auth';
import { respondIoApiCall } from '../common/client';

const TRIGGER_KEY = 'respond-io-contact-updated';

export const contactUpdatedTrigger = createTrigger({
  auth: respondIoAuth,
  name: 'contact_updated',
  displayName: 'Contact Updated',
  description: 'Triggers when an existing contact is updated in Respond.io.',
  type: TriggerStrategy.WEBHOOK,
  props: {},

  async onEnable(context) {
    const token = context.auth as unknown as string;

    try {
      const response = await respondIoApiCall<{
        data: { id: string; url: string };
      }>({
        method: HttpMethod.POST,
        url: '/webhooks',
        auth: token,
        body: {
          url: context.webhookUrl,
          event_types: ['contact.updated'],
        },
      });

      await context.store.put<string>(TRIGGER_KEY, response.data.id);
    } catch (error) {
      throw new Error(`Failed to register webhook: ${(error as Error).message}`);
    }
  },

  async onDisable(context) {
    const token = context.auth as unknown as string;
    const webhookId = await context.store.get<string>(TRIGGER_KEY);

    if (!isNil(webhookId)) {
      try {
        await respondIoApiCall({
          method: HttpMethod.DELETE,
          url: `/webhooks/${webhookId}`,
          auth: token,
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

    if (payload.event_type !== 'contact.updated') return [];

    return [payload];
  },

  async test() {
    return [
      {
        event_type: 'contact.updated',
        event_id: '5733378c-ec01-4bef-87a0-023edcda63f2',
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
