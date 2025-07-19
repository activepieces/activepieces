import {
  createTrigger,
  TriggerStrategy,
  WebhookResponse,
  Property,
} from '@activepieces/pieces-framework';
import { sendpulseAuth } from '../common/auth';

export const newUnsubscriberTrigger = createTrigger({
  auth: sendpulseAuth,
  name: 'new_unsubscriber',
  displayName: 'New Unsubscriber',
  description: 'Triggers when a subscriber is removed or unsubscribed from a mailing list.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    addressBookId: Property.Number({
      displayName: 'Mailing List ID',
      description: 'The ID of the mailing list to monitor for unsubscribes.',
      required: true,
    }),
  },

  async onEnable(context) {
    const { addressBookId } = context.propsValue;
    await context.store.put('sendpulse-unsubscribe-list-id', String(addressBookId));
    console.log(`Webhook enabled for unsubscribes in list ID: ${addressBookId}`);
  },

  async onDisable(context) {
    await context.store.delete('sendpulse-unsubscribe-list-id');
    console.log(`Webhook disabled for unsubscribes`);
  },

  async run(context) {
    const storedListId = await context.store.get('sendpulse-unsubscribe-list-id');
    interface UnsubscribePayload {
      email?: string;
      phone?: string;
      addressbook_id: number;
      event: string;
      reason?: string;
      [key: string]: any;
    }

    const payload = context.payload.body as UnsubscribePayload;

    if (!payload || String(payload.addressbook_id) !== storedListId || payload.event !== 'unsubscribe') {
      return [];
    }

    return [
      {
        id: payload.email || payload.phone || new Date().toISOString(),
        email: payload.email,
        phone: payload.phone,
        addressBookId: payload.addressbook_id,
        unsubscribedAt: new Date().toISOString(),
        reason: payload.reason || 'Unknown',
        rawEvent: payload,
      },
    ];
  },

  async test() {
    return [
      {
        id: 'test-unsubscribe@example.com',
        email: 'test-unsubscribe@example.com',
        phone: null,
        addressBookId: 123456,
        unsubscribedAt: new Date().toISOString(),
        reason: 'User clicked unsubscribe',
        rawEvent: {
          email: 'test-unsubscribe@example.com',
          addressbook_id: 123456,
          event: 'unsubscribe',
          reason: 'User clicked unsubscribe',
        },
      },
    ];
  },

  sampleData: {
    id: 'unsub@example.com',
    email: 'unsub@example.com',
    phone: null,
    addressBookId: 123456,
    unsubscribedAt: '2025-07-13T12:00:00.000Z',
    reason: 'Manual removal',
    rawEvent: {
      email: 'unsub@example.com',
      addressbook_id: 123456,
      event: 'unsubscribe',
      reason: 'Manual removal',
    },
  },
});
