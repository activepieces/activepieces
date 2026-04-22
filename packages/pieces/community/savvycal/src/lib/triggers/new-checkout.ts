import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { savvyCalApiCall, verifyWebhookSignature } from '../common';
import { savvyCalAuth } from '../../';

const CHECKOUT_TYPES = [
  { label: 'Checkout Pending', value: 'event.checkout.pending' },
  { label: 'Checkout Expired', value: 'event.checkout.expired' },
  { label: 'Checkout Completed', value: 'event.checkout.completed' },
];

const SAMPLE_DATA = {
  event_type: 'event.checkout.completed',
  id: 'chk_abc123',
  state: 'completed',
  amount_total: 5000,
  currency: 'usd',
};

export const newCheckoutTrigger = createTrigger({
  auth: savvyCalAuth,
  name: 'new_checkout',
  displayName: 'New Checkout',
  description: 'Triggers when a checkout event occurs in SavvyCal (payment pending, expired, or completed).',
  props: {
    event_types: Property.StaticMultiSelectDropdown({
      displayName: 'Checkout Types',
      description: 'Select which checkout event types to trigger on. Leave empty to trigger on all checkout types.',
      required: false,
      options: { options: CHECKOUT_TYPES },
    }),
  },
  sampleData: SAMPLE_DATA,
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    const response = await savvyCalApiCall<{ id: string; secret: string }>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/webhooks',
      body: { url: context.webhookUrl },
    });
    await context.store.put('webhookId', response.body.id);
    await context.store.put('webhookSecret', response.body.secret);
  },

  async onDisable(context) {
    const webhookId = await context.store.get<string>('webhookId');
    if (webhookId) {
      await savvyCalApiCall({
        token: context.auth.secret_text,
        method: HttpMethod.DELETE,
        path: `/webhooks/${webhookId}`,
      });
    }
  },

  async run(context) {
    const secret = await context.store.get<string>('webhookSecret');
    const signature = context.payload.headers['x-savvycal-signature'] as string | undefined;
    if (secret && (!signature || !verifyWebhookSignature(secret, signature, context.payload.rawBody))) {
      return [];
    }

    const body = context.payload.body as { type: string; payload: Record<string, unknown> };
    if (!body?.payload) return [];

    if (!CHECKOUT_TYPES.some((t) => t.value === body.type)) return [];

    const selectedTypes = context.propsValue.event_types as string[] | undefined;
    if (selectedTypes && selectedTypes.length > 0 && !selectedTypes.includes(body.type)) return [];

    return [{ event_type: body.type, ...body.payload }];
  },

  async test(_context) {
    return [SAMPLE_DATA];
  },
});
