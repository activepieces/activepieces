import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { sendPulseAuth } from '../common/auth';
import { mailingListId } from '../common/props';

export const newSubscriberTrigger = createTrigger({
  name: 'new_subscriber',
  displayName: 'New Subscriber',
  description: 'Fires when one or more new subscribers are added to a mailing list.',
  auth: sendPulseAuth,
  props: {
    addressBookId: mailingListId,
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    timestamp: '1496827625',
    variables: [],
    email: 'john.doe@sendpulse.com',
    source: 'address book',
    book_id: '490686',
    event: 'new_emails',
  },
  async onEnable(context) {},
  async onDisable(context) {},
  async run(context) {
    const payload = context.payload.body;
    const items = Array.isArray(payload) ? payload : [payload];
    const valid = items.filter(item => item && (item.email || item.phone));
    return valid;
  },
}); 