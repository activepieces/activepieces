import { createAction } from '@activepieces/pieces-framework';
import { constantContactAuth } from '../../auth';
import { ccContacts } from '../../common/client';
import { aiInput, aiProps } from '../../common/ai-props';
import { ccInput } from '../../common/props';
import { activityOutputSchema } from '../../common/output-schemas';

export const addContactsToListAiAction = createAction({
  auth: constantContactAuth,
  name: 'add_contacts_to_list_ai',
  classification: 'WRITE',
  displayName: 'Add Contacts to Lists',
  description: 'Adds contacts to lists.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds up to 500 existing Constant Contact contacts to up to 50 lists in one background activity, waits up to about 12 seconds and returns its state (use Get Activity Status if still processing). Does not change email permission. Fails when the activity reports errors. status.items_total_count 0 means nothing changed: the contacts were already in that state, or the IDs do not exist; check with Get Contact.',
    idempotent: true,
  },
  outputSchema: activityOutputSchema,
  props: {
    contacts: aiProps.contactRefs(),
    list_ids: aiProps.listIds({ description: 'Comma-separated list IDs (up to 50). Get them from List Contact Lists.' }),
  },
  async run({ auth, propsValue }) {
    const targetIds = ccInput.idList({ value: propsValue.list_ids, label: 'List IDs', max: 50, required: true });
    const contactIds = await aiInput.resolveContactIds({ accessToken: auth.access_token, value: propsValue.contacts, label: 'Contacts' });
    return ccContacts.runActivity({ accessToken: auth.access_token, kind: 'add_list_memberships', contactIds, targetIds });
  },
});
