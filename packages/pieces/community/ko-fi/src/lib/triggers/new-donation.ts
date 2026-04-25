import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';

import { koFiAuth } from '../auth';

/** Shape of the Ko-fi `Donation` event after URL-decoding and JSON-parsing the form-post body. */
type KoFiDonationEvent = {
  verification_token: string;
  message_id: string;
  timestamp: string;
  type: string;
  is_public: boolean;
  from_name: string;
  message: string;
  amount: string;
  url: string;
  email: string;
  currency: string;
  is_subscription_payment: boolean;
  is_first_subscription_payment: boolean;
  kofi_transaction_id: string;
};

/** Shape of the URL-encoded form-post body Ko-fi sends to the webhook URL. */
type KoFiWebhookBody = {
  data: string;
};

/** Trigger emitted when a one-time tip lands on the configured Ko-fi creator account. */
export const newDonation = createTrigger({
  auth: koFiAuth,
  name: 'new_donation',
  displayName: 'New Donation',
  description: 'Triggers when a new one-time donation is received on Ko-fi.',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    verification_token: 'abc123-uuid',
    message_id: '3a1fac0c-f960-4506-a60e-2e3f3d09e6e0',
    timestamp: '2026-04-24T19:15:00Z',
    type: 'Donation',
    is_public: true,
    from_name: 'Supporter Name',
    message: 'Thanks for the work you do!',
    amount: '5.00',
    url: 'https://ko-fi.com/Home/CoffeeShop?txid=00000000-1111-2222-3333-444444444444',
    email: 'supporter@example.com',
    currency: 'USD',
    is_subscription_payment: false,
    is_first_subscription_payment: false,
    kofi_transaction_id: '00000000-1111-2222-3333-444444444444',
  },

  /** No-op: Ko-fi has no API to register the webhook URL — the user pastes it into Ko-fi Dashboard manually. */
  async onEnable(): Promise<void> {
    return;
  },

  /** No-op: Ko-fi has no API to remove the webhook URL — the user clears it from Ko-fi Dashboard manually. */
  async onDisable(): Promise<void> {
    return;
  },

  async run(context): Promise<KoFiDonationEvent[]> {
    const body = context.payload.body as KoFiWebhookBody;
    if (typeof body?.data !== 'string') {
      return [];
    }

    let event: KoFiDonationEvent;
    try {
      event = JSON.parse(body.data) as KoFiDonationEvent;
    } catch {
      return [];
    }

    if (event.verification_token !== context.auth.secret_text) {
      return [];
    }
    if (event.type !== 'Donation') {
      return [];
    }

    const { verification_token: _omit, ...payload } = event;
    return [payload as KoFiDonationEvent];
  },
});
