import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { simplybookAuth } from '../common';


export const bookingChanged = createTrigger({
  auth: simplybookAuth,
  name: 'booking_changed',
  displayName: 'Booking Change',
  description: 'Triggers when a booking is changed in SimplyBook.me',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  async onEnable(context) {
    // Subscribe to 'change' event webhook will be added through simplybook platform
  },
  async onDisable(context) {
     // Subscribe to 'change' event webhook will be removed through simplybook platform
  },
  async run(context) {
    const body = context.payload.body as any;
     if(body.notification_type !== 'change') {
      return [];
    }
    return [body];
  },
  sampleData: {
    booking_id: '4',
    booking_hash: 'cfae2b34e23ec6e68545d60532234ae8',
    company: 'examplecompany',
    notification_type: 'change',
    webhook_timestamp: 1759919125,
    signature_algo: 'sha256',
  },
});