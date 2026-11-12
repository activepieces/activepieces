import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { constantContactAuth } from '../auth';
import { contactOutputSchema } from '../common/output-schemas';
import { ContactPollConfig, SAMPLE_UNSUBSCRIBED_CONTACT, contactPolling } from '../common/polling';

export const contactUnsubscribedTrigger = createTrigger({
  auth: constantContactAuth,
  name: 'contact_unsubscribed',
  classification: 'READ',
  displayName: 'Contact Unsubscribed',
  description:
    'Triggers when a contact unsubscribes from your emails (or is unsubscribed by the account). Checks every few minutes and uses the shared 10,000-a-day API limit.',
  aiMetadata: {
    description:
      'Fires once per contact whose email permission changed to unsubscribed, with the opt-out date, source (Contact or Account) and reason in email_address.',
  },
  type: TriggerStrategy.POLLING,
  props: {},
  outputSchema: contactOutputSchema,
  sampleData: SAMPLE_UNSUBSCRIBED_CONTACT,
  async onEnable(context) {
    await contactPolling.onEnable({ store: context.store, isRepublish: context.isRepublish, config: CONFIG });
  },
  async onDisable(context) {
    await contactPolling.onDisable({ store: context.store, config: CONFIG });
  },
  async test(context) {
    return contactPolling.sample({ accessToken: context.auth.access_token, config: CONFIG });
  },
  async run(context) {
    return contactPolling.poll({ accessToken: context.auth.access_token, store: context.store, config: CONFIG });
  },
});

const CONFIG: ContactPollConfig = {
  storeKey: 'cc_contact_unsubscribed_checkpoint',
  operation: 'check for unsubscribed contacts',
  afterParam: 'optout_after',
  beforeParam: 'optout_before',
  timestampField: 'opt_out_date',
  query: { status: 'unsubscribed' },
};
