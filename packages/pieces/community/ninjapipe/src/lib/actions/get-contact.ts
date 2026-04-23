import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth } from '../common';

export const getContact = createAction({
  auth: ninjapipeAuth,
  name: 'get_contact',
  displayName: 'Get Contact',
  description: 'Retrieves a contact by ID.',
  props: {
    contactId: Property.ShortText({ displayName: 'Contact ID', required: true }),
  },
  async run(context) {
    const auth = getAuth(context);
    const response = await ninjapipeApiCall<Record<string, any>>({
      auth,
      method: HttpMethod.GET,
      path: `/contacts/${context.propsValue.contactId}`,
    });
    return flattenCustomFields(response.body);
  },
});
