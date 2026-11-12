import { createAction } from '@activepieces/pieces-framework';
import { constantContactAuth } from '../auth';
import { ccContacts } from '../common/client';
import { activityOutputSchema } from '../common/output-schemas';
import { ccInput, ccProps } from '../common/props';

export const addContactToList = createAction({
  auth: constantContactAuth,
  name: 'add_contact_to_list',
  classification: 'WRITE',
  displayName: 'Add Contact to List',
  description: 'Adds an existing contact to a list. Constant Contact processes this in the background; the step waits up to about 12 seconds for it to finish. This does not change the email permission of the contact.',
  audience: 'human',
  aiMetadata: {
    description: 'Adds one existing Constant Contact contact to one list without changing its email permission.',
    idempotent: true,
  },
  outputSchema: activityOutputSchema,
  props: {
    contact: ccProps.contactRef({
      displayName: 'Contact Email or ID',
      description: 'The email address of the contact, or its contact ID from an earlier step.',
    }),
    list: ccProps.listSingle({ displayName: 'List', description: 'The list to add the contact to.' }),
  },
  async run({ auth, propsValue }) {
    const targetIds = ccInput.idList({ value: [propsValue.list], label: 'List', max: 1, required: true });
    const contactId = await ccContacts.resolveContactId({ accessToken: auth.access_token, value: propsValue.contact, label: 'Contact Email or ID', verify: true });
    return ccContacts.runActivity({ accessToken: auth.access_token, kind: 'add_list_memberships', contactIds: [contactId], targetIds });
  },
});
