import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, getAuth, ninjapipeCommon } from '../common';

export const deleteContact = createAction({
  auth: ninjapipeAuth,
  name: 'delete_contact',
  displayName: 'Delete Contact',
  description: 'Deletes a contact by ID.',
  props: {
    contactId: ninjapipeCommon.contactDropdownRequired,
  },
  async run(context) {
    const auth = getAuth(context);
    await ninjapipeApiCall<Record<string, unknown>>({
      auth,
      method: HttpMethod.DELETE,
      path: `/contacts/${encodeURIComponent(String(context.propsValue.contactId))}`,
    });
    return { success: true, deleted_id: context.propsValue.contactId };
  },
});
