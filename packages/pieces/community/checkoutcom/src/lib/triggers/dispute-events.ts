import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { checkoutComAuth } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const disputeEventsTrigger = createTrigger({
  name: 'dispute_events',
  displayName: 'Dispute Events',
  description: 'Notify operations upon dispute opening or resolution.',
  auth: checkoutComAuth,
  props: {
    eventType: Property.StaticDropdown({
      displayName: 'Event Type',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Dispute Opened', value: 'dispute_opened' },
          { label: 'Dispute Resolved', value: 'dispute_resolved' },
        ],
      },
    }),
  },
  sampleData: {
    id: 'evt_456',
    type: 'dispute_opened',
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