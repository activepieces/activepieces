import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { constantContactAuth } from '../auth';
import { contactOutputSchema } from '../common/output-schemas';
import { ContactPollConfig, SAMPLE_CONTACT, contactPolling } from '../common/polling';

export const updatedContactTrigger = createTrigger({
  auth: constantContactAuth,
  name: 'updated_contact',
  classification: 'READ',
  displayName: 'Updated Contact',
  description:
    'Triggers when a contact is created or changed in Constant Contact, including changes made by this piece, so a flow that updates the same contact can trigger itself in a loop. Checks every few minutes and uses the shared 10,000-a-day API limit.',
  aiMetadata: {
    description:
      'Fires once per change to a contact (its updated_at time), including new contacts and changes made by the actions of this piece, so avoid updating the same contact from the flow it triggers. Payload is the full contact with lists, tags and custom fields.',
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
  storeKey: 'cc_updated_contact_checkpoint',
  operation: 'check for updated contacts',
  afterParam: 'updated_after',
  beforeParam: 'updated_before',
  timestampField: 'updated_at',
  query: {},
};
