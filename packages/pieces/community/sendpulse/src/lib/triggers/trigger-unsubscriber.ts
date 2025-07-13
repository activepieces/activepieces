import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { sendPulseAuth } from '../common/auth';
import { mailingListId } from '../common/props';

export const unsubscriberTrigger = createTrigger({
  name: 'unsubscriber',
  displayName: 'New Unsubscriber',
  description: 'Fires when one or more subscribers are removed or unsubscribed from a list.',
  auth: sendPulseAuth,
  props: {
    addressBookId: mailingListId,
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    timestamp: '1496827872',
    event: 'unsubscribe',
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