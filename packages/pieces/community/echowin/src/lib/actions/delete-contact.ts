import { createAction, Property } from '@activepieces/pieces-framework';
import { echowinAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const deleteContact = createAction({
  auth: echowinAuth,
  name: 'deleteContact',
  displayName: 'Delete Contact',
  description: 'Delete a contact by ID',
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The unique identifier of the contact to delete',
      required: true,
    }),
  },
  async run(context) {
    const { contactId } = context.propsValue;

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.DELETE,
      `/contacts/${contactId}`
    );

    return response.body;
  },
});
