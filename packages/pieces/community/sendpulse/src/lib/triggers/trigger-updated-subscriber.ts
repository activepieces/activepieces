import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { sendPulseAuth } from '../common/auth';
import { mailingListId } from '../common/props';

export const updatedSubscriberTrigger = createTrigger({
  name: 'updated_subscriber',
  displayName: 'Updated Subscriber',
  description: 'Fires when one or more subscribers are updated in a mailing list.',
  auth: sendPulseAuth,
  props: {
    addressBookId: mailingListId,
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    timestamp: '1496827422',
    event: 'update',
    book_id: '490686',
    email: 'john.doe@sendpulse.com',
  },
  async onEnable(context) {},
  async onDisable(context) {},
  async run(context) {
    const payload = context.payload.body;
    const items = Array.isArray(payload) ? payload : [payload];
    const valid = items.filter(item => item && item.email);
    return valid;
  },
}); 