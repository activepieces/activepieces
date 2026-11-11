import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { constantContactAuth } from '../auth';
import { contactOutputSchema } from '../common/output-schemas';
import { ContactPollConfig, SAMPLE_CONTACT, contactPolling } from '../common/polling';

export const newContactTrigger = createTrigger({
  auth: constantContactAuth,
  name: 'new_contact',
  classification: 'READ',
  displayName: 'New Contact',
  description:
    'Triggers when a contact is added to Constant Contact. Checks every few minutes; each check uses at least one request of the 10,000-a-day Constant Contact API limit, shared with your other integrations.',
  aiMetadata: {
    description:
      'Fires once per contact created in Constant Contact (any source: forms, imports, the API or this piece), with its lists, tags, phone numbers, addresses and custom fields. Contacts deleted before the next check are not reported.',
  },
  type: TriggerStrategy.POLLING,
  props: {},
  outputSchema: contactOutputSchema,
  sampleData: SAMPLE_CONTACT,
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
  storeKey: 'cc_new_contact_checkpoint',
  operation: 'check for new contacts',
  afterParam: 'created_after',
  beforeParam: 'created_before',
  timestampField: 'created_at',
  query: {},
};
