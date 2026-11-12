import { createAction } from '@activepieces/pieces-framework';
import { constantContactAuth } from '../../auth';
import { ccContacts } from '../../common/client';
import { aiInput, aiProps } from '../../common/ai-props';
import { ccInput } from '../../common/props';
import { activityOutputSchema } from '../../common/output-schemas';

export const addTagsToContactsAiAction = createAction({
  auth: constantContactAuth,
  name: 'add_tags_to_contacts_ai',
  classification: 'WRITE',
  displayName: 'Add Tags to Contacts',
  description: 'Adds tags to contacts.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds up to 50 tags to up to 500 Constant Contact contacts in one background activity. Waits up to about 12 seconds and returns the activity state. Fails when the activity reports errors. status.items_total_count 0 means nothing changed: the contacts were already in that state, or the IDs do not exist; check with Get Contact.',
    idempotent: true,
  },
  outputSchema: activityOutputSchema,
  props: {
    contacts: aiProps.contactRefs(),
    tag_ids: aiProps.tagIds({ description: 'Comma-separated tag IDs (up to 50). Get them from List Tags.' }),
  },
  async run({ auth, propsValue }) {
    const targetIds = ccInput.idList({ value: propsValue.tag_ids, label: 'Tag IDs', max: 50, required: true });
    const contactIds = await aiInput.resolveContactIds({ accessToken: auth.access_token, value: propsValue.contacts, label: 'Contacts' });
    return ccContacts.runActivity({ accessToken: auth.access_token, kind: 'contacts_taggings_add', contactIds, targetIds });
  },
});
