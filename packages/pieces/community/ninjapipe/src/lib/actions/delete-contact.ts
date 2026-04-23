import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, getAuth } from '../common';

export const deleteContact = createAction({
  auth: ninjapipeAuth,
  name: 'delete_contact',
  displayName: 'Delete Contact',
  description: 'Deletes a contact by ID.',
  props: {
    contactId: Property.ShortText({ displayName: 'Contact ID', required: true }),
  },
  async run(context) {
    const auth = getAuth(context);
    await ninjapipeApiCall<Record<string, any>>({
      auth,
      method: HttpMethod.DELETE,
      path: `/contacts/${context.propsValue.contactId}`,
    });
    return { success: true, deleted_id: context.propsValue.contactId };
  },
});
