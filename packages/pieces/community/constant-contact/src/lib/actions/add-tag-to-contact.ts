import { createAction } from '@activepieces/pieces-framework';
import { constantContactAuth } from '../auth';
import { ccContacts } from '../common/client';
import { activityOutputSchema } from '../common/output-schemas';
import { ccInput, ccProps } from '../common/props';

export const addTagToContact = createAction({
  auth: constantContactAuth,
  name: 'add_tag_to_contact',
  classification: 'WRITE',
  displayName: 'Add Tag to Contact',
  description: 'Adds a tag to an existing contact. Constant Contact processes this in the background; the step waits up to about 12 seconds for it to finish.',
  audience: 'human',
  aiMetadata: {
    description: 'Adds one tag to one existing Constant Contact contact.',
    idempotent: true,
  },
  outputSchema: activityOutputSchema,
  props: {
    contact: ccProps.contactRef({
      displayName: 'Contact Email or ID',
      description: 'The email address of the contact, or its contact ID from an earlier step.',
    }),
    tag: ccProps.tagSingle({ displayName: 'Tag', description: 'The tag to add to the contact.' }),
  },
  async run({ auth, propsValue }) {
    const targetIds = ccInput.idList({ value: [propsValue.tag], label: 'Tag', max: 1, required: true });
    const contactId = await ccContacts.resolveContactId({ accessToken: auth.access_token, value: propsValue.contact, label: 'Contact Email or ID', verify: true });
    return ccContacts.runActivity({ accessToken: auth.access_token, kind: 'contacts_taggings_add', contactIds: [contactId], targetIds });
  },
});
