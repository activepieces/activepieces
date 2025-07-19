import {
  createTrigger,
  TriggerStrategy,
  WebhookResponse,
  Property,
} from '@activepieces/pieces-framework';
import { sendpulseAuth } from '../common/auth';

export const updatedSubscriberTrigger = createTrigger({
  auth: sendpulseAuth,
  name: 'updated_subscriber',
  displayName: 'Updated Subscriber',
  description: 'Triggers when a subscriber’s email, phone, or variables are updated.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    addressBookId: Property.Number({
      displayName: 'Mailing List ID',
      description: 'The ID of the mailing list to monitor for updates.',
      required: true,
    }),
  },

  async onEnable(context) {
    const { addressBookId } = context.propsValue;
    await context.store.put('sendpulse-subscriber-update-list-id', String(addressBookId));
    console.log(`Webhook enabled for subscriber updates in list ID: ${addressBookId}`);
  },

  async onDisable() {
    console.log(`Webhook disabled for Updated Subscriber`);
  },

  async run(context) {
    const storedListId = await context.store.get('sendpulse-subscriber-update-list-id');
    interface IncomingPayload {
      email?: string;
      phone?: string;
      addressbook_id?: number | string;
      [key: string]: any;
    }
    const incoming = context.payload.body as IncomingPayload;

    if (!incoming || String(incoming.addressbook_id) !== storedListId) {
      return [];
    }

    return [
      {
        id: incoming.email || incoming.phone || new Date().toISOString(),
        email: incoming.email,
        phone: incoming.phone,
        addressBookId: incoming.addressbook_id,
        updatedAt: new Date().toISOString(),
        changes: incoming,
      },
    ];
  },

  async test() {
    return [
      {
        id: 'test-updated@example.com',
        email: 'test-updated@example.com',
        phone: '+1234567890',
        addressBookId: 123456,
        updatedAt: new Date().toISOString(),
        changes: {
          email: 'test-updated@example.com',
          phone: '+1234567890',
          addressbook_id: 123456,
          event: 'subscriber_updated',
        },
      },
    ];
  },

  sampleData: {
    id: 'updated-user@example.com',
    email: 'updated-user@example.com',
    phone: '+19876543210',
    addressBookId: 123456,
    updatedAt: '2025-07-13T12:00:00.000Z',
    changes: {
      email: 'updated-user@example.com',
      phone: '+19876543210',
      addressbook_id: 123456,
      event: 'subscriber_updated',
      variables: {
        first_name: 'UpdatedName',
      },
    },
  },
});
