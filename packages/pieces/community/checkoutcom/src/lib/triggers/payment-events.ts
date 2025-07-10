import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { checkoutComAuth } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const paymentEventsTrigger = createTrigger({
  name: 'payment_events',
  displayName: 'Payment Events',
  description: 'Trigger order fulfillment when payment is approved.',
  auth: checkoutComAuth,
  props: {
    eventType: Property.StaticDropdown({
      displayName: 'Event Type',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Payment Approved', value: 'payment_approved' },
          { label: 'Payment Captured', value: 'payment_captured' },
          { label: 'Payment Declined', value: 'payment_declined' },
        ],
      },
    }),
  },
  sampleData: {
    id: 'evt_123',
    type: 'payment_approved',
    data: {}
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // Webhook registration logic (if required by Checkout.com)
  },
  async onDisable(context) {
    // Webhook deregistration logic (if required by Checkout.com)
  },
  async run(context) {
    return [context.payload.body];
  },
}); 