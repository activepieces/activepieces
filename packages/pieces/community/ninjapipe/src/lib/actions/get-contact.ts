import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth, ninjapipeCommon } from '../common';

export const getContact = createAction({
  auth: ninjapipeAuth,
  name: 'get_contact',
  displayName: 'Get Contact',
  description: 'Retrieves a contact by ID.',
  audience: 'both',
  aiMetadata: { description: 'Fetch a single contact by its ID. Read-only lookup for inspecting one known contact; to search or enumerate contacts (e.g. find one by email) use the list-contacts action instead.', idempotent: true },
  props: {
    contactId: ninjapipeCommon.contactDropdownRequired,
  },
  async run(context) {
    const auth = getAuth(context);
    const response = await ninjapipeApiCall<Record<string, unknown>>({
      auth,
      method: HttpMethod.GET,
      path: `/contacts/${encodeURIComponent(String(context.propsValue.contactId))}`,
    });
    return flattenCustomFields(response.body);
  },
});
