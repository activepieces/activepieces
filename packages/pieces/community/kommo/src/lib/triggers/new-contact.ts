import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { kommoAuth, getAccessTokenOrThrow, getApiUrl } from '../auth';
import { KOMMO_WEBHOOK_EVENTS } from '../common';

export const newContactTrigger = createTrigger({
  name: 'new_contact',
  displayName: 'New Contact Added',
  description: 'Triggers when a new contact is added to Kommo',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  auth: kommoAuth,
  sampleData: {
    id: 12345678,
    name: 'Contact Name',
    responsible_user_id: 11111111,
    created_at: 1726573127,
    updated_at: 1726573127,
    custom_fields_values: [
      {
        field_id: 22222222,
        field_name: 'Phone',
        field_code: 'PHONE',
        values: [{ value: '1234567890' }],
      },
      {
        field_id: 33333333,
        field_name: 'Email',
        field_code: 'EMAIL',
        values: [{ value: 'contact@example.com' }],
      },
    ],
  },
  async onEnable(context) {
    const accessToken = getAccessTokenOrThrow(context.auth);

    // Create webhook subscription
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: getApiUrl(context.auth, 'webhooks'),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: {
        destination: context.webhookUrl,
        settings: [
          {
            entity_type: 'contact',
            event: KOMMO_WEBHOOK_EVENTS.CONTACT_ADDED,
          },
        ],
      },
    });

    // Store webhook ID for later deletion
    await context.store.put('webhook_id', response.body.id);
  },

  async onDisable(context) {
    const accessToken = getAccessTokenOrThrow(context.auth);
    const webhookId = await context.store.get('webhook_id');

    if (webhookId) {
      // Delete webhook subscription
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: getApiUrl(context.auth, `webhooks/${webhookId}`),
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    }
  },

  async run(context) {
    const payload = context.payload.body as Record<string, any>;

    // Check if the payload contains new contacts
    if (payload?.contacts?.add && Array.isArray(payload.contacts.add)) {
      // Filter out companies (they also come through the contacts webhook)
      return payload.contacts.add.filter((contact: any) => contact.type === 'contact');
    }

    return [];
  },
});
