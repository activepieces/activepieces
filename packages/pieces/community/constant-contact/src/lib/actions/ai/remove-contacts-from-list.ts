import { createAction } from '@activepieces/pieces-framework';
import { constantContactAuth } from '../../auth';
import { ccContacts } from '../../common/client';
import { aiInput, aiProps } from '../../common/ai-props';
import { ccInput } from '../../common/props';
import { activityOutputSchema } from '../../common/output-schemas';

export const removeContactsFromListAiAction = createAction({
  auth: constantContactAuth,
  name: 'remove_contacts_from_list_ai',
  classification: 'WRITE',
  displayName: 'Remove Contacts from Lists',
  description: 'Removes contacts from lists.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes up to 500 Constant Contact contacts from up to 50 lists in one background activity; the contacts are kept. Waits up to about 12 seconds and returns the activity state. Fails when the activity reports errors. status.items_total_count 0 means nothing changed: the contacts were already in that state, or the IDs do not exist; check with Get Contact.',
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
    return ccContacts.runActivity({ accessToken: auth.access_token, kind: 'remove_list_memberships', contactIds, targetIds });
  },
});
