import { createAction } from '@activepieces/pieces-framework';
import { constantContactAuth } from '../auth';
import { ccContacts } from '../common/client';
import { activityOutputSchema } from '../common/output-schemas';
import { ccInput, ccProps } from '../common/props';

export const removeContactFromList = createAction({
  auth: constantContactAuth,
  name: 'remove_contact_from_list',
  classification: 'WRITE',
  displayName: 'Remove Contact from List',
  description: 'Removes a contact from a list. The contact itself is kept. Constant Contact processes this in the background; the step waits up to about 12 seconds for it to finish.',
  audience: 'human',
  aiMetadata: {
    description: 'Removes one Constant Contact contact from one list; the contact is kept.',
    idempotent: true,
  },
  outputSchema: activityOutputSchema,
  props: {
    contact: ccProps.contactRef({
      displayName: 'Contact Email or ID',
      description: 'The email address of the contact, or its contact ID from an earlier step.',
    }),
    list: ccProps.listSingle({ displayName: 'List', description: 'The list to remove the contact from.' }),
  },
  async run({ auth, propsValue }) {
    const targetIds = ccInput.idList({ value: [propsValue.list], label: 'List', max: 1, required: true });
    const contactId = await ccContacts.resolveContactId({ accessToken: auth.access_token, value: propsValue.contact, label: 'Contact Email or ID', verify: true });
    return ccContacts.runActivity({ accessToken: auth.access_token, kind: 'remove_list_memberships', contactIds: [contactId], targetIds });
  },
});
